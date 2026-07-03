"""FastAPI entrypoint. Wires the router/evaluator, Claude client, rule-based
solver, sandbox verification, and shared problem cache into three endpoints:

    GET  /health
    POST /route   — preview how a request would be routed, without solving
    POST /solve   — the full pipeline; returns a SolveResponse
    POST /chat    — Ask Solvr follow-up chat, scoped to a solved session

See ARCHITECTURE.md "Router / Evaluator" and PLAN.md §9 for the design.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .auth import require_app_key
from .cache import ProblemCache, content_hash
from .claude_client import ClaudeClient
from .config import get_settings
from .models import (
    ChatRequest,
    ChatResponse,
    PracticeRequest,
    PracticeResponse,
    RoutingDecision,
    SolveRequest,
    SolveResponse,
)
from .results import SolveResult
from .router import ClassificationInput, decide_engine
from .rule_solver import solve_trivial
from .verify import verify_numeric

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("solvr")

# Base64 images are the only large payloads this API accepts. This is a basic
# backstop against accidental/malicious oversized uploads — not a substitute
# for a reverse-proxy/load-balancer limit, which Railway may also apply.
MAX_BODY_BYTES = int(os.environ.get("SOLVR_MAX_BODY_BYTES", str(12 * 1024 * 1024)))


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > MAX_BODY_BYTES:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": f"Request body exceeds {MAX_BODY_BYTES} bytes"},
                    )
            except ValueError:
                pass
        return await call_next(request)


settings = get_settings()
app = FastAPI(title="Solvr API", version="0.1.0")

app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # FastAPI's built-in HTTPException handling takes precedence over this —
    # this only catches genuinely unexpected errors (a Claude API error not
    # wrapped in HTTPException, a bug). Log the real error server-side; never
    # leak internals to the client.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


_cache = ProblemCache(settings.database_path)
_claude = ClaudeClient(settings)

# Ephemeral session context for "Ask Solvr" follow-up chat, keyed by session
# id. Production should persist this in Postgres (PLAN.md §9.4) so it
# survives a restart; an in-process dict is the pragmatic choice for now.
_session_context: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _finalize_steps(raw_steps: list[dict]) -> list[dict]:
    """Neither Claude's structured output nor the rule-based solver assign
    `id`/`stepNumber` — that's server bookkeeping, not something worth
    spending model output on."""
    return [
        {**step, "id": str(uuid.uuid4()), "stepNumber": i + 1} for i, step in enumerate(raw_steps)
    ]


def _cache_hit_routing(cached: SolveResponse) -> RoutingDecision:
    return RoutingDecision(
        subject=cached.routing.subject,
        complexity=cached.routing.complexity,
        engine="cache",
        verify=cached.verified,
        cache_hit=True,
        reason="Cache hit — identical problem already solved and verified. Served at ~$0.",
        estimated_cost_cents=0.0,
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/route", response_model=RoutingDecision, dependencies=[Depends(require_app_key)])
def route(req: SolveRequest) -> RoutingDecision:
    """Preview routing without solving — mirrors the TS mock's `api.route()`
    so the client can inspect engine choice/cost before committing."""
    cache_key = content_hash(req.mode, req.problem_image_b64, req.work_image_b64)
    cached = _cache.get(cache_key)
    if cached is not None:
        return _cache_hit_routing(cached)

    classification = _claude.read_and_classify(req.problem_image_b64, req.work_image_b64)
    return decide_engine(
        req.mode,
        ClassificationInput(
            subject=classification.subject,
            complexity=classification.complexity,
            problem_text=classification.problem_text,
        ),
        cache_hit=False,
    )


@app.post("/solve", response_model=SolveResponse, dependencies=[Depends(require_app_key)])
def solve(req: SolveRequest) -> SolveResponse:
    cache_key = content_hash(req.mode, req.problem_image_b64, req.work_image_b64)
    cached = _cache.get(cache_key)

    if cached is not None:
        response = cached.model_copy(
            update={
                "id": str(uuid.uuid4()),
                "created_at": _now(),
                "routing": _cache_hit_routing(cached),
            }
        )
        _session_context[response.id] = {
            "problem_text": "",  # not re-derived on a cache hit; chat still works generically
            "final_answer": response.final_answer,
        }
        return response

    classification = _claude.read_and_classify(req.problem_image_b64, req.work_image_b64)

    # Enforce the plan's subject scope server-side — never trust the client
    # alone to gate this (PLAN.md §7: free tier is math-only).
    if req.subject_scope is not None and classification.subject not in req.subject_scope:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "locked_subject",
                "message": f"{classification.subject} isn't included in your current plan.",
            },
        )

    routing = decide_engine(
        req.mode,
        ClassificationInput(
            subject=classification.subject,
            complexity=classification.complexity,
            problem_text=classification.problem_text,
        ),
        cache_hit=False,
    )
    logger.info(
        "solve: mode=%s subject=%s engine=%s cost=%.2f\xa2",
        req.mode, routing.subject, routing.engine, routing.estimated_cost_cents,
    )

    result: Optional[SolveResult]
    if routing.engine == "rule_based":
        result = solve_trivial(classification.problem_text)
        if result is None:  # defensive — is_trivial() should guarantee a match
            result = _claude.solve(classification.problem_text, classification.subject, use_opus=False)
    elif routing.engine == "opus" and req.mode == "mistake_detective":
        result = _claude.analyze_mistake(
            classification.problem_text, classification.student_work_text, classification.subject
        )
    else:
        result = _claude.solve(
            classification.problem_text, classification.subject, use_opus=(routing.engine == "opus")
        )

    verified = False
    if routing.verify:
        # rule_based is a pure symbolic computation with no LLM claim to
        # cross-check; haiku/opus results are only trusted after the sandbox
        # independently confirms the model's own numeric claim.
        verified = (
            True
            if routing.engine == "rule_based"
            else verify_numeric(result.verification_expression, result.final_answer_numeric)
        )

    mistake_analysis = getattr(result, "mistake_analysis", None)

    response = SolveResponse(
        id=str(uuid.uuid4()),
        mode=req.mode,
        subject=classification.subject,
        concepts=result.concepts,
        steps=_finalize_steps(result.steps),
        mistake_analysis=mistake_analysis,
        final_answer=result.final_answer,
        verified=verified,
        routing=routing,
        created_at=_now(),
    )

    _cache.put(cache_key, response)
    _session_context[response.id] = {
        "problem_text": classification.problem_text,
        "final_answer": response.final_answer,
    }
    return response


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(require_app_key)])
def chat(req: ChatRequest) -> ChatResponse:
    context = _session_context.get(req.session_id)
    if context is None:
        raise HTTPException(status_code=404, detail="Unknown sessionId — solve a problem first.")
    reply = _claude.chat_reply(
        context["problem_text"], context["final_answer"], req.message, req.history
    )
    return ChatResponse(reply=reply)


@app.post("/practice", response_model=PracticeResponse, dependencies=[Depends(require_app_key)])
def practice(req: PracticeRequest) -> PracticeResponse:
    """Generates one practice problem targeting a weak concept (PLAN.md v1.5:
    the Weakness Graph → Practice loop). Deliberately routed to Haiku — this
    isn't the verification-critical path, so it doesn't need Opus."""
    result = _claude.generate_practice(req.concept, req.subject)
    return PracticeResponse(
        id=str(uuid.uuid4()),
        concept=req.concept,
        subject=req.subject,
        question=result.question,
        expected_answer=result.expected_answer,
        hint=result.hint,
        explanation=result.explanation,
    )

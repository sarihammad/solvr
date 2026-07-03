"""Real Anthropic SDK integration. Two-model routing (PLAN.md §9.2):

- Opus (`claude-opus-4-8`, adaptive thinking, high effort) — Mistake Detective
  and complex reasoning. This is where correctness and the defensible feature
  live; worth the spend.
- Haiku (`claude-haiku-4-5`, no thinking) — OCR + classification pre-pass and
  standard-difficulty solves. Cheap and fast.

All structured extraction uses `output_config.format` (JSON Schema) so
responses are parsed, not regex-scraped. Every model call returns a
`verification_expression` the caller checks against the sandbox (verify.py) —
the backend never trusts the model's own claim of correctness.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional

from anthropic import Anthropic

from .config import Settings
from .models import ChatMessage, Complexity, Subject
from .results import MistakeResult, SolveResult

_CLASSIFY_SCHEMA = {
    "type": "object",
    "properties": {
        "problemText": {"type": "string", "description": "The problem statement, transcribed exactly."},
        "studentWorkText": {
            "type": "string",
            "description": "The student's handwritten work, transcribed exactly. Empty string if not present.",
        },
        "subject": {
            "type": "string",
            "enum": ["math", "physics", "chemistry", "biology", "economics", "cs", "other"],
        },
        "complexity": {
            "type": "string",
            "enum": ["trivial", "standard", "complex"],
            "description": "trivial = pure arithmetic or a single linear equation. standard = one clear "
            "formula/technique, few steps. complex = multi-step derivation, several concepts combined, "
            "or requires careful setup.",
        },
    },
    "required": ["problemText", "studentWorkText", "subject", "complexity"],
    "additionalProperties": False,
}

_STEP_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "explanation": {"type": "string"},
        "equation": {"type": "string"},
        "isKeyStep": {"type": "boolean"},
    },
    "required": ["title", "explanation"],
    "additionalProperties": False,
}

_SOLVE_SCHEMA = {
    "type": "object",
    "properties": {
        "steps": {"type": "array", "items": _STEP_SCHEMA},
        "finalAnswer": {
            "type": "string",
            "description": "Human-readable final answer, e.g. 'H ~= 2.87 m'.",
        },
        "verificationExpression": {
            "type": "string",
            "description": "A SymPy-parseable expression computing the final answer independently "
            "from the given quantities (not copied from the narrative steps), "
            "e.g. '(15**2 * sin(pi/6)**2) / (2*9.8)'.",
        },
        "finalAnswerNumeric": {
            "type": "string",
            "description": "Your final answer restated as a bare SymPy-parseable number or "
            "expression, no units or prose, e.g. '2.87' or '9'.",
        },
        "concepts": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Short kebab-case concept tags, e.g. ['quadratic-formula', 'discriminant'].",
        },
    },
    "required": ["steps", "finalAnswer", "verificationExpression", "finalAnswerNumeric", "concepts"],
    "additionalProperties": False,
}

_PRACTICE_SCHEMA = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "expectedAnswer": {
            "type": "string",
            "description": "The correct answer, stated plainly and briefly (e.g. 'x = 4' or '88 g').",
        },
        "hint": {"type": "string", "description": "One short hint, given without revealing the answer."},
        "explanation": {"type": "string", "description": "A brief worked explanation, shown on request."},
    },
    "required": ["question", "expectedAnswer", "hint", "explanation"],
    "additionalProperties": False,
}

_MISTAKE_SCHEMA = {
    "type": "object",
    "properties": {
        **_SOLVE_SCHEMA["properties"],
        "mistakeAnalysis": {
            "type": "object",
            "properties": {
                "divergenceStep": {"type": "integer"},
                "studentWork": {"type": "string"},
                "correctWork": {"type": "string"},
                "mistakeLabel": {"type": "string"},
                "errorClass": {
                    "type": "string",
                    "enum": ["conceptual", "arithmetic", "sign", "setup", "units"],
                },
                "explanation": {"type": "string"},
                "conceptualNote": {"type": "string"},
            },
            "required": [
                "divergenceStep",
                "studentWork",
                "correctWork",
                "mistakeLabel",
                "errorClass",
                "explanation",
                "conceptualNote",
            ],
            "additionalProperties": False,
        },
    },
    "required": [*_SOLVE_SCHEMA["required"], "mistakeAnalysis"],
    "additionalProperties": False,
}


@dataclass
class ClassificationResult:
    problem_text: str
    student_work_text: str
    subject: Subject
    complexity: Complexity


@dataclass
class PracticeResult:
    question: str
    expected_answer: str
    hint: str
    explanation: str


class ClaudeClient:
    """Thin wrapper around the Anthropic SDK. The API key is only required at
    call time, not at construction, so the app can start without one (useful
    for local dev against the cache/router logic alone)."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._client: Optional[Anthropic] = None

    @property
    def _sdk(self) -> Anthropic:
        if self._client is None:
            if not self._settings.anthropic_api_key:
                raise RuntimeError(
                    "ANTHROPIC_API_KEY is not set — configure backend/.env before calling Claude."
                )
            self._client = Anthropic(api_key=self._settings.anthropic_api_key)
        return self._client

    def _call_json(
        self,
        *,
        model: str,
        system: str,
        content: list[dict],
        schema: dict,
        adaptive_thinking: bool,
        max_tokens: int = 4096,
    ) -> dict:
        kwargs: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": content}],
            "output_config": {"format": {"type": "json_schema", "schema": schema}},
        }
        if adaptive_thinking:
            kwargs["thinking"] = {"type": "adaptive"}
            kwargs["output_config"]["effort"] = "high"

        response = self._sdk.messages.create(**kwargs)
        text = next(block.text for block in response.content if block.type == "text")
        return json.loads(text)

    @staticmethod
    def _image_block(image_b64: str, media_type: str = "image/jpeg") -> dict:
        return {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": image_b64},
        }

    # ── OCR + classification (Haiku — cheap pre-pass) ────────────────────────

    def read_and_classify(
        self, problem_image_b64: str, work_image_b64: Optional[str] = None
    ) -> ClassificationResult:
        content = [
            self._image_block(problem_image_b64),
            {
                "type": "text",
                "text": (
                    "Transcribe this academic problem exactly, classify its subject, and rate its "
                    "complexity. If a second image (the student's own work) is attached, transcribe "
                    "that too."
                ),
            },
        ]
        if work_image_b64:
            content.append(self._image_block(work_image_b64))
            content.append({"type": "text", "text": "The second image is the student's own work."})

        data = self._call_json(
            model=self._settings.haiku_model,
            system="You are a precise OCR and classification engine for STEM homework problems.",
            content=content,
            schema=_CLASSIFY_SCHEMA,
            adaptive_thinking=False,
        )
        return ClassificationResult(
            problem_text=data["problemText"],
            student_work_text=data.get("studentWorkText", ""),
            subject=data["subject"],
            complexity=data["complexity"],
        )

    # ── Solve (Haiku for standard, Opus for complex) ─────────────────────────

    def solve(self, problem_text: str, subject: Subject, use_opus: bool) -> SolveResult:
        model = self._settings.opus_model if use_opus else self._settings.haiku_model
        data = self._call_json(
            model=model,
            system=(
                f"You are Solvr, a {subject} tutor. Solve the problem with clear, numbered steps a "
                "student can follow. Always include a verificationExpression — an independent "
                "SymPy-parseable computation of the final answer — so the answer can be checked "
                "in a sandbox rather than trusted from your own claim."
            ),
            content=[{"type": "text", "text": problem_text}],
            schema=_SOLVE_SCHEMA,
            adaptive_thinking=use_opus,
        )
        return SolveResult(
            steps=data["steps"],
            final_answer=data["finalAnswer"],
            verification_expression=data["verificationExpression"],
            final_answer_numeric=data["finalAnswerNumeric"],
            concepts=data["concepts"],
        )

    # ── Mistake Detective (always Opus) ──────────────────────────────────────

    def analyze_mistake(
        self, problem_text: str, student_work_text: str, subject: Subject
    ) -> MistakeResult:
        data = self._call_json(
            model=self._settings.opus_model,
            system=(
                f"You are Solvr's Mistake Detective for {subject}. Solve the problem correctly, then "
                "align the student's work against your correct solution step-by-step and find the "
                "exact step where they diverge. Classify the error type and explain the underlying "
                "misconception — coach, don't just correct."
            ),
            content=[
                {"type": "text", "text": f"Problem:\n{problem_text}\n\nStudent's work:\n{student_work_text}"}
            ],
            schema=_MISTAKE_SCHEMA,
            adaptive_thinking=True,
        )
        return MistakeResult(
            steps=data["steps"],
            final_answer=data["finalAnswer"],
            verification_expression=data["verificationExpression"],
            final_answer_numeric=data["finalAnswerNumeric"],
            concepts=data["concepts"],
            mistake_analysis=data["mistakeAnalysis"],
        )

    # ── Practice generation (Haiku — cheap; not the verification-critical path) ─

    def generate_practice(self, concept: str, subject: Subject) -> PracticeResult:
        data = self._call_json(
            model=self._settings.haiku_model,
            system=(
                f"You are Solvr, a {subject} tutor. Generate ONE fresh practice problem that "
                f"targets the concept '{concept}' — similar difficulty to a typical homework "
                "problem, different numbers/context than any example. Keep the question self-"
                "contained (a student sees only `question`, not this instruction)."
            ),
            content=[{"type": "text", "text": f"Generate a practice problem for: {concept}"}],
            schema=_PRACTICE_SCHEMA,
            adaptive_thinking=False,
            max_tokens=1024,
        )
        return PracticeResult(
            question=data["question"],
            expected_answer=data["expectedAnswer"],
            hint=data["hint"],
            explanation=data["explanation"],
        )

    # ── Ask Solvr follow-up chat (Haiku — cheap, scoped to one solution) ────

    def chat_reply(self, problem_text: str, final_answer: str, message: str, history: list[ChatMessage]) -> str:
        transcript = "\n".join(f"{m.role}: {m.content}" for m in history)
        response = self._sdk.messages.create(
            model=self._settings.haiku_model,
            max_tokens=1024,
            system=(
                "You are Ask Solvr — answer follow-up questions about the specific solution below. "
                "Be concise and concrete; reference the actual steps, not generic advice."
            ),
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Problem: {problem_text}\nFinal answer: {final_answer}\n\n"
                        f"Conversation so far:\n{transcript}\n\nStudent: {message}"
                    ),
                }
            ],
        )
        return next(block.text for block in response.content if block.type == "text")

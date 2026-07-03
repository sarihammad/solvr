"""Router/evaluator: picks the cheapest engine that can serve a request,
escalating to Opus only when reasoning demands it. Mirrors the ladder in
src/lib/api.ts (see PLAN.md §9.1-9.3) — this module is the source of truth on
the backend; the TS mock exists so the client behaves identically offline.

Ladder: shared cache -> rule_based -> haiku -> opus.
"""

from __future__ import annotations

from dataclasses import dataclass

from .models import Complexity, RoutingDecision, SolveEngine, SolveMode, Subject
from .rule_solver import is_trivial

# Subjects whose final answer can be confirmed in the SymPy sandbox earn the
# "Verified" badge. Everything else is clearly labelled unverified.
VERIFIABLE_SUBJECTS: set[Subject] = {"math", "physics", "chemistry"}

# Illustrative per-request cost in cents, by engine (Opus is ~6x Haiku).
_ENGINE_COST_CENTS: dict[SolveEngine, float] = {
    "cache": 0.0,
    "rule_based": 0.0,
    "haiku": 0.4,
    "opus": 2.6,
}


@dataclass
class ClassificationInput:
    subject: Subject
    complexity: Complexity
    problem_text: str


def decide_engine(
    mode: SolveMode,
    classification: ClassificationInput,
    cache_hit: bool,
) -> RoutingDecision:
    subject = classification.subject
    verify = subject in VERIFIABLE_SUBJECTS

    if cache_hit:
        engine: SolveEngine = "cache"
        reason = "Cache hit — identical problem already solved and verified. Served at ~$0."
    elif mode == "mistake_detective":
        # Step-level divergence detection is the defensible feature — always Opus.
        engine = "opus"
        reason = "Mistake analysis needs step-level reasoning -> Opus."
    elif is_trivial(classification.problem_text):
        engine = "rule_based"
        reason = "Trivial, well-structured problem -> deterministic solver, no LLM."
    elif classification.complexity == "standard":
        engine = "haiku"
        reason = "Standard problem -> Haiku handles it cheaply."
    else:
        engine = "opus"
        reason = "Complex multi-step reasoning -> escalate to Opus."

    estimated_cost = _ENGINE_COST_CENTS[engine] + (0.1 if verify and engine != "cache" else 0.0)

    return RoutingDecision(
        subject=subject,
        complexity=classification.complexity,
        engine=engine,
        verify=verify,
        cache_hit=cache_hit,
        reason=reason,
        estimated_cost_cents=round(estimated_cost, 2),
    )

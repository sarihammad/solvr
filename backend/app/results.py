"""Internal result shapes shared by every engine (rule_based, Haiku, Opus).
Kept separate from claude_client.py so the deterministic rule-based path has
zero dependency on the Anthropic SDK.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SolveResult:
    steps: list[dict]
    final_answer: str
    # A SymPy-parseable expression that independently recomputes the answer
    # from the given quantities (not copied from the narrative steps).
    verification_expression: str
    # The model's own numeric/symbolic claim, in SymPy-parseable form —
    # distinct from `final_answer`'s human-readable string (e.g. "H ~= 2.87 m"
    # vs "56.25/19.6"). Verification compares this against
    # `verification_expression`; see verify.py and README "Verification scope".
    final_answer_numeric: str
    concepts: list[str]


@dataclass
class MistakeResult(SolveResult):
    mistake_analysis: dict

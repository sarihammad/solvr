"""Deterministic solver for the `rule_based` engine — no LLM call at all.

Deliberately conservative: only matches unambiguous, fully-numeric expressions
or single-variable linear equations. A false "trivial" classification would
produce a wrong verified answer, so anything else falls through to Haiku/Opus.
"""

from __future__ import annotations

import re
from typing import Optional

import sympy

from .results import SolveResult

ARITHMETIC_ONLY = re.compile(r"^[\s0-9+\-*/^().]+$")

LINEAR_EQUATION = re.compile(
    r"^\s*(?P<a>-?\d*\.?\d*)\s*x\s*(?P<op>[+\-])\s*(?P<b>\d+\.?\d*)\s*=\s*(?P<c>-?\d+\.?\d*)\s*$",
    re.IGNORECASE,
)


def is_trivial(problem_text: str) -> bool:
    text = problem_text.strip()
    if not text:
        return False
    return bool(ARITHMETIC_ONLY.match(text) or LINEAR_EQUATION.match(text))


def _solve_arithmetic(text: str) -> SolveResult:
    # Safe to sympify directly: ARITHMETIC_ONLY guarantees the string contains
    # only digits, whitespace, and +-*/^() — no letters, so no name lookups or
    # function/attribute calls are possible regardless of sympify's grammar.
    expr = sympy.sympify(text, evaluate=True)
    value = sympy.nsimplify(expr)
    return SolveResult(
        steps=[
            {
                "title": "Evaluate the expression",
                "explanation": f"Following order of operations, {text.strip()} evaluates to {value}.",
                "equation": f"{text.strip()} = {value}",
                "isKeyStep": True,
            }
        ],
        final_answer=str(value),
        verification_expression=text.strip(),
        final_answer_numeric=str(value),
        concepts=["arithmetic"],
    )


def _solve_linear(text: str, match: re.Match) -> SolveResult:
    raw_a = match.group("a").strip()
    a = float(raw_a) if raw_a not in ("", "-") else (-1.0 if raw_a == "-" else 1.0)
    op = match.group("op")
    b = float(match.group("b"))
    c = float(match.group("c"))
    signed_b = b if op == "+" else -b

    x = sympy.symbols("x")
    solution = sympy.solve(sympy.Eq(a * x + signed_b, c), x)[0]
    solution = sympy.nsimplify(solution)

    return SolveResult(
        steps=[
            {
                "title": "Isolate the variable term",
                "explanation": f"Subtract {signed_b} from both sides.",
                "equation": f"{a}x = {c} - ({signed_b})",
            },
            {
                "title": "Divide by the coefficient",
                "explanation": f"Divide both sides by {a} to solve for x.",
                "equation": f"x = {sympy.nsimplify((c - signed_b))} / {a} = {solution}",
                "isKeyStep": True,
            },
        ],
        final_answer=f"x = {solution}",
        verification_expression=f"({c} - ({signed_b})) / ({a})",
        final_answer_numeric=str(solution),
        concepts=["linear-equations"],
    )


def solve_trivial(problem_text: str) -> Optional[SolveResult]:
    text = problem_text.strip()
    linear_match = LINEAR_EQUATION.match(text)
    if linear_match:
        return _solve_linear(text, linear_match)
    if ARITHMETIC_ONLY.match(text):
        return _solve_arithmetic(text)
    return None

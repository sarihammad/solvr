"""Python-sandbox verification (PLAN.md §9.2). Confirms a model-produced
answer by parsing it symbolically with SymPy and comparing it to an
independently computed expression, rather than trusting the model's claim.

Security note: this runs in an isolated subprocess with a hard timeout because
the input is LLM-controlled. We only ever call `parse_expr(...).evalf()` on
untrusted strings — never `.subs()` with untrusted substitutions or
`lambdify()`, which is the actual code-generation risk in SymPy (it compiles
a Python function from the expression). `parse_expr` builds a symbolic AST
from the math grammar and does not execute arbitrary Python.
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap

_VERIFY_TIMEOUT_SECONDS = 5

_WORKER_SCRIPT = textwrap.dedent(
    """
    import json, sys
    import sympy
    from sympy.parsing.sympy_parser import (
        parse_expr, standard_transformations, implicit_multiplication_application,
    )

    payload = json.loads(sys.stdin.read())
    transformations = standard_transformations + (implicit_multiplication_application,)

    def safe_parse(expr):
        return parse_expr(expr, transformations=transformations, evaluate=True)

    try:
        lhs = safe_parse(payload["computed"])
        rhs = safe_parse(payload["claimed"])
        diff = abs(complex(sympy.simplify(lhs - rhs).evalf()))
        scale = max(abs(complex(rhs.evalf())), 1.0)
        matches = diff < max(payload["abs_tol"], payload["rel_tol"] * scale)
        print(json.dumps({"ok": True, "matches": bool(matches)}))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
    """
)


def verify_numeric(
    computed_expression: str,
    claimed_answer: str,
    abs_tol: float = 1e-3,
    rel_tol: float = 1e-3,
) -> bool:
    """Returns True only if SymPy independently confirms the claimed answer.

    Tolerance is deliberately loose (0.1%, both absolute and relative) because
    the model's `finalAnswerNumeric` is typically a human-rounded decimal
    (e.g. "2.87"), not full precision — an exact-match tolerance would reject
    almost every real answer. This checks that the model's stated answer is
    *consistent with* its own independent recomputation, not bit-for-bit
    identical to it. Any parse error, mismatch, or timeout returns False — an
    unverifiable answer must never earn the "Verified" badge (see
    SolutionScreen).
    """
    payload = json.dumps(
        {
            "computed": computed_expression,
            "claimed": claimed_answer,
            "abs_tol": abs_tol,
            "rel_tol": rel_tol,
        }
    )
    try:
        result = subprocess.run(
            [sys.executable, "-c", _WORKER_SCRIPT],
            input=payload,
            capture_output=True,
            text=True,
            timeout=_VERIFY_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return False

    if result.returncode != 0 or not result.stdout.strip():
        return False
    try:
        data = json.loads(result.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        return False
    return bool(data.get("ok") and data.get("matches"))

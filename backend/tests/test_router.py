from app.router import ClassificationInput, decide_engine


def _classification(subject="math", complexity="standard", text="solve the integral"):
    return ClassificationInput(subject=subject, complexity=complexity, problem_text=text)


def test_mistake_detective_always_routes_to_opus_regardless_of_complexity():
    for complexity in ("trivial", "standard", "complex"):
        decision = decide_engine(
            "mistake_detective", _classification(complexity=complexity), cache_hit=False
        )
        assert decision.engine == "opus"


def test_trivial_arithmetic_routes_to_rule_based_with_no_llm_cost():
    decision = decide_engine(
        "solve_problem", _classification(complexity="standard", text="3 + 4 * 2"), cache_hit=False
    )
    assert decision.engine == "rule_based"
    # No LLM call at all — the only cost is the sandbox verification check,
    # far below Haiku's per-request cost.
    assert decision.estimated_cost_cents < 0.4


def test_standard_complexity_routes_to_haiku():
    decision = decide_engine(
        "solve_problem",
        _classification(complexity="standard", text="integrate x^2 from 0 to 3"),
        cache_hit=False,
    )
    assert decision.engine == "haiku"


def test_complex_complexity_escalates_to_opus():
    decision = decide_engine(
        "solve_problem",
        _classification(complexity="complex", text="derive the projectile range formula"),
        cache_hit=False,
    )
    assert decision.engine == "opus"


def test_cache_hit_forces_cache_engine_at_zero_cost():
    decision = decide_engine("solve_problem", _classification(complexity="complex"), cache_hit=True)
    assert decision.engine == "cache"
    assert decision.estimated_cost_cents == 0.0


def test_verify_flag_only_set_for_verifiable_subjects():
    verifiable = decide_engine("solve_problem", _classification(subject="physics"), cache_hit=False)
    unverifiable = decide_engine("solve_problem", _classification(subject="cs"), cache_hit=False)
    assert verifiable.verify is True
    assert unverifiable.verify is False

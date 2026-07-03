from app.rule_solver import is_trivial, solve_trivial


def test_is_trivial_true_for_pure_arithmetic():
    assert is_trivial("3 + 4 * 2")


def test_is_trivial_true_for_single_linear_equation():
    assert is_trivial("2x + 3 = 11")


def test_is_trivial_false_for_prose_problem():
    assert not is_trivial("A ball is launched at 15 m/s at 30 degrees. Find max height.")


def test_is_trivial_false_for_empty_string():
    assert not is_trivial("   ")


def test_solve_trivial_arithmetic_matches_sympy():
    result = solve_trivial("3 + 4 * 2")
    assert result is not None
    assert result.final_answer == "11"
    assert result.final_answer_numeric == "11"


def test_solve_trivial_linear_equation_solves_for_x():
    # 2x + 3 = 11  ->  x = 4
    result = solve_trivial("2x + 3 = 11")
    assert result is not None
    assert result.final_answer == "x = 4"
    assert len(result.steps) >= 1


def test_solve_trivial_returns_none_for_non_matching_text():
    assert solve_trivial("integrate x^2 dx from 0 to 3") is None

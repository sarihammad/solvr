from app.verify import verify_numeric


def test_matching_expressions_verify_true():
    assert verify_numeric("2 + 2", "4") is True


def test_equivalent_symbolic_expressions_verify_true():
    # True value is 2.869897... — a model rounding to "2.87" must still verify.
    assert verify_numeric("(15**2 * 0.25) / (2*9.8)", "2.87") is True


def test_precise_mismatch_beyond_tolerance_fails():
    assert verify_numeric("(15**2 * 0.25) / (2*9.8)", "3.5") is False


def test_mismatched_expressions_verify_false():
    assert verify_numeric("2 + 2", "5") is False


def test_malformed_expression_fails_closed():
    # Must never crash or silently "verify" on bad input — fail closed.
    assert verify_numeric("this is not math", "4") is False


def test_never_verifies_on_empty_input():
    assert verify_numeric("", "") is False

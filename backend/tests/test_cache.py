from app.cache import ProblemCache, content_hash
from app.models import RoutingDecision, SolveResponse


def _make_response(id_: str = "resp-1") -> SolveResponse:
    return SolveResponse(
        id=id_,
        mode="solve_problem",
        subject="math",
        concepts=["power-rule"],
        steps=[],
        final_answer="9",
        verified=True,
        routing=RoutingDecision(
            subject="math",
            complexity="standard",
            engine="haiku",
            verify=True,
            cache_hit=False,
            reason="test",
            estimated_cost_cents=0.4,
        ),
        created_at="2026-01-01T00:00:00Z",
    )


def test_cache_miss_returns_none(tmp_path):
    cache = ProblemCache(str(tmp_path / "test.db"))
    assert cache.get("nonexistent") is None


def test_cache_put_then_get_round_trips(tmp_path):
    cache = ProblemCache(str(tmp_path / "test.db"))
    key = content_hash("solve_problem", "base64imagedata", None)
    cache.put(key, _make_response())

    fetched = cache.get(key)
    assert fetched is not None
    assert fetched.final_answer == "9"
    assert fetched.concepts == ["power-rule"]


def test_content_hash_is_stable_and_distinguishes_inputs():
    a = content_hash("solve_problem", "imageA", None)
    b = content_hash("solve_problem", "imageA", None)
    c = content_hash("solve_problem", "imageB", None)
    assert a == b
    assert a != c

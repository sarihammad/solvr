"""Endpoint tests using a fake ClaudeClient — no network, no API key required.
`app.claude_client` and `app.verify` are the only modules that need a real
Anthropic key; everything wired here is exercised end-to-end.
"""

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.claude_client import ClassificationResult, PracticeResult
from app.results import MistakeResult, SolveResult


class FakeClaudeClient:
    """Duck-types ClaudeClient. Module globals are looked up at call time, so
    monkeypatching `main._claude` redirects every route handler."""

    def __init__(self, subject="math", complexity="complex"):
        self.subject = subject
        self.complexity = complexity
        self.calls = []

    def read_and_classify(self, problem_image_b64, work_image_b64=None):
        self.calls.append("read_and_classify")
        return ClassificationResult(
            problem_text="integrate x^2 from 0 to 3",
            student_work_text="",
            subject=self.subject,
            complexity=self.complexity,
        )

    def solve(self, problem_text, subject, use_opus):
        self.calls.append(f"solve(opus={use_opus})")
        return SolveResult(
            steps=[{"title": "Step 1", "explanation": "Do the thing."}],
            final_answer="9",
            verification_expression="3**3/3",
            final_answer_numeric="9",
            concepts=["integration"],
        )

    def analyze_mistake(self, problem_text, student_work_text, subject):
        self.calls.append("analyze_mistake")
        return MistakeResult(
            steps=[{"title": "Step 1", "explanation": "Correct approach."}],
            final_answer="9",
            verification_expression="3**3/3",
            final_answer_numeric="9",
            concepts=["integration"],
            mistake_analysis={
                "divergenceStep": 1,
                "studentWork": "x^3",
                "correctWork": "x^3/3",
                "mistakeLabel": "Forgot to divide",
                "errorClass": "conceptual",
                "explanation": "You forgot the /3.",
                "conceptualNote": "Power rule requires dividing by n+1.",
            },
        )

    def chat_reply(self, problem_text, final_answer, message, history):
        self.calls.append("chat_reply")
        return "The power rule says..."

    def generate_practice(self, concept, subject):
        self.calls.append("generate_practice")
        return PracticeResult(
            question=f"Practice question about {concept}",
            expected_answer="42",
            hint="Think about the power rule.",
            explanation="Divide by the new exponent.",
        )


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "_cache", main.ProblemCache(str(tmp_path / "test.db")))
    monkeypatch.setattr(main, "_session_context", {})
    fake = FakeClaudeClient()
    monkeypatch.setattr(main, "_claude", fake)
    return TestClient(main.app), fake


def test_solve_complex_problem_routes_to_opus(client):
    test_client, fake = client
    resp = test_client.post(
        "/solve", json={"mode": "solve_problem", "problemImageBase64": "fakebase64data"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["routing"]["engine"] == "opus"
    assert body["verified"] is True
    assert body["steps"][0]["stepNumber"] == 1
    assert "id" in body["steps"][0]
    assert "solve(opus=True)" in fake.calls


def test_mistake_detective_always_calls_analyze_mistake(client):
    test_client, fake = client
    resp = test_client.post(
        "/solve",
        json={
            "mode": "mistake_detective",
            "problemImageBase64": "fakebase64data",
            "workImageBase64": "fakework64",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["mistakeAnalysis"]["errorClass"] == "conceptual"
    assert "analyze_mistake" in fake.calls


def test_second_identical_request_is_served_from_cache(client):
    test_client, fake = client
    payload = {"mode": "solve_problem", "problemImageBase64": "repeatimage"}
    first = test_client.post("/solve", json=payload)
    assert first.json()["routing"]["engine"] == "opus"
    assert fake.calls.count("read_and_classify") == 1

    second = test_client.post("/solve", json=payload)
    assert second.json()["routing"]["engine"] == "cache"
    assert second.json()["routing"]["estimatedCostCents"] == 0
    # No additional classify/solve calls — served entirely from cache.
    assert fake.calls.count("read_and_classify") == 1


def test_locked_subject_rejected_with_403(client):
    test_client, fake = client
    fake.subject = "physics"
    resp = test_client.post(
        "/solve",
        json={
            "mode": "solve_problem",
            "problemImageBase64": "physicsimg",
            "subjectScope": ["math"],
        },
    )
    assert resp.status_code == 403
    assert resp.json()["detail"]["error"] == "locked_subject"


def test_chat_requires_a_prior_solve(client):
    test_client, _ = client
    resp = test_client.post(
        "/chat", json={"sessionId": "unknown-session", "message": "why?", "history": []}
    )
    assert resp.status_code == 404


def test_practice_generates_a_problem_for_a_concept(client):
    test_client, fake = client
    resp = test_client.post("/practice", json={"concept": "power-rule", "subject": "math"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["concept"] == "power-rule"
    assert "power-rule" in body["question"]
    assert body["expectedAnswer"] == "42"
    assert "generate_practice" in fake.calls


def test_chat_after_solve_returns_reply(client):
    test_client, fake = client
    solved = test_client.post(
        "/solve", json={"mode": "solve_problem", "problemImageBase64": "chatimg"}
    ).json()
    resp = test_client.post(
        "/chat",
        json={"sessionId": solved["id"], "message": "why does this work?", "history": []},
    )
    assert resp.status_code == 200
    assert resp.json()["reply"] == "The power rule says..."
    assert "chat_reply" in fake.calls

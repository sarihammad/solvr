"""Tests for the shared-secret auth dependency and body-size limit — the two
production-hardening additions that protect against anonymous/abusive
traffic burning through the ANTHROPIC_API_KEY's spend once deployed publicly.
"""

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.claude_client import ClassificationResult
from app.results import SolveResult


class FakeClaudeClient:
    def read_and_classify(self, problem_image_b64, work_image_b64=None):
        return ClassificationResult(
            problem_text="3 + 4",
            student_work_text="",
            subject="math",
            complexity="trivial",
        )

    def solve(self, problem_text, subject, use_opus):
        return SolveResult(
            steps=[{"title": "Step", "explanation": "..."}],
            final_answer="7",
            verification_expression="7",
            final_answer_numeric="7",
            concepts=["arithmetic"],
        )


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "_cache", main.ProblemCache(str(tmp_path / "test.db")))
    monkeypatch.setattr(main, "_session_context", {})
    monkeypatch.setattr(main, "_claude", FakeClaudeClient())
    return TestClient(main.app)


def test_no_app_key_configured_allows_requests_without_auth_header(client, monkeypatch):
    monkeypatch.delenv("SOLVR_APP_KEY", raising=False)
    resp = client.post("/solve", json={"mode": "solve_problem", "problemImageBase64": "img"})
    assert resp.status_code == 200


def test_app_key_configured_rejects_missing_header(client, monkeypatch):
    monkeypatch.setenv("SOLVR_APP_KEY", "test-secret")
    resp = client.post("/solve", json={"mode": "solve_problem", "problemImageBase64": "img"})
    assert resp.status_code == 401


def test_app_key_configured_rejects_wrong_header(client, monkeypatch):
    monkeypatch.setenv("SOLVR_APP_KEY", "test-secret")
    resp = client.post(
        "/solve",
        json={"mode": "solve_problem", "problemImageBase64": "img"},
        headers={"Authorization": "Bearer wrong-key"},
    )
    assert resp.status_code == 401


def test_app_key_configured_accepts_correct_header(client, monkeypatch):
    monkeypatch.setenv("SOLVR_APP_KEY", "test-secret")
    resp = client.post(
        "/solve",
        json={"mode": "solve_problem", "problemImageBase64": "img"},
        headers={"Authorization": "Bearer test-secret"},
    )
    assert resp.status_code == 200


def test_health_endpoint_never_requires_auth(client, monkeypatch):
    monkeypatch.setenv("SOLVR_APP_KEY", "test-secret")
    resp = client.get("/health")
    assert resp.status_code == 200


def test_oversized_request_body_rejected(client, monkeypatch):
    monkeypatch.delenv("SOLVR_APP_KEY", raising=False)
    monkeypatch.setattr(main, "MAX_BODY_BYTES", 100)
    resp = client.post(
        "/solve",
        json={"mode": "solve_problem", "problemImageBase64": "x" * 1000},
    )
    assert resp.status_code == 413

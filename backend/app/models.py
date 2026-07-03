"""Pydantic schemas mirroring src/types/index.ts exactly (camelCase on the wire)."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

SolveMode = Literal["solve_problem", "mistake_detective"]
Subject = Literal["math", "physics", "chemistry", "biology", "economics", "cs", "other"]
SolveEngine = Literal["cache", "rule_based", "haiku", "opus"]
Complexity = Literal["trivial", "standard", "complex"]
ErrorClass = Literal["conceptual", "arithmetic", "sign", "setup", "units"]


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SolutionStep(CamelModel):
    id: str
    step_number: int = Field(alias="stepNumber")
    title: str
    explanation: str
    equation: Optional[str] = None
    is_key_step: Optional[bool] = Field(default=None, alias="isKeyStep")


class MistakeAnalysis(CamelModel):
    divergence_step: int = Field(alias="divergenceStep")
    student_work: str = Field(alias="studentWork")
    correct_work: str = Field(alias="correctWork")
    mistake_label: str = Field(alias="mistakeLabel")
    error_class: ErrorClass = Field(alias="errorClass")
    explanation: str
    conceptual_note: str = Field(alias="conceptualNote")


class RoutingDecision(CamelModel):
    subject: Subject
    complexity: Complexity
    engine: SolveEngine
    verify: bool
    cache_hit: bool = Field(alias="cacheHit")
    reason: str
    estimated_cost_cents: float = Field(alias="estimatedCostCents")


class ChatMessage(CamelModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: str


class SolveResponse(CamelModel):
    """What the backend actually knows how to produce. Deliberately excludes
    `problemImageUri`/`workImageUri` — the backend only ever sees base64 image
    bytes, never the client's local file URI. The client merges its own URIs
    in when building the final SolveSession (see src/lib/api.ts)."""

    id: str
    mode: SolveMode
    subject: Subject
    concepts: list[str]
    steps: list[SolutionStep]
    mistake_analysis: Optional[MistakeAnalysis] = Field(default=None, alias="mistakeAnalysis")
    final_answer: str = Field(alias="finalAnswer")
    verified: bool
    routing: RoutingDecision
    created_at: str = Field(alias="createdAt")


# ── Request payloads ──────────────────────────────────────────────────────────


class SolveRequest(CamelModel):
    mode: SolveMode
    problem_image_b64: str = Field(alias="problemImageBase64")
    work_image_b64: Optional[str] = Field(default=None, alias="workImageBase64")
    subject_scope: Optional[list[Subject]] = Field(default=None, alias="subjectScope")


class ChatRequest(CamelModel):
    session_id: str = Field(alias="sessionId")
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(CamelModel):
    reply: str


class PracticeRequest(CamelModel):
    concept: str
    subject: Subject


class PracticeResponse(CamelModel):
    id: str
    concept: str
    subject: Subject
    question: str
    expected_answer: str = Field(alias="expectedAnswer")
    hint: str
    explanation: str

"""Shared problem cache — the margin lever (PLAN.md §9.3). Students photograph
the same textbook problems constantly; a cache hit serves a verified solution
at ~$0 instead of a full Haiku/Opus + sandbox run.

SQLite is the pragmatic store for this pass. Swap for Postgres/Redis in
production (see docker-compose.yml) without changing this module's interface.
"""

from __future__ import annotations

import hashlib
import sqlite3
from contextlib import contextmanager
from typing import Iterator, Optional

from .models import SolveMode, SolveResponse

_SCHEMA = """
CREATE TABLE IF NOT EXISTS problem_cache (
    content_hash TEXT PRIMARY KEY,
    session_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def content_hash(mode: SolveMode, problem_image_b64: str, work_image_b64: Optional[str]) -> str:
    """Hashes the raw image bytes so identical photos of the same problem —
    even across different students — collapse to one cache entry."""
    hasher = hashlib.sha256()
    hasher.update(mode.encode("utf-8"))
    hasher.update(problem_image_b64.encode("utf-8"))
    hasher.update((work_image_b64 or "").encode("utf-8"))
    return hasher.hexdigest()


class ProblemCache:
    def __init__(self, db_path: str):
        self._db_path = db_path
        with self._connect() as conn:
            conn.execute(_SCHEMA)

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self._db_path)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def get(self, key: str) -> Optional[SolveResponse]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT session_json FROM problem_cache WHERE content_hash = ?", (key,)
            ).fetchone()
        if row is None:
            return None
        return SolveResponse.model_validate_json(row[0])

    def put(self, key: str, response: SolveResponse) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO problem_cache (content_hash, session_json, created_at) "
                "VALUES (?, ?, ?)",
                (key, response.model_dump_json(by_alias=True), response.created_at),
            )

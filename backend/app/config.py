import os
from functools import lru_cache


class Settings:
    """Environment-driven configuration. Never hardcode secrets here."""

    anthropic_api_key: str = os.environ.get("ANTHROPIC_API_KEY", "")

    # Model routing — see PLAN.md §9.1. Opus is reserved for Mistake Detective
    # and complex reasoning; Haiku handles classification and standard solves.
    opus_model: str = os.environ.get("SOLVR_OPUS_MODEL", "claude-opus-4-8")
    haiku_model: str = os.environ.get("SOLVR_HAIKU_MODEL", "claude-haiku-4-5")

    database_path: str = os.environ.get("SOLVR_DB_PATH", "solvr.db")

    # Mathpix is a secondary OCR path for hard handwritten math — Claude vision
    # handles the rest. Optional; only used if both keys are set.
    mathpix_app_id: str = os.environ.get("MATHPIX_APP_ID", "")
    mathpix_app_key: str = os.environ.get("MATHPIX_APP_KEY", "")

    cors_origins: list[str] = os.environ.get("SOLVR_CORS_ORIGINS", "*").split(",")


@lru_cache
def get_settings() -> Settings:
    return Settings()

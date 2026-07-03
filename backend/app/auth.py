"""Shared-secret auth for the mobile client -> backend boundary.

This is NOT per-user auth — Solvr has no accounts, and auth is disabled
client-side too (see the mobile app's RootNavigator). Its only job is to stop
anonymous internet traffic from hitting cost-incurring endpoints and burning
through the ANTHROPIC_API_KEY's spend. If SOLVR_APP_KEY is unset, this is a
no-op (local/dev mode) — set it before deploying anywhere public.

Known limitation: any secret embedded in a distributed mobile app can be
extracted from the app binary (decompile the IPA/APK, read the bundled JS).
This deters casual/automated abuse from random internet scanners; it is not
real per-user auth and does not stop a motivated attacker who targets this
app specifically. Real protection would need platform attestation (App
Attestation / Play Integrity) or per-user accounts, both out of scope for
MVP. Reads the env var fresh on every call (not cached) so it's trivially
testable via monkeypatch and picks up a rotated key without a redeploy of
this module's import state.
"""

from __future__ import annotations

import os

from fastapi import Header, HTTPException


async def require_app_key(authorization: str | None = Header(default=None)) -> None:
    expected_key = os.environ.get("SOLVR_APP_KEY", "")
    if not expected_key:
        return
    if authorization != f"Bearer {expected_key}":
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

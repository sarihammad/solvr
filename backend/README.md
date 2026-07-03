# Solvr Backend

The real implementation behind `src/lib/api.ts` (see the root [ARCHITECTURE.md](../ARCHITECTURE.md) → "Router / Evaluator" and [PLAN.md](../PLAN.md) §9).

## What this is

A FastAPI service that:

1. **OCRs and classifies** each request in one cheap Haiku vision call (`claude-haiku-4-5`).
2. **Routes** to the cheapest engine that can serve it — `rule_based` (no LLM) → `haiku` → `opus` — escalating to Opus only for Mistake Detective and complex reasoning (`app/router.py`).
3. **Solves** via the chosen engine (`app/rule_solver.py`, `app/claude_client.py`).
4. **Verifies** math/physics/chemistry answers independently in a SymPy sandbox before ever returning the "✓ Verified" flag (`app/verify.py`).
5. **Caches** solved problems by content hash so a repeat photo is served at ~$0 (`app/cache.py`).

## What this is *not* (yet)

Being upfront about scope so nothing here is mistaken for more than it is:

- **No Postgres/Redis wiring.** `docker-compose.yml` provisions both (the PLAN.md §9.2 target shape), but the app only uses a local SQLite file today. Solve history, users, and the concept Weakness Graph are computed client-side (see `src/store/archiveSlice.ts`, `src/lib/weakness.ts`) — this backend doesn't persist them. `/practice` is stateless — each call generates a fresh problem; the student's answer is graded client-side (`src/lib/answerMatch.ts`) and never sent back.
- **No async queue.** Every request is synchronous. Fine for a single Claude round-trip; would need Celery/Redis before this scales past interactive latency.
- **Sandbox is process-isolated, not container-isolated.** `verify.py` runs SymPy in a subprocess with a hard timeout — real defense in depth, but not the gVisor/Firecracker isolation PLAN.md describes for a multi-tenant production deployment.
- **Verification checks self-consistency, not ground truth.** The sandbox confirms the model's own `verificationExpression` (an independent recomputation from the given quantities) matches its own `finalAnswerNumeric` claim, within a deliberately loose 0.1% tolerance (models state rounded decimals, not full precision). That catches a real and common failure mode — the model's stated answer contradicting its own restated computation — but it is not a formal proof against an external ground truth. A model that makes the *same* conceptual error in both fields would still pass. Treat "Verified" as "internally consistent," not "provably correct."
- **Mathpix isn't wired in.** Claude vision handles OCR directly; the config keys exist for the hard-handwriting fallback described in PLAN.md but nothing calls them yet.

## Security

- **`SOLVR_APP_KEY`** — a shared-secret bearer token (`app/auth.py`) required on every cost-incurring endpoint (`/route`, `/solve`, `/chat`, `/practice`) if set; `/health` is always open. **Set this before deploying anywhere public** — without it, anyone who finds the URL can call `/solve` and spend your Anthropic credits. Generate one with `python3 -c "import secrets; print(secrets.token_hex(32))"` and put the same value in the mobile app's `EXPO_PUBLIC_BACKEND_API_KEY`.
  - **Honest limitation:** this is a *shared app secret*, not per-user auth. It's extractable from the built mobile app (decompile the IPA/APK). It stops anonymous scanners and casual abuse; it does not stop someone who specifically targets this app. Real protection is per-user accounts (post-MVP, see PLAN.md) or platform attestation (App Attestation / Play Integrity) — both out of scope for now.
- **`SOLVR_MAX_BODY_BYTES`** (default 12 MB) — rejects oversized request bodies before parsing. A basic backstop against accidental/malicious huge uploads, not a substitute for a reverse-proxy limit.
- Unhandled exceptions are caught, logged server-side with a full traceback, and returned to the client as a sanitized `500` — internals are never leaked in the response body.

## Running it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

Or via Docker:

```bash
docker compose up --build
```

## Endpoints

| Method | Path      | Purpose |
|---|---|---|
| `GET`  | `/health` | Liveness check |
| `POST` | `/route`  | Preview routing (subject, complexity, engine, cost estimate) without solving |
| `POST` | `/solve`  | Full pipeline → `SolveResponse` |
| `POST` | `/chat`   | Ask Solvr follow-up, scoped to a solved session |
| `POST` | `/practice` | Generate one practice problem for a concept (PLAN.md v1.5 — Weakness Graph → Practice loop). Routed to Haiku; not the verification-critical path. |

Request/response shapes are camelCase on the wire (`app/models.py`) to match `src/types/index.ts` exactly — no translation layer needed on the client.

`SolveRequest` takes base64 image data directly (`problemImageBase64`, optional `workImageBase64`), not multipart form data — this matches the shape Claude's vision API wants and avoids a decode step.

## Testing

```bash
pytest
```

Tests cover the router, rule-based solver, verification sandbox, and cache — everything that doesn't require a live Anthropic API call. `app/claude_client.py` itself isn't exercised against the real API in CI; wire `ANTHROPIC_API_KEY` and hit `/solve` manually to test that path end-to-end.

## Connecting the mobile client

`src/lib/api.ts` calls this backend when `EXPO_PUBLIC_API_BASE_URL` is set (see the root `.env.example`); otherwise it falls back to the local mock so the app runs fully offline in dev. If `SOLVR_APP_KEY` is set on the backend, the app must also set the matching `EXPO_PUBLIC_BACKEND_API_KEY` or every request gets a `401`.

## Deploying to Railway

`railway.json` pins the Dockerfile builder, a `/health` health check, and a start command that respects Railway's `$PORT` (the Dockerfile's own `CMD` stays hardcoded to port 8000 for local `docker compose up`; Railway's `deploy.startCommand` overrides it in that environment).

```bash
railway login          # opens a browser — one-time, interactive
railway init            # or `railway link` to attach to an existing project
railway variables --set "ANTHROPIC_API_KEY=sk-ant-..." --set "SOLVR_APP_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
railway up
railway domain          # generates/prints the public URL — use this as EXPO_PUBLIC_API_BASE_URL
```

Postgres/Redis (PLAN.md §9.2 target shape) aren't required for this to run — SQLite lives on the container's ephemeral disk. That means the problem cache resets on every redeploy; harmless (it's a cost optimization, not a source of truth) but worth knowing. Add a Railway volume mounted at the working directory (and set `SOLVR_DB_PATH` to a path inside it) if you want the cache to survive redeploys.

# Session Hashing & Verification Plan

> Tracks the backlog for standing up the FastAPI ingestion API, canonical hashing utilities, and the frontend uploader needed to verify sessions end-to-end. Mirrors the conversation captured in `docs/backend-considerations.md` and the frontend MVP docs.

## Goals
- Prevent tampering by hashing every exported writing session and registering that hash with a backend authority.
- Allow reviewers to upload a session later, recompute the hash, and confirm it matches the original download receipt.
- Share schema + hashing logic between the React app and FastAPI service so both sides speak the same protocol.

## Two-Layer Integrity Model
1. **Client Hash Guard (Layer 1, anonymous-friendly)**
   - Every export runs through the canonical hashing helper and embeds `sessionHash + hashVersion`.
   - The uploader recomputes the hash before accepting a file; mismatches are blocked locally, even if the user is offline or anonymous.
   - This catches post-export edits but does **not** prove the session itself is authentic—it only guarantees “the uploaded file equals the original download.”

2. **Backend Ledger (Layer 2, tamper-proof backlog)**
   - When auth or a one-time ticket is available, the frontend registers the hash with FastAPI and receives a signed receipt.
   - Uploaders present the receipt or call `/verify` so the backend can attest the session existed at download time.
   - This layer stays in the backlog until auth, tickets, and persistence land; track work under steps 6–10 below.

## Prerequisites
1. Canonical session schema package (`packages/session-schema`) used across recorder, download/export, and backend validators.
2. Hashing helper package (`packages/session-hash`) that serializes the session bundle deterministically (stable ordering, trimmed whitespace).
3. Documentation of the API handshake and UI affordances so future PRs stay aligned.

## Work Plan (suggested commit / PR boundaries)
1. **`docs: define session hashing handshake`**
   - Author `docs/backend-api-spec.md` capturing the download → register → upload → verify lifecycle, payload schemas, and crypto choices (SHA-256 + canonical JSON).
   - Update `docs/frontend-recorder-schema.md` + `docs/backend-considerations.md` with references to the hashing fields (`sessionHash`, `hashVersion`, receipt IDs).

2. **`chore: scaffold shared session schema package`**
   - Create `packages/session-schema` with TypeScript types, JSON Schema, and fixtures for authentic/tampered sessions.
   - Provide validation helpers consumed by both the frontend exporter and backend ingestion API.

3. **`chore: add canonical hashing helpers`**
   - Publish `packages/session-hash` exposing `computeSessionHash(bundle)` that removes volatile fields, converts to canonical JSON, and outputs `{hash, hashVersion}`.
   - Add Vitest coverage for determinism and parity checks against Python reference vectors.

4. **`feat(frontend): embed hash on download`**
   - ✅ The archive builder now serializes `{sessionId, editorHTML, events}` and computes the SHA-256 hash before any backend calls.
   - When `VITE_LEDGER_API_BASE_URL` is set, the download flow POSTs to `/api/v1/hashes` with `{sessionId, sessionHash, metadata}` and records the returned `receiptId` + `hashVersion` inside `manifest.json -> ledgerReceipt`.
   - UI feedback (transfer note + ribbon badge) tells writers when a receipt has been stored.

5. **`feat(frontend): add uploader + verification UI`**
   - ✅ Playback’s upload prompt already validates archives locally; it now looks for `manifest.ledgerReceipt`, calls `/api/v1/hashes/verify`, and updates a new ledger badge when the backend reports `verified`/`mismatch`/`unknown`.
   - Ledger env vars are optional, so reviewers still get offline verification even if the backend is disabled.

6. **`chore(backend): bootstrap FastAPI service`**
   - Add `backend/` with `pyproject.toml`, `uv.lock`, `app/main.py`, Ruff config, and `/health` route so `uv run uvicorn app.main:app --reload --port 8000` works.
   - Include pytest scaffolding and CI notes in `README.md`.

7. **`feat(backend): hash registration endpoint`**
   - Implement `/api/v1/hashes` (API-key auth) that validates payloads via `session-schema`, stores them in an initial persistence layer (in-memory or SQLite), and returns a signed `receiptId`.
   - Record audit metadata (download timestamp, client build, optional signer) for compliance.

8. **`feat(backend): verification endpoint`**
   - Build `/api/v1/hashes/verify` returning `{status, expectedHash, firstSeenAt, receiptId}`.
   - Abstract persistence so we can swap the store for Postgres + S3 later and add Alembic migrations.

9. **`feat(full-stack): wire UI to backend results`**
   - Add environment-driven base URL + API key handling inside the frontend.
   - Display verification badges in playback (e.g., `Verified`, `Mismatch`, `Offline`).
   - Provide mock handlers for local dev so the UI still works without the backend.

10. **`chore: demo assets + automation`** *(backlog once Layer 2 ships)*
    - Publish two sample session files (authentic vs tampered) under `docs/demo-sessions/`.
    - Add a `Makefile` or npm script documenting the “record → download → register → upload → verify” happy path.

### Additional Backlog
- **`feat(recorder): drop untrusted DOM events`** — update `useDomRecorder` and related clipboard hooks to skip `InputEvent`s where `event.isTrusted === false`, log suppression metrics, and surface an analysis flag when scripted activity is detected.

## Offline tampering risk & mitigations
- Offline downloads can be edited and re-hashed before a later ledger registration; hashes alone cannot prove provenance, only integrity of whatever payload is presented.
- Mitigations we’re adopting:
  - Keep the server in the loop at export: receipts are issued by the backend (server-signed) and embedded alongside the hash so the client can show “registered vs. offline” at playback.
  - Treat offline exports as lower-trust: the UI surfaces ledger status; unregistered archives are clearly flagged rather than auto-trusted.
  - Avoid storing content server-side for now; long-term, a server-held archive (or presigned upload at export time) plus a signed receipt would shut the gap entirely.
- We are not attempting client-side obfuscation; determined users can still edit JSON. Provenance relies on server-issued receipts, not on hiding the format.

## Open Questions
- Do we require the backend to store full session payloads later, or are hashes + metadata enough until ingestion lands?
- Which auth mechanism ships first (static API key vs signed JWT from LMS)?
- How soon do we migrate the persistence layer from in-memory → SQLite → Postgres?

Keep this document updated as each PR lands so reviewers can trace which slice of the handshake is live.

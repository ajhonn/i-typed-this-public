# i-typed-this

**i-typed-this** records, replays, and analyses writing sessions so authors and reviewers can see *how* a text was produced — keystroke-by-keystroke.
It’s designed as an educational integrity and authorship-evidence tool.

---

## 🚀 Project goals

* Accurate local recording and playback of typing sessions (client-only).
* Simple verification API (HMAC over session hash; no content stored).
* Optional login and file system for saving, loading, and sharing sessions.

---

## 🧱 Repository structure

```
i-typed-this/
│
├─ frontend/          # React + TypeScript + Tailwind client app
├─ backend/           # FastAPI verification API + hash ledger
├─ docs/              # MVP plans, recorder schema, hashing + API specs
├─ .devcontainer/     # Dev environment definition
├─ .github/           # CI workflows
└─ Makefile           # Common commands
```

Shared packages will eventually live in `packages/`; until those modules are published, any schema or hashing notes reside in `docs/`.

---

## 🥉 Tech stack

| Layer    | Tools                                                        |
| -------- | ------------------------------------------------------------ |
| Frontend | React, TypeScript, Vite, Tailwind, Vitest, ESLint / Prettier |
| Backend  | FastAPI, SQLAlchemy, Alembic, Pydantic v2, Ruff, pytest      |
| Infra    | GCP Cloud Run, Cloud SQL, Terraform, GitHub Actions CI       |

---

## 🧰 Development setup

### 1. Clone

```
git clone https://github.com/<you>/i-typed-this.git
cd i-typed-this
```

### 2. Dev environment (WSL / Dev Container)

* Open in VS Code → **Reopen in WSL** or **Reopen in Container**
* Required: Node LTS, Python 3.11+

### 3. Run frontend

```
cd frontend
npm install
npm run dev
```

### 4. Prepare & run backend

```
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The backend defaults to SQLite at `backend/data/hash_receipts.db` and an API key of `demo-api-key`. The repo includes a `.env` pointing to Supabase/Postgres on `127.0.0.1:54322`; run `supabase start` from the repo root to satisfy that, or unset `I_TYPED_THIS_DATABASE_URL` to stay on SQLite.
Override as needed:

```
I_TYPED_THIS_API_KEY=your-key
I_TYPED_THIS_DATABASE_URL=postgresql://...
```

When pointing at Postgres or Supabase, initialize the ledger table once:

```
psql "$I_TYPED_THIS_DATABASE_URL" -f supabase/seed.sql
# or: supabase db reset
```

### 5. Install pre-commit hooks

These hooks guard lint and test standards locally before code lands in CI.

```
pipx install pre-commit            # or pip install pre-commit
pre-commit install
```

Hooks run frontend ESLint/Vitest and backend Ruff/pytest (skipping backend checks until the service directory exists). Use `pre-commit run --all-files` to validate everything manually.

### 6. Continuous integration

The GitHub Actions workflow at `.github/workflows/ci.yml` mirrors local checks on every push and pull request against `main`:

- A detection job checks whether the backend service exists (by looking for `backend/pyproject.toml`) and shares that state with downstream jobs.
- Frontend job installs Node 20, restores npm cache, runs `npm ci`, then executes `npm run lint` and `npm run test -- --run --passWithNoTests`.
- Backend job runs only when the detection job confirms the backend is present; it installs dependencies with `uv sync --all-extras --dev`, runs `uv run ruff check .`, and finishes with `uv run pytest`.

CI acts as a gatekeeper so branches without passing lint/tests never land in protected branches.

### Makefile shortcuts

Common tasks live in `Makefile`:

```
make frontend-install   # npm install
make frontend-dev       # npm run dev
make backend-sync       # uv sync
make backend-dev        # uv run uvicorn app.main:app --reload --port 8000
make lint               # frontend + backend lint
make test               # frontend + backend tests
```

### 7. Optional ledger integration

Configure the FastAPI ledger and the frontend to register/verify session hashes:

**Backend env**

```
I_TYPED_THIS_API_KEY=demo-api-key             # change in prod
# Optional: switch from SQLite to Postgres/Supabase
I_TYPED_THIS_DATABASE_URL=postgresql://...
```

**Frontend env**

```
VITE_LEDGER_API_BASE_URL=http://localhost:8000
VITE_LEDGER_API_KEY=demo-api-key
```

**Smoke test the ledger (with backend running)**

```
curl -X POST http://localhost:8000/api/v1/hashes \
  -H 'X-API-Key: demo-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"session-123","sessionHash":"abc123","hashVersion":"v1","metadata":{}}'

curl -X POST http://localhost:8000/api/v1/hashes/verify \
  -H 'Content-Type: application/json' \
  -d '{"receiptId":"<from-above>","sessionId":"session-123","sessionHash":"abc123"}'
```

When set, every download registers a receipt via `/api/v1/hashes`, embeds it inside the archive manifest, and uploads will call `/api/v1/hashes/verify` to surface backend verdicts in playback.

---

## Docs

* `docs/frontend-mvp-plan.md` — recorder, playback, and analysis milestones for the client MVP.
* `docs/frontend-recorder-schema.md` — canonical event model, clipboard ledger, and archive format details.
* `docs/backend-session-hashing-plan.md` — Layer 1/Layer 2 hashing roadmap plus shared work plan.
* `docs/backend-api-spec.md` — FastAPI hash registration + verification contract used by the upcoming integration.

---

## 🧑‍💻 Contributing

1. One feature = one issue = one PR.
2. Add or update tests for any change.
3. Keep PRs < 400 LOC and update docs if APIs change.
4. Use `make test` before pushing — CI must pass.

---

## License

Apache-2.0 © 2025 i-typed-this contributors

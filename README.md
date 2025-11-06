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
├─ backend/           # FastAPI verification API
├─ packages/          # Shared logic (Frame types, serialization, paste classifier)
├─ docs/              # Architecture, hashing spec, API contract
├─ .devcontainer/     # Dev environment definition
├─ .github/           # CI workflows
└─ Makefile           # Common commands
```

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

---

## Docs

* `docs/architecture.md` — high-level system overview
* `docs/hashing-spec.md` — deterministic serialization for verification
* `docs/api-contract.md` — endpoint definitions

---

## 🧑‍💻 Contributing

1. One feature = one issue = one PR.
2. Add or update tests for any change.
3. Keep PRs < 400 LOC and update docs if APIs change.
4. Use `make test` before pushing — CI must pass.

---

## License

Apache-2.0 © 2025 i-typed-this contributors

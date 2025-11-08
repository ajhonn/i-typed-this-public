# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` bundles the React + TypeScript client; group screens under `features/` and shared UI in `components/`.
- `backend/` holds the FastAPI service; keep routers in `app/api/`, reusable logic in `app/services/`, and persistence code in `app/db/`.
- `packages/` stores cross-cutting logic (frame codecs, hashing helpers, paste classifier); publish shared primitives here first.
- `docs/` contains living specs (architecture, hashing, API). Update it alongside protocol or endpoint changes.
- The repo root carries `.github/` workflows, `.devcontainer/` setup, and the planned `Makefile`; keep new automation scripts here.

## Build, Test, and Development Commands
```bash
cd frontend && npm install        # Install Vite + React deps (run once after cloning)
cd frontend && npm run dev        # Start the Tailwind-aware dev server on localhost:5173
cd frontend && npm run test       # Execute the Vitest suite in watch or CI mode
cd backend && uv sync             # Resolve Python deps defined in `pyproject.toml`
cd backend && uv run uvicorn app.main:app --reload --port 8000   # Launch FastAPI locally
cd backend && uv run pytest       # Run backend tests with ephemeral SQLite by default
```

## Coding Style & Naming Conventions
- TypeScript: 2-space indent, strict mode, React components in PascalCase, hooks in camelCase prefixed with `use`.
- Styling: prefer Tailwind utilities; scope any extra CSS modules beside the component.
- Python: format and lint with Ruff; target 4-space indent and dependency-injected services.
- Shared packages: export typed APIs via `index.ts` or `__init__.py` and note protocol tweaks in `docs/hashing-spec.md`.

## Testing Guidelines
- Frontend uses Vitest (`npm run test`) + Testing Library; mirror component file names with `.test.tsx`.
- Backend uses pytest (`uv run pytest`); name test files `test_<module>.py` and rely on fixtures for keystroke timelines.
- Keep coverage at or above 85% for frontend and backend, adding regression tests whenever replay or hashing logic shifts.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`…) for clarity and changelog generation; squash trivial WIP commits before pushing.
- Each PR should map to a single GitHub issue, include a succinct summary, test plan output, and screenshots or HAR captures when UI flows or API responses shift.
- Keep PRs under ~400 changed lines; coordinate cross-repo updates in advance when touching shared packages or protocol docs.
- Agents should stage code but leave commits to the human reviewer. After each milestone, provide (1) a succinct verification checklist (tests, manual steps) and (2) a suggested Conventional Commit message the human can run once satisfied.
- Favor small, self-contained commits (e.g., one per button/feature/doc tweak) so every change is testable in isolation and easy to review or revert. Flag natural commit boundaries when sharing status updates.

## Documentation & Decision Making
- Prefer official documentation for installation, configuration, and API references; when unsure, ask for the relevant docs instead of improvising so the human can provide the latest source.
- Before adding or upgrading dependencies, consult the official docs/release notes and note the reference in PR descriptions or doc updates.
- Capture methodology, rationale, and trade-offs in `docs/` alongside implementation updates so readers understand *why* changes were made, not just *what* changed.
- When adding new tooling or dependencies, note the purpose, configuration surface, and maintenance plan in the relevant doc (e.g., `docs/architecture.md` or feature-specific ADRs).
- Treat `docs/frontend-mvp-concept.md` (and its companion specs) as the source of truth for client architecture and evolution; update those documents in lockstep with code changes.
- Use `docs/frontend-mvp-task-list.md` to coordinate implementation steps and testing expectations so agents stay aligned.

## Communication & Rationale
- When reporting progress or proposing changes, explicitly cover **why** the work matters (tie it back to the MVP plan/task list), **what** is being changed, and **how** it will be executed so humans can track the reasoning.
- Reference the relevant docs, specs, or tickets whenever outlining the plan to ground conversations in shared context.
- After every meaningful change/commit suggestion, offer to capture an ELI5 recap in `docs/learning/` (even though it’s gitignored) and propose at least one new topic that isn’t documented yet so the human can request it. Use `docs/learning/README.md` as the quick index to avoid re-reading every note.

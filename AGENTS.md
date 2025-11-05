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

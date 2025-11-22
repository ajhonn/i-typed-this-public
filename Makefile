.PHONY: help frontend-install frontend-dev frontend-lint frontend-test backend-sync backend-dev backend-lint backend-test lint test

help:
	@echo "Common targets:"
	@echo "  frontend-install   Install frontend dependencies"
	@echo "  frontend-dev       Run the Vite dev server"
	@echo "  frontend-lint      Run frontend lint checks"
	@echo "  frontend-test      Run frontend tests"
	@echo "  backend-sync       Install backend dependencies via uv"
	@echo "  backend-dev        Run FastAPI with reload"
	@echo "  backend-lint       Run backend lint (ruff)"
	@echo "  backend-test       Run backend pytest suite"
	@echo "  lint               Run frontend + backend lint"
	@echo "  test               Run frontend + backend tests"

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-lint:
	cd frontend && npm run lint

frontend-test:
	cd frontend && npm run test -- --run --passWithNoTests

backend-sync:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

backend-lint:
	cd backend && uv run ruff check .

backend-test:
	cd backend && uv run pytest

lint: frontend-lint backend-lint

test: frontend-test backend-test

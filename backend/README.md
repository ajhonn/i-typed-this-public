# Backend verification service

This directory hosts the FastAPI service that registers session hashes and verifies them
against a small ledger. Use this for demos of the Layer 2 verification stack described in
`docs/backend-session-hashing-plan.md`.

## Getting started

1. Install `uv` (https://github.com/pypa/uv) and make sure it is on your `PATH`.
2. Run `uv sync` to create `uv.lock` and install dependencies.
3. Start the development server:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The service exposes `/health`, `/api/v1/hashes`, and `/api/v1/hashes/verify`. Provide the API
key defined via the `I_TYPED_THIS_API_KEY` environment variable when calling the hash
registration endpoint.

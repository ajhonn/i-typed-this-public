from fastapi import FastAPI

from app.api.hashes import router as hashes_router


def _create_app() -> FastAPI:
    app = FastAPI(
        title="i-typed-this hash ledger",
        version="0.1.0",
        description="Registers session hashes and responds with verification receipts.",
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(hashes_router)

    return app


app = _create_app()

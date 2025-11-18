from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.hashes import router as hashes_router
from app.services.settings import get_settings


def _create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="i-typed-this hash ledger",
        version="0.1.0",
        description="Registers session hashes and responds with verification receipts.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(hashes_router)

    return app


app = _create_app()

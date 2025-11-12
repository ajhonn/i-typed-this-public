from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = Field("demo-api-key")
    database_path: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "data" / "hash_receipts.db"
    )
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="I_TYPED_THIS_",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

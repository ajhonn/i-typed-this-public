from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.services.auth import require_api_key
from app.services.persistence import PostgresReceiptStore, ReceiptStore
from app.services.settings import get_settings

settings = get_settings()
if settings.database_url:
    store = PostgresReceiptStore(settings.database_url)
else:
    store = ReceiptStore(settings.database_path)

router = APIRouter(prefix="/api/v1/hashes", tags=["hashes"])


class HashRegistrationRequest(BaseModel):
    session_id: str = Field(alias="sessionId")
    session_hash: str = Field(alias="sessionHash")
    hash_version: str = Field(default="v1", alias="hashVersion")
    metadata: dict[str, Any] = Field(default_factory=dict, alias="metadata")

    model_config = ConfigDict(populate_by_name=True)


class HashRegistrationResponse(BaseModel):
    receipt_id: str = Field(alias="receiptId")
    session_id: str = Field(alias="sessionId")
    session_hash: str = Field(alias="sessionHash")
    hash_version: str = Field(alias="hashVersion")
    first_seen_at: str = Field(alias="firstSeenAt")

    model_config = ConfigDict(populate_by_name=True)


class HashVerificationRequest(BaseModel):
    receipt_id: str = Field(alias="receiptId")
    session_id: str = Field(alias="sessionId")
    session_hash: str = Field(alias="sessionHash")

    model_config = ConfigDict(populate_by_name=True)


class HashVerificationResponse(BaseModel):
    status: Literal["verified", "mismatch", "unknown"]
    first_seen_at: str | None = Field(default=None, alias="firstSeenAt")
    receipt_id: str | None = Field(default=None, alias="receiptId")
    session_id: str | None = Field(default=None, alias="sessionId")

    model_config = ConfigDict(populate_by_name=True)


@router.post("/", response_model=HashRegistrationResponse)
def register_hash(
    payload: HashRegistrationRequest,
    _api_key: str = Depends(require_api_key),
) -> HashRegistrationResponse:
    receipt = store.register(
        session_id=payload.session_id,
        session_hash=payload.session_hash,
        hash_version=payload.hash_version,
        metadata=payload.metadata,
    )
    return HashRegistrationResponse(
        receipt_id=receipt.receipt_id,
        session_id=receipt.session_id,
        session_hash=receipt.session_hash,
        hash_version=receipt.hash_version,
        first_seen_at=receipt.first_seen_at,
    )


@router.post("/verify", response_model=HashVerificationResponse)
def verify_hash(payload: HashVerificationRequest) -> HashVerificationResponse:
    receipt = store.get_by_receipt_id(payload.receipt_id)

    if not receipt:
        return HashVerificationResponse(
            status="unknown",
            receipt_id=payload.receipt_id,
            session_id=payload.session_id,
        )

    status = "verified"
    if payload.session_id != receipt.session_id or payload.session_hash != receipt.session_hash:
        status = "mismatch"

    return HashVerificationResponse(
        status=status,
        first_seen_at=receipt.first_seen_at,
        receipt_id=receipt.receipt_id,
        session_id=receipt.session_id,
    )


def get_store() -> ReceiptStore:
    return store


def set_store(custom_store: ReceiptStore) -> None:
    global store
    store = custom_store

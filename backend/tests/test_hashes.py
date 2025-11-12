from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api import hashes
from app.main import app
from app.services.persistence import ReceiptStore


API_KEY = "demo-api-key"


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    db_path = tmp_path / "hashed.db"
    custom_store = ReceiptStore(db_path)
    hashes.set_store(custom_store)
    return TestClient(app)


def test_register_and_verify_session(client: TestClient) -> None:
    payload = {
        "session_id": "session-123",
        "session_hash": "abc123",
        "hash_version": "v1",
        "metadata": {"client": "test"},
    }

    response = client.post("/api/v1/hashes", json=payload, headers={"X-API-Key": API_KEY})
    assert response.status_code == 200
    receipt = response.json()
    assert receipt["sessionId"] == payload["session_id"]

    verify_response = client.post(
        "/api/v1/hashes/verify",
        json={
            "receiptId": receipt["receiptId"],
            "sessionId": "session-123",
            "sessionHash": "abc123",
        },
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "verified"


def test_verify_mismatch(client: TestClient) -> None:
    payload = {
        "session_id": "session-456",
        "session_hash": "good",
        "hash_version": "v1",
    }
    register_response = client.post("/api/v1/hashes", json=payload, headers={"X-API-Key": API_KEY})
    assert register_response.status_code == 200
    receipt = register_response.json()

    mismatch_response = client.post(
        "/api/v1/hashes/verify",
        json={
            "receiptId": receipt["receiptId"],
            "sessionId": "session-456",
            "sessionHash": "bad",
        },
    )
    assert mismatch_response.json()["status"] == "mismatch"


def test_verify_unknown(client: TestClient) -> None:
    unknown_response = client.post(
        "/api/v1/hashes/verify",
        json={"receiptId": "missing", "sessionId": "missing", "sessionHash": "missing"},
    )
    assert unknown_response.status_code == 200
    assert unknown_response.json()["status"] == "unknown"

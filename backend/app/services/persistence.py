from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pydantic import BaseModel


class HashReceipt(BaseModel):
    receipt_id: str
    session_id: str
    session_hash: str
    hash_version: str
    metadata: dict[str, Any]
    first_seen_at: str


class ReceiptStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(str(db_path), check_same_thread=False)
        self.connection.execute("PRAGMA journal_mode = WAL;")
        self._ensure_table()

    def _ensure_table(self) -> None:
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS receipts (
                session_id TEXT PRIMARY KEY,
                session_hash TEXT NOT NULL,
                hash_version TEXT NOT NULL,
                receipt_id TEXT NOT NULL,
                metadata TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        self.connection.commit()

    def register(
        self,
        session_id: str,
        session_hash: str,
        hash_version: str,
        metadata: dict[str, Any] | None = None,
    ) -> HashReceipt:
        receipt_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        payload = json.dumps(metadata or {})
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO receipts (session_id, session_hash, hash_version, receipt_id, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    session_hash=excluded.session_hash,
                    hash_version=excluded.hash_version,
                    receipt_id=excluded.receipt_id,
                    metadata=excluded.metadata,
                    created_at=excluded.created_at
                """,
                (session_id, session_hash, hash_version, receipt_id, payload, created_at),
            )
        metadata_record = metadata or {}
        return HashReceipt(
            receipt_id=receipt_id,
            session_id=session_id,
            session_hash=session_hash,
            hash_version=hash_version,
            metadata=metadata_record,
            first_seen_at=created_at,
        )

    def _row_to_receipt(self, row: tuple[str, str, str, str, str, str]) -> HashReceipt:
        session_id, session_hash, hash_version, receipt_id, raw_metadata, created_at = row
        return HashReceipt(
            receipt_id=receipt_id,
            session_id=session_id,
            session_hash=session_hash,
            hash_version=hash_version,
            metadata=json.loads(raw_metadata),
            first_seen_at=created_at,
        )

    def get_by_session_id(self, session_id: str) -> HashReceipt | None:
        cursor = self.connection.execute(
            "SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at FROM receipts WHERE session_id = ?",
            (session_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)

    def get_by_hash(self, session_hash: str) -> HashReceipt | None:
        cursor = self.connection.execute(
            "SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at FROM receipts WHERE session_hash = ? ORDER BY created_at LIMIT 1",
            (session_hash,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)

    def get_by_receipt_id(self, receipt_id: str) -> HashReceipt | None:
        cursor = self.connection.execute(
            "SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at FROM receipts WHERE receipt_id = ?",
            (receipt_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)


class PostgresReceiptStore:
    def __init__(self, dsn: str) -> None:
        import psycopg

        self.dsn = dsn
        self._psycopg = psycopg
        self.connection = psycopg.connect(dsn)
        self.connection.autocommit = True
        self._ensure_table()

    def _ensure_table(self) -> None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS receipts (
                    session_id TEXT PRIMARY KEY,
                    session_hash TEXT NOT NULL,
                    hash_version TEXT NOT NULL,
                    receipt_id TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_receipts_session_hash
                ON receipts (session_hash)
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_receipts_receipt_id
                ON receipts (receipt_id)
                """
            )

    def register(
        self,
        session_id: str,
        session_hash: str,
        hash_version: str,
        metadata: dict[str, Any] | None = None,
    ) -> HashReceipt:
        receipt_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        payload = json.dumps(metadata or {})
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO receipts (session_id, session_hash, hash_version, receipt_id, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (session_id) DO UPDATE SET
                    session_hash = EXCLUDED.session_hash,
                    hash_version = EXCLUDED.hash_version,
                    receipt_id = EXCLUDED.receipt_id,
                    metadata = EXCLUDED.metadata,
                    created_at = EXCLUDED.created_at
                """,
                (session_id, session_hash, hash_version, receipt_id, payload, created_at),
            )
        metadata_record = metadata or {}
        return HashReceipt(
            receipt_id=receipt_id,
            session_id=session_id,
            session_hash=session_hash,
            hash_version=hash_version,
            metadata=metadata_record,
            first_seen_at=created_at,
        )

    def _row_to_receipt(self, row: tuple[str, str, str, str, str, str]) -> HashReceipt:
        session_id, session_hash, hash_version, receipt_id, raw_metadata, created_at = row
        return HashReceipt(
            receipt_id=receipt_id,
            session_id=session_id,
            session_hash=session_hash,
            hash_version=hash_version,
            metadata=json.loads(raw_metadata),
            first_seen_at=created_at,
        )

    def get_by_session_id(self, session_id: str) -> HashReceipt | None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at
                FROM receipts
                WHERE session_id = %s
                """,
                (session_id,),
            )
            row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)

    def get_by_hash(self, session_hash: str) -> HashReceipt | None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at
                FROM receipts
                WHERE session_hash = %s
                ORDER BY created_at
                LIMIT 1
                """,
                (session_hash,),
            )
            row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)

    def get_by_receipt_id(self, receipt_id: str) -> HashReceipt | None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT session_id, session_hash, hash_version, receipt_id, metadata, created_at
                FROM receipts
                WHERE receipt_id = %s
                """,
                (receipt_id,),
            )
            row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_receipt(row)

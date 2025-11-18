# Backend API spec (Layer 2 ledger)

This service implements the hash registration and verification endpoints described in
`docs/backend-session-hashing-plan.md`. Keep this spec synced with any route or schema changes.

## Auth
* Every request that registers a hash must supply the `X-API-Key` header.
* The key defaults to `demo-api-key` but can be overridden via `I_TYPED_THIS_API_KEY`.
* Verification requests remain unauthenticated for now so the frontend can replay receipts without additional setup.

## Model (shared schema)
All sessions provide:

| Field         | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| `sessionId`   | string | Client-generated UUID for the session. |
| `sessionHash` | string | Canonical SHA-256 computed during export. |
| `hashVersion` | string | Collation version. Defaults to `v1`.     |
| `metadata`    | object | Optional capture of client build, user, etc. |

## POST `/api/v1/hashes`
Registers a session hash and returns a signed receipt.

**Request body**
```json
{
  "sessionId": "...",
  "sessionHash": "...",
  "hashVersion": "v1",
  "metadata": { "clientVersion": "web@1.2.3" }
}
```

**Response**
```json
{
  "receiptId": "uuid",
  "sessionId": "...",
  "sessionHash": "...",
  "hashVersion": "v1",
  "firstSeenAt": "2024-10-03T...Z"
}
```

## POST `/api/v1/hashes/verify`
Compares the supplied session or hash against the ledger.

**Request body**
```json
{
  "receiptId": "...",
  "sessionId": "...",
  "sessionHash": "..."
}
```

All three fields are required: `receiptId` determines which record to inspect, and the backend compares the provided `sessionId` and `sessionHash` against the stored values to decide whether the submission is authentic, mismatched, or unknown.

**Response**
```json
{
  "status": "verified", // or "mismatch" / "unknown"
  "firstSeenAt": "...",
  "receiptId": "...",
  "sessionId": "..."
}
```

`status` transitions:
1. `verified` when the receipt exists and the submitted `sessionId`/`sessionHash` match the stored values.
2. `mismatch` when the receipt exists but either the `sessionId` or `sessionHash` differ.
3. `unknown` when no matching receipt exists.

Use this endpoint to feed the verification badge described in the frontend roadmap (`docs/frontend-mvp-plan.md`). The client now stores the `receiptId` returned during download inside each archive’s `manifest.json` (`ledgerReceipt.receiptId`), so uploads can automatically call `/verify` without prompting the reviewer.

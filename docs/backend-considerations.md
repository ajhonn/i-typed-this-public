# Backend Considerations & Future Expansion

> Planning document for moving beyond the client-only MVP. Outlines service architecture, modular API design, and go-to-market opportunities once telemetry needs to leave the browser.

## 1. MVP Baseline (Client-Only)
- All telemetry (event log, clipboard hashes, analysis) lives in the browser; export/import handled by JSON files.
- No server dependency keeps the PoC private and side-effects free.
- Drawback: reviewers must manually share session files; no centralized storage or authentication.

## 2. Backend Goals (when we outgrow client-only)
1. **Session Ingestion & Storage**
   - Accept telemetry from trusted clients (web app, partner components) via secure API.
   - Store raw events plus derived metrics in a structured schema (e.g., Postgres + S3 for snapshots).
2. **Realtime Validation**
   - Provide immediate feedback: confirm session integrity, flag anomalies as data arrives.
3. **Playback Service**
   - Serve reconstructed sessions to authorized viewers (schools, partners) with minimal latency.
4. **Analytics & Reporting**
   - Compute advanced metrics server-side (ML models, cohort comparisons).
5. **Security & Compliance**
   - AuthN/AuthZ for institutions; data residency considerations; consent logging.

## 3. Proposed Architecture
- **Ingestion API (FastAPI or similar)**
  - Endpoint `/sessions` accepts authenticated POST of session bundle (events, metadata, hashes).
  - Validate payload signature (HMAC) to prevent tampering.
  - Queue for processing (e.g., Redis/RQ, Celery, or serverless queue) to decouple frontdoor from heavy analysis.
- **Processing Worker**
  - Runs analysis pipeline (same heuristics as client, with option to use ML models).
  - Generates artifacts (timeline segments, metrics, risk score).
- **Storage Layer**
  - Relational DB for metadata (`session_id`, user, institution, statuses).
  - Object storage for raw logs and snapshot bundles.
- **Playback API**
  - Endpoint `/sessions/{id}/replay` streams canonical session representation.
  - Option to generate signed URLs for temporary access.
- **Auth & Tenancy**
  - Token-based auth (JWT or API keys) with tenant scoping.
  - Audit logs for session uploads and views.

## 4. Modular Component Strategy (TAM Expansion)
Create embeddable components / SDKs that capture the same telemetry and forward it to the API.

### Potential Products
| Component | Audience | Pain Point | Value |
| --------- | -------- | ---------- | ----- |
| **Web SDK** | Edtech platforms, LMS vendors | Need lightweight proof of authentic work within their app | Drop-in recorder + API integration; corporate licensing. |
| **Desktop Plugin** | Exam software, secure browsers | Monitor offline or controlled assessments | Sends keystroke data to API for post-exam review. |
| **Authoring Tool Integration** | Word/Docs add-ins | Institutions already using Microsoft/Google suites | Collect telemetry without forcing users into new editor. |
| **Verification Portal** | Employers, certification bodies | Validate take-home tests or long-form assessments | Upload sessions + view authenticated playback via datacenter. |

### Monetisation Models
- SaaS licensing per institution (seat-based or volume of sessions).
- API usage fees for partners embedding the SDK.
- Premium analytics dashboards (cohort benchmarking, risk alerts).
- Optional certification service (official “authentic session” reports).

## 5. API Modularisation Plan
- Define a versioned schema for telemetry (`v1 session bundle`), shared by web MVP and server.
- Publish OpenAPI spec so partners can integrate without code copying.
- Build a compatibility layer: client-only mode uses in-browser analysis; connected mode posts to API and waits for signed results.
- Keep recorder/analysis packages in `packages/` so both frontend and backend share logic (e.g., `packages/session-schema`, `packages/analysis-core`).

## 6. Backend Roadmap (Post-MVP)
1. Stand up minimal FastAPI service with `/health` and `/sessions` endpoints (authenticated).
2. Port client heuristics into a shared Python module; validate against sample sessions.
3. Add playback API returning normalized timeline; build viewer that consumes remote data.
4. Integrate storage (Postgres + S3/Blob) with retention policies and encryption.
5. Layer on multi-tenant auth, dashboards, and admin controls.
6. Explore ML modelling (random forest from research paper) using anonymized datasets.

## 7. Risks & Mitigations
- **Privacy/legal**: telemetry may be considered educational records; ensure consent flow and data minimization.
- **Latency**: real-time playback demands low-latency processing; use queues and caching snapshots.
- **SDK trust**: third parties must not forge telemetry; use signed payloads and embed anti-tamper checks in recorder.
- **Scalability**: design ingestion to scale with spikes (batch submissions before deadlines).

## 8. Next Steps
- Draft API schema document (`docs/backend-api-spec.md`).
- Evaluate hosting options (cloud provider, costs, compliance requirements).
- Identify early partners or pilot institutions to validate requirements.

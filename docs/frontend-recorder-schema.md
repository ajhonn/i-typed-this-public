# Frontend Recorder Schema & Clipboard Matching

## Event Model

| Event Type | Required Fields | Description |
| ---------- | --------------- | ----------- |
| `text-input` | `timestamp`, `caret`, `insertedText`, `selectionBefore`, `composition` flag | Raw text insertion originating from keyboard input or IME composition. |
| `delete` | `timestamp`, `caret`, `deletedText`, `selectionBefore` | Character or range removal (backspace, delete, or editor-level command). |
| `selection-change` | `timestamp`, `rangeStart`, `rangeEnd` | Optional but useful for understanding revision intent and preparing for copy operations. |
| `copy` | `timestamp`, `rangeStart`, `rangeEnd`, `contentHash`, `textLength` | Emitted when the user copies a selection via keyboard shortcut or context menu. |
| `cut` | `timestamp`, `rangeStart`, `rangeEnd`, `contentHash`, `textLength` | Mirrors `copy`, while `delete` will capture the resulting removal. |
| `paste` | `timestamp`, `caret`, `textLength`, `contentHash`, `source` | Records inserted payloads; `source` tracks heuristics (e.g., `trusted`, `unmatched`, `clipboard-permission-denied`). |
| `undo` / `redo` | `timestamp`, `stackSize` | Helps distinguish manual edits from automated reversions. |
| `pause` (derived) | `startTimestamp`, `duration` | Generated when the interval between events exceeds the pause threshold (default 2 s). |

All events record the session `versionId` so playback and analysis can resolve document state at that moment.

## Clipboard Ledger & Hashing Strategy

- Maintain a bounded queue (`clipboardLedger`) of the most recent `copy` and `cut` events, storing:
  - `timestamp`
  - `contentHash` (e.g., SHA-256 or rolling hash digest)
  - `textLength`
  - `originalRange` and `versionId`
- Implementation notes (current recorder state):
  - Uses a lightweight 32-bit FNV-1a hash plus the payload length to fingerprint clipboard text quickly on every copy, cut, and paste.
  - Ledger capacity is trimmed to the 50 most recent entries and pruned after 10 minutes to bound memory while covering typical drafting sessions.
  - Copy/cut DOM listeners emit dedicated recorder events so analysts can tell when text is staged internally even if it is never pasted.
- On every `paste`:
  1. Compute the same `contentHash` for the pasted payload.
  2. Look up matching ledger entries within a configurable window (e.g., last 10 minutes). If a hash matches and the document version is compatible, classify as `internal`.
  3. If no ledger match, scan the current document for the hash (or exact text) to detect duplication inside the session.
  4. Fallback classification: `unmatched`. Attach diagnostic metadata (e.g., time since last keypress, payload length) for analysis and playback surfacing.
- Rolling hashes can optimize document scans: slide a fixed-size window across the content to detect repetitions without recomputing from scratch. For small payloads, a direct string search is sufficient.

## Trusted Source Heuristics

- Correlate paste events with preceding user gestures (keyboard shortcut, context menu click) to ensure they originate from deliberate actions.
- Track rapid-fire paste sequences or payloads far larger than typical typing to raise suspicion.
- When browser permissions allow, query the async Clipboard API to confirm clipboard ownership at paste time; log the permission state in the `source` field.

## Playback Considerations

- Store periodic snapshots (e.g., every N events or seconds) so playback can seek efficiently without replaying the entire log. Snapshots include the rendered HTML plus cursor position.
- Event log plus snapshots feed the timeline:
  - Consecutive `text-input` events collapse into `typing` segments.
  - `delete` clusters represent revisions.
  - `pause` events mark idle sections.
  - `paste` segments display hash-match status (`internal`, `duplicate`, `unmatched`) with distinct colours.

## Recorder Memory Strategy

- **Current safeguard:** the recorder now keeps up to 1,000,000 transaction events in memory before trimming the oldest entries. This buffers long drafting sessions without immediately threatening RAM usage, but it is still a blunt ceiling.
- **Immediate TODO:** surface a visible error when we hit that limit so the user knows their timeline is frozen. (Recorder code currently carries a TODO to replace the limit with smarter management.)

### Near-term improvements

1. **Measure actual footprint.** When Chromium’s `performance.memory` is available, poll `usedJSHeapSize`/`jsHeapSizeLimit`; elsewhere fall back to estimating serialized session size (HTML snapshot bytes + event payloads). Use these numbers to warn well before OOMs.
2. **Memory-aware throttling.** Instead of a fixed event count, pause recording once we exceed a configurable byte budget (e.g., 10–20 MB) and prompt the user to download/clear the session. This keeps data loss explicit rather than silent.

### Backlog: archival compression

- Split very long sessions into “chapters” (e.g., chunks of 5–10k events), compress each chunk individually, and stream them to disk (IndexedDB or backend storage). Playback would load chunks lazily, decompressing only the portion being reviewed.
- Support re-compression of older chapters so we keep a lightweight in-memory head while retaining the full fidelity log on disk or in the exported zip (multiple compressed files bundled together).

## Session Archive Format

- **Bundle layout:** downloads now produce a `.zip` file containing `session.json` (raw recorder payload), `manifest.json`, and a plain-text `README.txt`. The README ships inside every archive so reviewers immediately know how to replay and verify the session.
- **Signing strategy:** before zipping, the client serializes the session and computes a SHA-256 digest. The digest, archive version, and timestamp land in `manifest.json`. The manifest also records the expected filenames to guard against renames.
- **Ledger receipt metadata:** when the backend hash ledger is configured, the manifest gains a `ledgerReceipt` object containing the issued `receiptId`, `hashVersion`, and `registeredAt` timestamp. Because this field lives outside the hashed `session.json`, the client can add it after registering the hash without changing the signature.
- **Upload verification:** when someone uploads an archive, the client unzips it, re-computes the SHA-256 hash of `session.json`, and compares the digest against the manifest. A mismatch blocks loading and surfaces an error that the file may have been modified.
- **Friendly filenames:** the downloaded zip now uses a slug from the document’s first few words plus the session date (e.g., `draft-intro-2025-01-07-i-typed-this.zip`) so reviewers can identify files at a glance.
- **Why zip:** the archive keeps payloads compact (especially for long sessions) and ensures the README stays attached to the session data so reviewers never receive a bare JSON blob without context.
- **Offline caveat:** offline downloads are integrity-only. A malicious user could edit `session.json`, re-hash, and later register that hash. The ledger receipt helps distinguish “registered” vs. “offline,” but true provenance still requires an online, server-signed receipt at export time (or storing the archive server-side).

## Open Questions

- Confirm whether the chosen WYSIWYG editor exposes copy/cut hooks or if we must rely on DOM-level listeners.
- Decide on the hashing algorithm (SHA-256 vs. lightweight rolling hash) once we benchmark payload sizes and frequency.
- Determine retention policy for the clipboard ledger to balance accuracy with memory usage.

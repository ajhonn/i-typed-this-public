# Frontend MVP Implementation Plan

> Source of truth: complements `docs/frontend-mvp-concept.md`. Update both documents as the architecture evolves.

## 1. Architecture Overview
- **Recorder Service**
  - Subscribes to editor events (keystrokes, selections, paste operations).
  - Applies trusted-source heuristics (e.g., user gesture detection, rate limiting) before accepting input.
  - Emits structured events into a session buffer (in-memory initially; pluggable persistence later).
- **Analysis Engine**
  - Consumes recorded events to derive metrics: pause durations, revision patterns, paste anomalies, typing rhythm.
  - Exposes computed summaries to the playback and future reporting surfaces.
- **UI Surfaces**
  - Writing View: centered page layout using Tiptap (ProseMirror) with ribbon chrome.
  - Playback View: synchronized content replay plus timeline panel (colour-coded segments for write/delete/pause/unmatched paste).
  - Shared layout primitives handle responsive behavior and route transitions (React Router).
- **State Boundary**
  - Use context/provider for session state (editor content, event log, analysis results).
  - Feature modules (`features/writer`, `features/playback`) consume shared hooks/services.

## 2. Data & Telemetry Specification (draft)
| Event | Fields | Notes |
| ----- | ------ | ----- |
| `text-input` | timestamp, caret position, inserted text, selection range | Base keystroke capture. |
| `delete` | timestamp, caret position, deleted text length | Tracks revision behavior. |
| `copy` / `cut` | timestamp, selection range, text length, content hash | Feeds clipboard ledger for internal rearrangement detection. |
| `paste` | timestamp, caret position, text length, content hash, trusted flag | Trusted flag set via heuristics; hashes match against ledger/document to classify as internal or unmatched. |
| `selection-change` | timestamp, range | Optional for advanced analysis (e.g., edits vs rewrites). |
| `pause` | start timestamp, duration | Derived events when idle time exceeds threshold. |

> Final schema will move to `docs/frontend-recorder-schema.md` once validated; see **Next Steps**.

## 3. UI Behavior Outline
- Writing View
  - Toolbar mirrors default WYSIWYG commands (bold, italic, underline, headings, lists).
  - Page container restricts max line length and centers content.
  - Recorder hook attaches when editor mounts; shows subtle indicator if recording is active.
  - Nice-to-have: paginate the canvas to A4-sized slices with faint break indicators once writing exceeds one “page.”
  - Nice-to-have: expose an “advanced controls” toggle that expands the ribbon with blockquote/code/image tools when needed.
- Playback View
  - Editor renders read-only content, advancing according to event log.
  - Timeline pane (right-hand side) displays stacked segments with colour legend.
  - Controls: play/pause, speed selector (1x/2x), scrubber with tooltips for event timestamps.
  - Flag unmatched paste events with icon + tooltip referencing analysis metadata (including hash match results).

## 4. Implementation Milestones
0. Gather official Tiptap documentation, confirm event hooks, and design ribbon/tooling requirements.
1. Integrate Tiptap editor with page layout shell and ribbon chrome.
2. Build recorder service, capture keystrokes/paste, expose event stream.
3. Prototype analysis engine calculating pauses and paste anomalies.
4. Persist session state in memory (extendable to storage).
5. Create playback view with timeline visualization and controls.
6. Wire analysis results to UI (timeline coloring, paste warnings).
7. Document recorder schema and analysis rationale in dedicated specs (kept in sync with implementation).
8. Add automated tests and storybook-style fixtures to exercise recorder, analysis, and playback flows.

## 5. Risks & Dependencies
- Accurate trusted-source detection depends on editor API support; verify capabilities early (consult official editor docs).
- Clipboard matching requires reliable capture of copy/cut events; fall back to DOM listeners if the editor does not emit those events.
- Playback synchronization may require virtualized rendering to keep performance smooth with long sessions.
- Future persistence (localStorage/backend) must preserve event fidelity; design event schema with migration in mind.

## 6. Next Documentation Tasks
- Draft UI wireframes or references in `docs/frontend-ui-notes.md` for layout, timeline, and accessibility considerations.

## 6.1 Future Analysis Enhancements (Backlog)
Capture these ideas now so later milestones can prioritize deeper authorship signals:
- **Word/paragraph-level diffing**: treat revisions as semantic units rather than single deletions; compute “tokens touched”, paragraph churn, and structural edits to discourage cosmetic changes.
- **Revision taxonomy**: classify edits (punctuation tweaks vs. word swaps vs. sentence rewrites) and track mix ratios—authentic drafting tends to touch multiple categories.
- **Pause–revision coupling**: highlight macro pauses that immediately precede multi-word edits; surface a “pause → edit” frequency metric.
- **Vocabulary churn & LM cues**: measure unique word substitutions, synonym introduction, or verb/qualifier changes to infer ideation vs. rote typing; optionally pair with lightweight language-model heuristics.
- **Paragraph lifecycle metrics**: detect when paragraphs are added, split, or removed wholesale, plus time spent editing each.
- **Rolling diff snapshots**: compute edit-distance windows to quantify insert/delete/substitute balance; low deletion share across long sessions signals transcription.
- **Paste provenance follow-up**: once unmatched pastes land, track whether subsequent deletions sculpt the pasted text—lack of edits after a paste is a strong risk signal.

## 6.2 Playback Persistence Enhancements (Planned)
- **Session importer service**: extend `SessionProvider` with a dedicated `importSession` method that validates and replaces the editor HTML + event log, so UI surfaces can safely load external JSON blobs.
- **Uploader in playback controls**: add a file input (mirroring the existing download action) inside `PlaybackToolbar` so reviewers can pick a `.json` session and send it through the importer for instant replay.
- **Cache-backed autosave**: write the active session state to the Cache API (gated to modern browsers) on each mutation and restore it on provider mount to guard against accidental tab refreshes.
- **Testing coverage**: add provider tests for autosave/import flows and toolbar tests that assert the upload button exists and calls the importer hook when a mock file is supplied.
- **Docs sync**: once the feature lands, update `docs/frontend-recorder-schema.md` with any validation rules introduced during import and reference the autosave behavior inside `docs/frontend-analysis-methodology.md`’s workflow notes.

## 7. Testing Strategy (Overview)
- **Unit tests**:
  - Recorder services (event normalization, clipboard ledger hashing).
  - Analysis utilities (pause detection, paste classification, burst metrics).
  - Playback state reducers (seeking, snapshots).
- **Component tests (Vitest + Testing Library)**:
  - Writing view ribbon behaviour (tab switching, record indicator).
  - Playback timeline interactions (scrubber, highlighting).
  - Charts render with expected data given sample sessions.
- **Integration tests**:
  - Recorded session can be saved → reloaded → replayed without data loss.
  - Demo sessions load correctly and expose analysis summary.
- **Manual verification**:
  - Accessibility review (keyboard navigation, ARIA for charts).
  - Cross-browser smoke test (Chromium, Firefox, Safari where possible).

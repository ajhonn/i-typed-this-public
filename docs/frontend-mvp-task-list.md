# Frontend MVP Task List

> Working checklist for implementing the client MVP. Update status as items complete. Aligns with `docs/frontend-mvp-plan.md` and related specs.

## Preparation
- [ ] Obtain official Tiptap documentation for installation, configuration, transactions, clipboard hooks, and read-only mode.
- [ ] Define session JSON schema shared by recorder, playback, and future backend (`packages/session-schema`).

## Foundation & Layout
- [x] Set up routing (`/write`, `/playback`, `/learn`) and shared session context/store.
- [x] Implement ribbon shell with tabs: Home, Session, Insights, Learn.
- [x] Apply page-style centered layout and focus mode toggle.
- [ ] Build dismissible hero modal and Learn page (use content from `docs/frontend-product-story.md`).

## Recorder & Writing View
- [ ] Integrate Tiptap editor with ribbon formatting commands.
- [ ] Implement recorder service capturing text-input, delete, selection changes, undo/redo, copy/cut/paste with clipboard ledger + hashing.
- [ ] Emit event log + periodic snapshots; expose hooks for components.
- [ ] Add session controls (download, load, clear) tied to schema.

## Analysis Engine
- [ ] Implement pause detection (200 ms / 2 s thresholds) and burst grouping.
- [ ] Compute revision metrics (insert/delete counts, product-process ratio).
- [ ] Match paste events against clipboard ledger and in-document hashes.
- [ ] Aggregate session summary metrics (pause score, burst variance, paste anomaly count).

## Playback Experience
- [ ] Create read-only Tiptap view driven by event log + snapshots.
- [ ] Build timeline drawer with segmented bar, play/pause, speed control, scrubber markers.
- [ ] Render summary cards (duration, words, unmatched pastes) and pause histogram chart.
- [ ] Highlight text during playback to match timeline segments.

## Persistence & Demos
- [ ] Implement JSON download/upload for sessions; validate schema on load.
- [ ] Provide built-in demo sessions (authentic vs. paste) for quick tour.

## Testing & QA
- [ ] Add unit tests for recorder normalization, analysis functions, playback reducers.
- [ ] Write component tests for ribbon interactions, timeline controls, chart rendering (Vitest + Testing Library).
- [ ] Verify integration flow: record → save → reload → playback.
- [ ] Run accessibility checks (keyboard navigation, ARIA labels) and cross-browser smoke tests.

## Documentation & Handover
- [ ] Keep `docs/` in sync: update recorder schema, analysis methodology, UI structure as implementation evolves.
- [ ] Prepare onboarding guide for agents (where code lives, testing commands, how to run demos).
- [ ] Draft release notes summarizing MVP capabilities and limitations.

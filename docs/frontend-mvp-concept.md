# Client MVP Concept & Methodology

## Experience Goals
- Deliver a familiar, full-screen writing surface reminiscent of Word or Google Docs.
- Use a WYSIWYG editor so authors see exactly what they are producing (e.g., Toast UI); support essentials like bold, italics, headings, bullets, numbered lists, undo, and redo.
- Present the editor on a centered "page" layout that feels like a classic processor, without chasing feature parity on day one.

## Core Logic
- **Recorder**: capture every keystroke event required for downstream analysis, including the timing and context needed to reconstruct intent. Provide a first line of defence against scripted input ("trusted source" guard rails) to reduce bot-style sequences.
- **Analysis Engine**: process the recorded stream to surface metrics that differentiate genuine authorship from copy-paste or transcription (particularly AI-generated text). Highlight signals such as pauses, revisions, rapid paste sequences, and other anomalies.
- Hash clipboard snippets and paste payloads so internal moves are recognized quickly while unmatched, external pastes stand out for reviewers.

## User Interface Surfaces
- **Writing View**: the classic WYSIWYG editor where recording happens. Users compose in the page-style layout while the recorder collects structured telemetry.
- **Playback View**: replays a session in a reader-friendly way. The editor content advances in sync with a side pane featuring a timeline that is colour-coded for writing, deletions, pauses, and unmatched pastes. Playback should support scrubbing and adjustable speed so reviewers can inspect specific moments quickly.

## Why It Matters
- A clear separation between recording, analysis, and presentation keeps the MVP modular: the recorder feeds the analysis engine, and both power the playback experience.
- Documenting the data captured (columns, event schema, trusted-source checks) ensures we can justify the methodology to reviewers and auditors.
- Highlighting unmatched pastes and other anomalies in both the data layer and the UI gives educators and investigators confidence that the tool reveals when text originates from outside the author’s keystrokes.

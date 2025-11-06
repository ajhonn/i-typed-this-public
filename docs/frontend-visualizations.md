# Frontend Visualization Ideas

> Categorized by priority so the UI stays focused. Priorities: **MVP** (must ship with first release), **V1+** (clear upgrades once fundamentals land), **Delight** (optional/hidden easter eggs).

## Timeline & Session Flow
- **Segmented Timeline Bar** *(MVP)*
  Colour-coded horizontal bar showing consecutive segments (`typing`, `revision`, `pause`, `unmatched paste`). Hover tooltips reveal timestamps, duration, and metrics like burst length.
  *Why*: Immediate at-a-glance proof of process; anchors playback scrubber.

- **Event Scrubber Markers** *(MVP)*
  Icons layered on the timeline for paste events, undo/redo, or unusually long pauses.
  *Why*: Lets reviewers jump directly to anomalies.

- **Burst Overlay** *(V1+)*
  Secondary line chart above the timeline plotting characters-per-minute over time. Highlight peaks that exceed thresholds.
  *Why*: Shows rhythm vs. sudden spikes without crowding the main timeline.

## Distribution Charts
- **Pause Histogram** *(MVP)*
  Binned chart of pause durations (e.g., <200 ms, 200–1000 ms, 1–2 s, >2 s).
  *Why*: Reinforces research findings; easy for teachers to interpret.

- **Revision Frequency Bar Chart** *(V1+)*
  Bars for insertions, deletions, undo/redo counts.
  *Why*: Highlights dynamic writing vs. linear transcription.

- **Paste Classification Donut** *(V1+)*
  Shows proportions of `internal`, `duplicate`, `unmatched`.
  *Why*: Quick visual for clipboard behaviour; complements timeline markers.

## Comparative & Profile Views
- **Persona Radar / Spider Plot** *(V1+ → Delight)*
  Axes for pause depth, revision intensity, burst variance, paste anomalies. Generates playful labels (“Planner”, “Speedster”).
  *Why*: Makes data memorable; useful for coaching while keeping serious analysis separate.

- **Session vs. Benchmark Bars** *(V1+)*
  Compare user metrics (avg WPM, longest pause, revision count) against cohort averages.
  *Why*: Contextualises whether behaviour is typical without shaming.

- **Flow Barcode** *(Delight)*
  Print-style vertical stripes representing event types over time (similar to DNA/Spotify “wrapped” visual).
  *Why*: Eye-catching summary suitable for shareable reports.

## Micro-interactions & Overlays
- **Text Highlighting During Replay** *(MVP)*
  Current segment text highlighted in sync with timeline colour.
  *Why*: Keeps playback intuitive; ties analytics to content.

- **Paste Badge Tooltips** *(MVP)*
  Hover badge displays paste length, hash match status, time since last keypress.
  *Why*: Delivers evidence without leaving the playback pane.

- **Session Summary Cards** *(V1+)*
  Minimal cards (Total words, Authenticity indicators, Suspicious events).
  *Why*: Summarises metrics before diving into charts.

## Fun / Optional Extras
- **Typing Heatmap** *(Delight)*
  Heatmap over virtual keyboard showing key usage frequency.
  *Why*: Engaging insight for writers; low relevance for teachers, hide behind toggle.

- **Time-lapse Sparkline** *(Delight)*
  Small animated sparkline of characters-per-second playing alongside replay.
  *Why*: Adds flair without stealing focus.

- **Achievement Badges** *(Delight)*
  Lighthearted badges (“Steady Scribe: consistent pacing”, “Revision Ninja”).
  *Why*: Encourages students to celebrate authentic writing; keep opt-in.

## Implementation Notes
- Start with simple, accessible SVG/Canvas charts; ensure colour choices meet contrast requirements.
- Provide textual summaries for every critical visualization to remain screen-reader friendly.
- Allow “basic” and “advanced” modes to prevent overload—teachers can enable extra charts when needed.
- Reuse the analysis data pipeline; each visualization should tap into prepared metrics rather than reprocessing raw events client-side.

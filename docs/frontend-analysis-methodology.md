# Frontend Analysis Methodology

> Complements `docs/frontend-mvp-concept.md` and `docs/frontend-mvp-plan.md`. Captures the metrics, rationale, and phased roadmap for distinguishing authentic writing from transcription or external paste activity.

## 1. Purpose
- Detect signals of authentic authorship vs. transcription (e.g., AI-generated text pasted in) by analysing keystroke telemetry.
- Surface reviewer-facing insights (timeline colours, paste flags, pause segments) that explain why a session is suspicious.
- Stay transparent: every metric should be documented with its intent, data source, and known limitations.

## 2. Research Insights (Crossley et al., 2024)
Key differences between authentic and transcribed writing uncovered in “Plagiarism Detection Using Keystroke Logs”:

| Signal | Authentic Writing | Transcribed Writing | Implication for MVP |
| ------ | ----------------- | ------------------- | ------------------- |
| Pauses before sentences/words | Longer and more frequent | Shorter; more pauses within words | Track pause duration/location; highlight long pre-sentence pauses as authentic signal. |
| Insertions & revisions | More insertions, longer insertions, more deletions | Minimal revisions | Count insert/delete events; low revision rates + linear bursts flag suspicion. |
| Burst patterns | Shorter bursts, varied pacing | Longer, uniform bursts | Derive burst metrics (keystrokes between ≥2 s pauses). |
| Process variance | Higher variability in production rate | Low variance (linear) | Compute rolling production rate SD. |
| Product-process ratio | Lower (more content rewritten than final output) | Higher (copying verbatim) | Compare produced vs. final word counts; large ratios indicate transcription. |

Additional references: Conijn et al. (2019) on pause thresholds; Trezise et al. (2019) on burst behaviours.

## 3. Data Requirements
Instrumentation must supply:
- Event timestamps (ms precision) and categorisation (`text-input`, `delete`, `copy`, `cut`, `paste`, `undo`, etc.).
- Selection ranges + caret position per event.
- Derived pause events (intervals between operations).
- Clipboard ledger with content hashes (see `docs/frontend-recorder-schema.md`).
- Rolling document snapshots or replayable event log for final comparison.

## 4. MVP Analysis Pipeline
Focus on deterministic rules that align with research findings and can run client-side.

1. **Session segmentation**
   - Compute inter-event deltas; mark pauses where Δt ≥ 200 ms (micro) and ≥ 2000 ms (macro).
   - Group text-input events between macro pauses into bursts.
2. **Revision counters**
   - Track counts/lengths of insertions, deletions, undo/redo operations.
   - Calculate product-process ratio: `finalWordCount / totalWordCountProduced`.
3. **Paste classification**
   - Use hash ledger to label `paste` events as `internal`, `duplicate`, or `unmatched`.
   - Record payload length and time since previous meaningful event.
4. **Timeline synthesis**
   - Generate segments: `typing`, `revision`, `pause`, `unmatched-paste`.
   - Annotate each segment with metrics (burst length, pause duration, paste classification).
5. **Session summary**
   - Present headline indicators: `pauseScore`, `revisionScore`, `burstVariance`, `pasteAnomalyCount`.
   - Provide heuristics-driven verdict (e.g., high risk if paste anomalies + low revisions + uniform bursts).

All rules should be tunable via configuration so thresholds can evolve without code changes.

## 5. Long-Term (V2+) Enhancements
- **Machine Learning**: replicate Crossley et al.’s feature set (65 features) and train random forest / neural models using aggregated telemetry. Requires backend processing and labelled datasets.
- **Adaptive thresholds**: personalise pause/burst baselines per writer (learn from historical sessions).
- **Stylometric fusion**: combine keystroke metrics with linguistic signals (lexical diversity, syntactic variety) for multi-modal detection.
- **Confidence scoring**: output probability with calibration, emphasising false-positive mitigation.
- **Anomaly explanations**: attach narrative (e.g., “Large paste without matching copy; occurred after 3 min pause”).

## 6. Reviewer & UI Integration
- Timeline colours map directly to segment types; unmatched pastes include tooltip with ledger status.
- Provide quick stats panel (total words, authentic vs. suspicious segments, longest pause).
- Allow reviewers to scrub to any anomaly; show snapshot of surrounding text.

## 7. Open Questions
- Threshold calibration: do we adopt the 200 ms / 2 s split or adjust based on collected telemetry?
- Privacy & storage: where do hashes and detailed keystroke logs live (local only vs. server)?
- Feedback loop: should students receive real-time warnings (risk of gaming) or only educator-facing summaries?
- Data export: what format (JSON schema) will support future ML training while preserving anonymity?

## 8. Implementation Status (MVP shell)
- Segmentation, burst stats, revision counters, and heuristic verdicts now run client-side via `useSessionAnalysis`.
- Paste events rely on DOM `insertFromPaste` hooks; unmatched classification currently uses payload size + idle-time heuristics until the clipboard ledger ships.
- Paste events now capture clipboard payload previews client-side so reviewers can skim a ledger of inserts; a future iteration will hash-match against the copy buffer for stricter classification.
- Playback renders a dedicated “Authorship signals” panel showing pause score, revision rate, burst variance, paste anomalies, and narrative reasoning so reviewers understand the verdict.

## 8. References
- Crossley, S., Holmes, L., Tian, Y., Morris, W., & Choi, J. S. (2024). *Plagiarism Detection Using Keystroke Logs.*
- Conijn, R., Roeser, J., & van Zaanen, M. (2019). *Understanding the keystroke log: the effect of writing task on keystroke features.*
- Trezise, K., Ryan, T., de Barba, P., & Kennedy, G. (2019). *Detecting academic misconduct using learning analytics.*

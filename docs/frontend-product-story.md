# Product Story & Value Narrative

## Why i-typed-this Exists
- Students are increasingly accused of using AI with little or no evidence; product-based AI detectors misfire up to 78% of the time (The Guardian, 2024).
- Educators need trustworthy proof of how an essay was produced, not just guesses based on “AI-like” phrasing.
- i-typed-this embraces the writing process, capturing keystrokes, pauses, and revisions so authors can demonstrate genuine effort.

## Differentiation

| Other AI Detectors | i-typed-this |
| ------------------ | ------------ |
| Hunt for vague linguistic patterns that mimic normal writing. | Observes the actual writing session: keystrokes, pauses, deletions, and paste events. |
| Flag students without hard evidence, creating false accusations. | Provides replayable timelines and metrics that show *how* the text was written. |
| Paywalled, account-based tools with limited trials. | Runs locally in the browser, private, free to use, no logins or extensions. |

**Result**: Instead of guesswork, teachers and students receive clear, session-backed proof that “I typed this.”

## Core Experience (MVP)

1. **Record** — The WYSIWYG editor tracks a session the moment typing begins. Pauses, deletions, and paste events feed the recorder.
2. **Replay** — Reviewers scrub through the playback timeline, seeing text unfold alongside colour-coded segments (writing, revisions, pauses, unmatched pastes).
3. **Analyse** — Simple charts reveal peak speeds, rhythm, and flow, making it obvious when content appeared unnaturally fast or without revisions.

### Usage Paths
- **Students**: Compose in focus mode, download the session file, and submit it with their essay as proof of authentic work.
- **Teachers**: Load session files or demos, replay the writing process, and inspect analysis summaries before making integrity calls.

## Future “Fun” & Engagement Ideas
- **Writing Persona Insights**: Offer a playful summary (“You write like a Planner—long pauses and careful revisions”) without compromising serious analysis.
- **Benchmarks & Leaderboards**: Compare WPM, burstiness, pause patterns against anonymized averages so writers understand their style.
- **Progress Tracking**: Let students view improvement over multiple sessions (e.g., “Fewer unmatched pastes, more consistent revisions”).
- **Gamified Challenges**: Optional prompts or goals (“Write 300 words with varied pauses”) to practice authentic drafting habits.

## Roadmap Beyond MVP
- **Institution Features**: Batch session uploads, teacher dashboards, submission portals.
- **Comprehension Support**: Generate reading questions from essays; highlight sections needing elaboration.
- **Extended Analytics**: Deep-dive statistics (pause distributions, revision heatmaps) for academic research or coaching.
- **ML-backed trust scores**: Combine process metrics with calibrated models (see `docs/frontend-analysis-methodology.md`) to prioritize reviews.
- **Platform Integrations**: Offer embeddable recorder SDKs and API endpoints so partner apps can collect telemetry and feed it into i-typed-this playback (see `docs/backend-considerations.md`).

## Trust & Privacy
- All recording happens client-side; no session data leaves the browser unless the writer downloads it.
- No cookies, no trackers, and no required accounts—aligns with the “evidence, not surveillance” philosophy.

## Call to Action
- **Educators & Institutions**: Pilot i-typed-this to replace unreliable AI detectors with verifiable session evidence.
- **Students**: Use the recorder to protect your work from AI accusations and build a personal writing profile.
- **Supporters & Partners**: Contribute feedback, explore integrations, or fund features so the tool can stay free and focused while expanding into new platforms.

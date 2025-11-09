# Paste Ledger Review (ELI5)

Think of the paste ledger like a teacher’s sticky-note stack that lists every time a student pasted text without showing their notebook. Each note now has:

- **Full text** of what was pasted, so you can read it without hunting in playback.
- **Timestamp + idle info** to remind you how long they waited before pasting.
- **“Review in playback” button** that jumps the video to that exact moment (with a tiny 0.2 s head start so the highlight is visible).

Because we no longer filter by size, every external paste appears here, sorted from largest payload to smallest. If the list feels long, use the scrollable container to skim, then click through the events that look most suspicious (long payloads or pastes after big idle gaps). This flow keeps ledger scanning, playback confirmation, and clipboard auditing in sync.

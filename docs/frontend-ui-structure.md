# Frontend UI Structure & Rationale

> Complements `docs/frontend-mvp-plan.md` and `docs/frontend-visualizations.md`. Defines the major UI regions, their purpose, and how they evolve from MVP to richer modes.

## High-level Layout (Word/Docs Alignment)

| Section | Location | MVP Contents | Rationale |
| ------- | -------- | ------------ | --------- |
| Ribbon Bar | Full-width top (sticky) | Logo/title, document name, session status, tabbed controls (Write, Playback, Docs) | Mimics familiar Word/Google Docs ribbon; keeps primary actions discoverable. |
| Command Groups | Ribbon tabs | “Home” tab for formatting shortcuts; “Session” tab for record/load/download; “Insight” tab for playback & analytics toggle | Mirrors office-suite grouping to reduce learning curve. |
| Main Canvas | Centered page surface | Writing editor or playback content depending on active mode | Delivers distraction-free typing surface once ribbon is dismissed/minimized. |
| Timeline Pane | Right-side drawer (Playback) | Playback controls, timeline bar, summary cards, charts | Keeps analytics adjacent yet separable; collapsible for smaller screens. |
| Hero / CTA Overlay | Modal or welcome pane | Intro copy, demo load buttons, “Learn more” link | Presents the product story upfront; can be dismissed to reveal classic editor experience. |

## Writing View (MVP)
- **Ribbon (Home tab)**
  - Core WYSIWYG controls grouped like Word/Docs (Clipboard, Font, Paragraph).
  - Include `Record status`, `Download`, `Load`, `Clear` within a “Session” group on the same ribbon.
  *Why*: Users expect key commands in a ribbon at the top; reduces need for a footer.
- **Page Surface**
  - Centered, limited-width editor with subtle page background.
  - Displays cursor position indicator and word count (optional).
  *Why*: Comfort for writers; helps maintain consistent line length.
- **Recording Indicator**
  - Small badge showing “Recording” with timestamp or event counter.
  *Why*: Reinforces trust that the session is being tracked.
- **Call-to-Action Modal**
  - Optional welcome layer with “Record typing” instructions, demo links, and CTA to learn more.
  - Dismissed via close button; re-opened from ribbon (`Help` or `About` tab).
  *Why*: Introduces the product without altering the familiar writing surface once closed.

### Writing View Future Enhancements
- Ribbon collapse button (arrow) to hide the bar and give full-screen writing, mirroring Word/Docs behavior.
- Persona insights tooltip (delight, optional).
- Inline guidance badges when unmatched paste is detected.

## Playback View (MVP)
- **Ribbon (Insights tab)**
  - Contains playback controls (Play/Pause, speed dropdown), export options (future), and toggle to show/hide timeline drawer.
  *Why*: Keeps interaction consistent—controls live in the ribbon per office-suite norms.
- **Read-only Editor (center)**
  - Displays reconstructed text; highlights active segment.
  - Optional diff view toggle (future).
  *Why*: Shows reviewers the essay as it unfolded without allowing edits.
- **Timeline & Controls (right sidebar)**
  - Playback controls (play/pause, speed select, scrubber).
  - Timeline segmentation bar with hover details.
  - Event markers (pastes, long pauses).
  *Why*: Primary evidence surface; matches analysis methodology.
- **Summary Cards (above timeline)**
  - Key metrics: total duration, words typed, unmatched pastes count.
  *Why*: Quick snapshot before diving into timeline.
- **Charts Section (below timeline)**
  - MVP: Pause histogram.
  - Future: Revision bar chart, persona radar (toggle).
  *Why*: Structured location for visual analytics without overwhelming.

### Playback View Future Enhancements
- Ribbon tabs for advanced analytics (e.g., “Charts”, “Reports”) similar to Word’s context-sensitive tabs.
- Export buttons (PDF report, JSON summary).
- Commenting or annotation pane for teacher notes (long-term).

## Responsive & Accessibility Considerations
- Collapse sidebar below 1024px; timeline becomes horizontal strip beneath editor.
- Provide keyboard shortcuts for play/pause, jump to next event, focus editor.
- Ensure all charts have text descriptions and colour-blind-friendly palettes.
- Support high-contrast mode and large font scaling for accessibility.

## Navigation & Modes
- **Ribbon Tabs or App Navigation within Ribbon**
  - `Write`, `Playback`, `Learn` (FAQ/Docs) as top-level tabs; switching updates main canvas while preserving session state.
- **Hero / Learn More Page**
  - Accessible via `Learn` tab; contains expanded FAQ, demos, contact CTA.
- **Modal Dismissal**
  - First-time hero overlay dismissed to reveal standard editor; users can relaunch via `Help → Introduction`.

## Integration with Docs & Future Work
- Update this file when new visualization modules ship (`docs/frontend-visualizations.md`).
- Link persona insights to `docs/frontend-analysis-methodology.md` metrics.
- Document any institution-specific features (batch review dashboards) in a separate layout spec when planned.

import type { ReactNode } from 'react';
import playbackImage from '../../assets/intro/playback_screenshot.png';
import analysisImage from '../../assets/intro/analysis_spider.png';

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  steps: ReactNode[];
  result?: string;
  screenshotSrc?: string;
  screenshotAlt?: string;
  footnote?: ReactNode;
};

const guardianLink =
  'https://www.theguardian.com/technology/2024/dec/15/i-received-a-first-but-it-felt-tainted-and-undeserved-inside-the-university-ai-cheating-crisis';

// Shared onboarding cards rendered in the hero modal and About tab.
export const heroSlides: HeroSlide[] = [
  {
    id: 'intro',
    eyebrow: 'i-typed-this.com',
    title: 'Record your writing',
    intro: 'If you are suspected of using AI to cheat your essay, you need more than a vague detector score.',
    steps: [
      'Other AI detectors look for “patterns” that could be natural, accuse without hard proof, and often charge for unlimited use.',
      <>
        Result: A false accusation up to 78% of the time (
        <a href={guardianLink} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">
          The Guardian, 2024
        </a>
        ).
      </>,
      'i-typed-this records your typing, pauses, and deletions, saves the replay, and keeps everything free, focused, and private.',
      <>
        Result: Clear, research-backed evidence of how you typed it.
      </>,
    ],
    result: 'Record once, keep the zip, and you’re covered.',
    footnote: (
      <>
        “To be accused of using AI felt like a slap in the face of my hard work.” — Student,{' '}
        <a href={guardianLink} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">
          The Guardian
        </a>
      </>
    ),
    screenshotSrc: playbackImage,
    screenshotAlt: 'Playback screen showing live typing replay with controls and analysis sidebar.',
  },
  {
    id: 'playback',
    eyebrow: 'Playback + Analysis',
    title: 'Watch it unfold and read the signals',
    intro:
      'Load the Human Demo or AI (Paste) Demo to compare natural writing against instant copy-paste. The playback stays synced with the charts.',
    steps: [
      'Ask students to share their zipped session. Load it in Playback to see pauses, typos, and revisions.',
      'Use the Writing Analysis graphs for context—Peak Speed (CPM) catches sudden pastes, Rhythm shows natural thinking time, Flow Barcode visualises the process.',
      'Watch the playback to spot pauses, revisions, and flow.',
      'Compare the Human Demo and AI (Paste) Demo to explain the difference in seconds.',
    ],
    screenshotSrc: analysisImage,
    screenshotAlt: 'Analysis dashboard with flow barcode, rhythm chart, and peak speed metrics.',
    result: 'Result: A calm conversation backed by transparent data.',
  },
];

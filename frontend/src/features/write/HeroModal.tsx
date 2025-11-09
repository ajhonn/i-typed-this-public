import { useState, type PropsWithChildren, type ReactNode } from 'react';
import playbackImage from '../../assets/intro/playback_screenshot.png';
import analysisImage from '../../assets/intro/analysis_spider.png';
import logoMark from '../../assets/logo/logo.png';

type HeroModalProps = PropsWithChildren<{
  onDismiss: () => void;
}>;

type HeroSlide = {
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
const researchLink = 'https://educationaldatamining.org/edm2024/proceedings/2024.EDM-short-papers.47/';

// Update onboarding copy or swap screenshots by editing this array and the PNGs in src/assets/.
const slides: HeroSlide[] = [
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
        Result: Clear evidence that i-typed-this, which is based on{' '}
        <a href={researchLink} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">
          research
        </a>
        .
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

const HeroModal = ({ onDismiss }: HeroModalProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const totalSlides = slides.length;

  const moveSlide = (direction: 'next' | 'prev') => {
    setActiveIndex((current) => {
      if (direction === 'next') {
        return (current + 1) % totalSlides;
      }
      return (current - 1 + totalSlides) % totalSlides;
    });
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-6 py-12 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-title"
      data-testid="hero-modal"
    >
      <div className="w-full max-w-3xl space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60">
        <header className="flex flex-col gap-2 text-center">
          <div className="mx-auto flex items-center gap-3">
            <img src={logoMark} alt="i-typed-this logo" className="h-10 w-10 object-contain" />
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">i-typed-this.com</h1>
          </div>
          <p className="text-base text-slate-600">AI detectors can get it wrong 78% of the time. Record your writing as evidence.</p>
        </header>

        <article key={activeSlide.id} className="space-y-5" aria-live="polite">
          <h2 id="hero-title" className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {activeSlide.title}
          </h2>
          <p className="text-base leading-relaxed text-slate-600">{activeSlide.intro}</p>
          {activeSlide.screenshotSrc ? (
            <img
              src={activeSlide.screenshotSrc}
              alt={activeSlide.screenshotAlt}
              className="w-full rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50"
            />
          ) : null}
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {activeSlide.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          {activeSlide.result ? <p className="text-sm font-semibold text-slate-700">{activeSlide.result}</p> : null}
          {activeSlide.footnote ? <p className="text-sm italic text-slate-500">{activeSlide.footnote}</p> : null}
        </article>

        <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show intro slide ${index + 1}`}
                className={`h-2.5 w-8 rounded-full ${index === activeIndex ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
            <span className="pl-2">
              Step {activeIndex + 1} of {totalSlides}
            </span>
          </div>
          <div className="flex items-center justify-end gap-3">
            {activeIndex > 0 ? (
              <button
                type="button"
                onClick={() => moveSlide('prev')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:text-slate-900"
                aria-label="Previous intro slide"
              >
                ←
              </button>
            ) : (
              <div className="h-10 w-10" aria-hidden />
            )}
            {activeIndex === totalSlides - 1 ? (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Start writing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => moveSlide('next')}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                aria-label="Next intro slide"
              >
                Next →
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HeroModal;

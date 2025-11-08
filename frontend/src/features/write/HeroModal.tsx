import { Link } from 'react-router';
import type { PropsWithChildren } from 'react';

type HeroModalProps = PropsWithChildren<{
  onDismiss: () => void;
}>;

const HeroModal = ({ onDismiss }: HeroModalProps) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 px-6 py-12 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-title"
      data-testid="hero-modal"
    >
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl shadow-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-200">MVP Preview</p>
        <h2 id="hero-title" className="text-3xl font-semibold text-brand-50">
          Capture the writing proof teachers can trust
        </h2>
        <p className="text-base leading-relaxed text-slate-300">
          i-typed-this records keystrokes, pauses, and paste events so students can show how their work came together. Sessions
          stay local to the browser—you download the evidence when you’re ready to submit.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-brand-200 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-100"
          >
            Start writing
          </button>
          <Link
            to="/learn"
            className="rounded-full border border-slate-600 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
          >
            Learn why we track the journey
          </Link>
        </div>
        <div className="text-xs text-slate-400">
          <p className="font-semibold text-slate-300">What’s recorded?</p>
          <p>Keystrokes, pauses, deletions, copy/paste hashes—enough detail to replay the writing session.</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 underline-offset-4 hover:text-slate-200"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
};

export default HeroModal;

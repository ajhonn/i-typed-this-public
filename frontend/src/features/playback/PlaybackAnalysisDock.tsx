import { memo, useState } from 'react';
import PlaybackAnalysisSummary from './PlaybackAnalysisSummary';
import { useSessionAnalysis } from '@features/analysis/useSessionAnalysis';

const VERDICT_ACCENT: Record<string, string> = {
  'likely-authentic': 'border-emerald-500 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.45)]',
  'needs-review': 'border-amber-500 text-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.45)]',
  'high-risk': 'border-rose-500 text-rose-700 shadow-[0_0_20px_rgba(248,113,113,0.5)]',
};

const PlaybackAnalysisDockComponent = () => {
  const analysis = useSessionAnalysis();
  const [open, setOpen] = useState(true);
  const toggleLabel = open ? 'Hide analysis' : 'Show analysis';
  const accentClass = VERDICT_ACCENT[analysis.verdict] ?? 'border-slate-300 text-slate-600';

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={open}
          onClick={() => setOpen((prev) => !prev)}
          className={[
            'rounded-full border bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:scale-[1.02]',
            accentClass,
          ].join(' ')}
        >
          {toggleLabel}
        </button>
      </div>
      {open ? (
        <div className="flex justify-end">
          <div className="w-full max-w-[420px]">
            <PlaybackAnalysisSummary />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const PlaybackAnalysisDock = memo(PlaybackAnalysisDockComponent);

export default PlaybackAnalysisDock;

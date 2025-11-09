import { Link } from 'react-router';
import SessionSignalsRadar from '@features/analysis/SessionSignalsRadar';
import { useSessionAnalysis } from '@features/analysis/useSessionAnalysis';
import { ROUTES } from '@routes/paths';

const verdictCopy: Record<string, { label: string; tone: string }> = {
  'likely-authentic': { label: 'Likely authentic', tone: 'text-emerald-600 bg-emerald-50' },
  'needs-review': { label: 'Needs review', tone: 'text-amber-700 bg-amber-50' },
  'high-risk': { label: 'High transcription risk', tone: 'text-rose-700 bg-rose-50' },
};

const PlaybackAnalysisSummary = () => {
  const analysis = useSessionAnalysis();
  const verdict = verdictCopy[analysis.verdict];

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur" data-testid="playback-analysis-summary">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Session signals</p>
        </div>
        <span className={['inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide', verdict?.tone ?? ''].join(' ')}>
          {verdict?.label ?? 'Insufficient data'}
        </span>
      </div>
            <SessionSignalsRadar showCopy={false} showCard={false} height={260} dataTestId="playback-signals-radar" />
      <div className="flex justify-end">
        <Link
          to={ROUTES.analysis}
          className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
        >
          Open analysis tab
        </Link>
      </div>
    </section>
  );
};

export default PlaybackAnalysisSummary;

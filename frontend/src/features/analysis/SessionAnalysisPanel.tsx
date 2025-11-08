import { useSessionAnalysis } from './useSessionAnalysis';
import type { TimelineSegment } from './types';

const verdictCopy: Record<string, { label: string; tone: string }> = {
  'likely-authentic': { label: 'Likely authentic', tone: 'text-emerald-600 bg-emerald-50' },
  'needs-review': { label: 'Needs review', tone: 'text-amber-700 bg-amber-50' },
  'high-risk': { label: 'High transcription risk', tone: 'text-rose-700 bg-rose-50' },
};

const formatDuration = (ms: number) => {
  if (ms >= 60000) {
    return `${(ms / 60000).toFixed(1)}m`;
  }
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms.toFixed(0)}ms`;
};

const TimelineBadge = ({ segment }: { segment: TimelineSegment }) => {
  const palette: Record<TimelineSegment['type'], string> = {
    typing: 'bg-sky-50 text-sky-700 border-sky-200',
    revision: 'bg-amber-50 text-amber-700 border-amber-200',
    pause: segment.severity === 'macro' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200',
    paste: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className={`flex flex-col rounded-xl border px-3 py-2 text-xs ${palette[segment.type]}`}>
      <span className="font-semibold uppercase tracking-wide">{segment.label}</span>
      <span>{formatDuration(segment.durationMs)}</span>
      {segment.metadata?.classification ? (
        <span className="text-[11px] font-medium">{String(segment.metadata.classification)}</span>
      ) : null}
    </div>
  );
};

const SessionAnalysisPanel = () => {
  const analysis = useSessionAnalysis();
  const verdictStyles = verdictCopy[analysis.verdict];
  const recentSegments = analysis.segments.slice(-12);

  return (
    <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="session-analysis">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Session analysis</p>
          <h2 className="text-2xl font-semibold text-slate-900">Authorship signals</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${verdictStyles?.tone ?? ''}`}>
          {verdictStyles?.label ?? 'Insufficient data'}
        </span>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        {analysis.metrics.map((metric) => (
          <div key={metric.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{metric.value}</p>
            {metric.helperText ? <p className="text-xs text-slate-500">{metric.helperText}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Recent timeline</p>
        {recentSegments.length ? (
          <div className="flex flex-wrap gap-2">
            {recentSegments.map((segment) => (
              <TimelineBadge key={segment.id} segment={segment} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Record a session to populate timeline insights.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Why this verdict?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {analysis.verdictReasoning.map((reason, index) => (
            <li key={`${reason}-${index}`}>{reason}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SessionAnalysisPanel;

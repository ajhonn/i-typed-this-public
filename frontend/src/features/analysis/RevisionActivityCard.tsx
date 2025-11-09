import { useMemo } from 'react';
import { useSessionAnalysis } from './useSessionAnalysis';

const formatNumber = (value: number) => value.toLocaleString();

const RevisionActivityCard = () => {
  const analysis = useSessionAnalysis();
  const { revisionSummary } = analysis;

  const timeline = useMemo(() => {
    const relevant = analysis.segments.filter((segment) => segment.type === 'typing' || segment.type === 'revision');
    const recent = relevant.slice(-24);
    const totalDuration = recent.reduce((sum, segment) => sum + segment.durationMs, 0) || 1;
    return recent.map((segment) => ({
      id: segment.id,
      type: segment.type,
      width: Math.max((segment.durationMs / totalDuration) * 100, 1),
    }));
  }, [analysis.segments]);

  const charTotal = revisionSummary.producedChars + revisionSummary.deletedChars;
  const producedPercent = charTotal ? Math.round((revisionSummary.producedChars / charTotal) * 100) : 0;
  const revisedPercent = charTotal ? Math.round((revisionSummary.deletedChars / charTotal) * 100) : 0;

  return (
    <section
      id="analysis-revision-card"
      className="space-y-4 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm"
      data-testid="revision-activity-card"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-500">Revision rate</p>
          <h3 className="text-xl font-semibold text-slate-900">Editing cadence</h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revision score</p>
          <p className="text-3xl font-semibold text-slate-900">{(revisionSummary.revisionRate * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          Healthy drafting loops between typing and pruning. Deletions track how often the student reworks their sentences in-line.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-indigo-50/60 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Thresholds</p>
          <p>Strong: ≥12% deletions per 100 inputs once the session logs 30+ text events.</p>
          <p>Risk: &lt;12% revision activity with sustained typing suggests transcription.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
          <span
            className="bg-slate-900"
            style={{ width: `${Math.min(producedPercent, 100)}%` }}
            aria-label={`Typed characters ${producedPercent}%`}
          />
          <span
            className="bg-amber-400"
            style={{ width: `${Math.min(revisedPercent, 100)}%` }}
            aria-label={`Deleted characters ${revisedPercent}%`}
          />
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Typed {producedPercent}%</span>
          <span>Revised {revisedPercent}%</span>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Recent revision timeline</p>
        {timeline.length ? (
          <div className="mt-2 flex h-4 overflow-hidden rounded-full border border-slate-200">
            {timeline.map((segment) => (
              <span
                key={segment.id}
                className={segment.type === 'revision' ? 'bg-amber-300' : 'bg-slate-800'}
                style={{ width: `${segment.width}%` }}
              >
                <span className="sr-only">
                  {segment.type === 'revision' ? 'Revision edit' : 'Typing burst'} lasting approximately{' '}
                  {Math.round(segment.width)}% of the sampled time window.
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Not enough revision data captured in this session.</p>
        )}
        <div className="mt-2 flex gap-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-800" aria-hidden="true" />
            Typing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden="true" />
            Revision
          </span>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2" data-testid="revision-metrics">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Text inputs</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatNumber(revisionSummary.textInputs)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Deletions</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatNumber(revisionSummary.deletions)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Characters produced</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatNumber(revisionSummary.producedChars)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Characters removed</dt>
          <dd className="text-lg font-semibold text-slate-900">{formatNumber(revisionSummary.deletedChars)}</dd>
        </div>
      </dl>
    </section>
  );
};

export default RevisionActivityCard;

import { Link } from 'react-router';
import { ROUTES } from '@routes/paths';
import { useSessionAnalysis } from './useSessionAnalysis';
import SessionSignalsRadar from './SessionSignalsRadar';

const verdictCopy: Record<string, { label: string; tone: string }> = {
  'likely-authentic': { label: 'Likely authentic', tone: 'text-emerald-600 bg-emerald-50' },
  'needs-review': { label: 'Needs review', tone: 'text-amber-700 bg-amber-50' },
  'high-risk': { label: 'High transcription risk', tone: 'text-rose-700 bg-rose-50' },
};

const metricDescriptions: Record<string, string> = {
  pauseScore: 'Macro pauses (≥2s) before bursts suggest live composition rather than transcription.',
  revisionScore: 'Authentic drafting produces revisions: deletions/undo activity relative to typing.',
  burstVariance: 'Healthy writing has varied burst lengths; uniform bursts imply pasting or reading from a source.',
  pasteRisk: 'Unmatched or long-idle pastes are suspicious, especially after extended pauses.',
  productProcess: 'Compares typed content vs. final text—lower ratios mean iterative drafting.',
};

type SessionAnalysisPanelProps = {
  showRadar?: boolean;
};

const SessionAnalysisPanel = ({ showRadar = true }: SessionAnalysisPanelProps) => {
  const analysis = useSessionAnalysis();
  const verdictStyles = verdictCopy[analysis.verdict];
  const guidance = [
    'High pause + revision scores typically mean the student is thinking and editing in real-time.',
    'If paste cleanliness drops, click into those segments in playback to check what changed.',
    'Low process depth combined with low variance often indicates text was imported rather than authored here.',
  ];

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

      <p className="text-sm text-slate-600">
        Reviewers can scan these bars first: green means the session behaves like live typing, while amber/red marks areas worth replaying (e.g., pastes without accompanying edits).
      </p>

      {showRadar ? (
        <>
          <SessionSignalsRadar />
          <div className="flex justify-end">
            <Link
              to={ROUTES.analysis}
              className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
            >
              Open analysis workspace
            </Link>
          </div>
        </>
      ) : null}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {analysis.metrics.map((metric) => (
          <div key={metric.key} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              <span
                className={`text-[11px] font-semibold uppercase ${
                  metric.trend === 'positive' ? 'text-emerald-600' : metric.trend === 'negative' ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {metric.trend === 'positive' ? 'Strong' : metric.trend === 'negative' ? 'Low' : 'Neutral'}
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
            {metric.helperText ? <p className="text-xs font-medium text-slate-500">{metric.helperText}</p> : null}
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${metric.score >= 0.66 ? 'bg-emerald-500' : metric.score >= 0.33 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(metric.score * 100)}%` }}
                  aria-label={`${metric.label} score ${Math.round(metric.score * 100)} percent`}
                />
              </div>
              {metricDescriptions[metric.key] ? <p className="text-xs text-slate-500">{metricDescriptions[metric.key]}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">How to use these signals</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {guidance.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Why this verdict?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {analysis.verdictReasoning.map((reason, index) => (
            <li key={`${reason}-${index}`}>{reason}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          These indicators assist reviewers but aren&apos;t foolproof—always confirm suspicions by replaying the timeline.
        </p>
      </div>
    </section>
  );
};

export default SessionAnalysisPanel;

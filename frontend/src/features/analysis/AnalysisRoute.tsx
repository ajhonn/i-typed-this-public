import ShellLayout from '@features/shell/ShellLayout';
import SessionAnalysisPanel from './SessionAnalysisPanel';
import PauseHistogram from './PauseHistogram';
import SessionSignalsRadar from './SessionSignalsRadar';

const AnalysisRoute = () => {
  return (
    <ShellLayout
      activeTab="analysis"
      title="Analysis workspace"
      description="Give the authorship signals panel its own canvas so we can layer pause histograms, WPM charts, and future insights."
    >
      <div className="space-y-8" data-testid="analysis-overview">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Roadmap</p>
          <h2 className="text-2xl font-semibold text-slate-900">Full-page analysis lab</h2>
          <p className="mt-3 text-sm text-slate-600">
            This route will mirror the drawer insights and expand with the histogram and WPM visualisations outlined in{' '}
            <span className="font-semibold">docs/frontend-visualizations.md</span>. We&apos;re scaffolding here so the next commits can drop charts
            in without reshuffling routing again.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Surface the existing auth signals panel so reviewers can work outside the drawer.</li>
            <li>Add pause histograms derived from the 200 ms / 2 s buckets noted in the methodology doc.</li>
            <li>Plot bursts + WPM and compare against cohort guardrails.</li>
          </ul>
        </div>
        <SessionSignalsRadar />
        <SessionAnalysisPanel showRadar={false} />
        <PauseHistogram />
      </div>
    </ShellLayout>
  );
};

export default AnalysisRoute;

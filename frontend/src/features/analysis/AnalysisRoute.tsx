import ShellLayout from '@features/shell/ShellLayout';
import SessionAnalysisPanel from './SessionAnalysisPanel';
import PauseHistogram from './PauseHistogram';
import SessionSignalsRadar from './SessionSignalsRadar';
import PasteLedgerCard from './PasteLedgerCard';
import ProcessProductChart from './ProcessProductChart';

const AnalysisRoute = () => {
  return (
    <ShellLayout
      activeTab="analysis"
      title="Analysis workspace"
      description="Bring the authorship signals panel into focus and pair it with pause histograms, rhythm charts, and supporting context."
    >
      <div className="space-y-8" data-testid="analysis-overview">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Analysis workspace</p>
          <h2 className="text-2xl font-semibold text-slate-900">Full-page view of the signals</h2>
          <p className="mt-3 text-sm text-slate-600">
            These cards surface the research-backed signals that the drawer already shows. Use the histogram, process chart, and paste ledger here
            to decide whether a replay deserves another look.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Keep the verdict upfront while the supporting panels stay in view.</li>
            <li>Check pause lengths to separate thinking pauses from straight typing.</li>
            <li>Track bursts, speed, and paste behavior with the process chart and paste ledger.</li>
          </ul>
        </div>
        <SessionSignalsRadar />
        <SessionAnalysisPanel showRadar={false} />
        <ProcessProductChart />
        <PasteLedgerCard />
        <PauseHistogram />
      </div>
    </ShellLayout>
  );
};

export default AnalysisRoute;

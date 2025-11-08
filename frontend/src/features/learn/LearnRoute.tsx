import ShellLayout from '@features/shell/ShellLayout';

const LearnRoute = () => {
  return (
    <ShellLayout
      activeTab="learn"
      title="Learn why i-typed-this exists"
      description="Ground the roadmap in the product story: transparent evidence for genuine writing sessions."
    >
      <section
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        data-testid="learn-route"
      >
        <h2 className="text-lg font-semibold text-slate-900">Why now?</h2>
        <p className="text-sm text-slate-600">
          False-positive AI accusations are rampant (see the 78% Guardian stat in{' '}
          <span className="font-semibold text-slate-900">docs/frontend-product-story.md</span>). The MVP demonstrates keystroke
          evidence so students can say &ldquo;I typed this&rdquo; with proof.
        </p>
        <ul className="grid gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <li>Record — capture the session privately in-browser.</li>
          <li>Replay — share a timeline that shows how text appeared.</li>
          <li>Analyse — highlight pauses, revisions, and unmatched pastes.</li>
        </ul>
      </section>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Differentiation</h3>
        <p className="text-sm text-slate-600">
          Unlike probabilistic AI detectors, i-typed-this focuses on the writing process. The client runs locally, exposes no
          accounts, and emphasizes evidence over suspicion.
        </p>
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Beyond MVP</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-600">
            <li>Recorder SDK + API integrations (see docs/frontend-product-story.md)</li>
            <li>Persona insights + progression dashboards</li>
            <li>Batch review tooling for institutions</li>
          </ul>
        </div>
      </section>
    </ShellLayout>
  );
};

export default LearnRoute;

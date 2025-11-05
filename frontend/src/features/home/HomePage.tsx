import Page from '@components/Page';

const HomePage = () => {
  return (
    <Page
      title="Observe the writing journey"
      description="Replay keystrokes, verify integrity, and surface authorship signals from live writing sessions."
    >
      <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-900/40">
        <h2 className="text-lg font-semibold text-brand-100">Next steps</h2>
        <ul className="grid gap-2 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" aria-hidden />
            <span>Instrument typing capture in the editor shell.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" aria-hidden />
            <span>Persist sessions locally and sync metadata with the verification API.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" aria-hidden />
            <span>Build comparative review views for instructors and auditors.</span>
          </li>
        </ul>
      </section>
    </Page>
  );
};

export default HomePage;

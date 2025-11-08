import { useEffect, useState } from 'react';
import ShellLayout from '@features/shell/ShellLayout';
import HeroModal from './HeroModal';

const HERO_STORAGE_KEY = 'write-hero-dismissed';

const WriteRoute = () => {
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(HERO_STORAGE_KEY) !== 'true';
  });

  useEffect(() => {
    if (!showHero && typeof window !== 'undefined') {
      window.localStorage.setItem(HERO_STORAGE_KEY, 'true');
    }
  }, [showHero]);

  return (
    <ShellLayout
      activeTab="write"
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
      <section className="grid gap-4 rounded-xl border border-slate-900 bg-slate-950/40 p-6">
        <h2 className="text-lg font-semibold text-brand-50">Recorder shell preview</h2>
        <p className="text-sm text-slate-300">
          This view will host the Tiptap editor, recorder indicator, clipboard ledger, and session controls outlined in{' '}
          <span className="font-semibold text-brand-100">docs/frontend-ui-structure.md</span>. The familiar ribbon above will
          eventually surface formatting buttons, download/load actions, and paste anomaly callouts.
        </p>
        <div className="grid gap-3 rounded-lg border border-dashed border-slate-800 p-4 text-left text-sm text-slate-400">
          <p className="font-semibold text-slate-200">Coming soon</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tiptap integration with recorder hooks</li>
            <li>Session controls (download, load, clear)</li>
            <li>Trusted-source guard rails and clipboard ledger</li>
          </ul>
        </div>
      </section>
      {showHero ? <HeroModal onDismiss={() => setShowHero(false)} /> : null}
    </ShellLayout>
  );
};

export default WriteRoute;

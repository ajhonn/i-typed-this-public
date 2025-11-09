import { useMemo, useState } from 'react';
import ShellLayout from '@features/shell/ShellLayout';
import PlaybackPlayer from './PlaybackPlayer';
import { PlaybackProvider } from './PlaybackControllerContext';
import PlaybackInsightsDrawer from './PlaybackInsightsDrawer';
import { useSessionAnalysis } from '@features/analysis/useSessionAnalysis';

const BUTTON_ACCENT: Record<string, string> = {
  'likely-authentic': 'border-emerald-500 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.45)]',
  'needs-review': 'border-amber-500 text-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.45)]',
  'high-risk': 'border-rose-500 text-rose-700 shadow-[0_0_20px_rgba(248,113,113,0.5)]',
};

const PlaybackRoute = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const analysis = useSessionAnalysis();
  const toggleLabel = drawerOpen ? 'Hide analysis' : 'Show analysis';
  const accentClass = BUTTON_ACCENT[analysis.verdict] ?? 'border-slate-300 text-slate-600';

  const ribbonButton = useMemo(
    () => (
      <button
        type="button"
        aria-pressed={drawerOpen}
        onClick={() => setDrawerOpen((prev) => !prev)}
        className={[
          'rounded-full border bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:scale-[1.02]',
          accentClass,
        ].join(' ')}
      >
        {toggleLabel}
      </button>
    ),
    [drawerOpen, toggleLabel, accentClass]
  );

  return (
    <PlaybackProvider>
      <ShellLayout
        activeTab="playback"
        title="Inspect authentic sessions"
        description="Reconstruct text, timeline segments, and anomaly callouts to evaluate how work unfolded."
        showHeader={false}
        ribbonAction={ribbonButton}
      >
        <div className="flex flex-col gap-8 pb-96">
          <PlaybackPlayer />
          <PlaybackInsightsDrawer open={drawerOpen} />
        </div>
      </ShellLayout>
    </PlaybackProvider>
  );
};

export default PlaybackRoute;

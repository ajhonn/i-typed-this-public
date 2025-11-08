import ShellLayout from '@features/shell/ShellLayout';
import SessionInspector from './SessionInspector';
import PlaybackPlayer from './PlaybackPlayer';

const PlaybackRoute = () => {
  return (
    <ShellLayout
      activeTab="playback"
      title="Inspect authentic sessions"
      description="Reconstruct text, timeline segments, and anomaly callouts to evaluate how work unfolded."
    >
      <PlaybackPlayer />
      <SessionInspector />
      <section
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        data-testid="playback-route"
      >
        <h2 className="text-lg font-semibold text-slate-900">Timeline + metrics</h2>
        <p className="text-sm text-slate-600">
          Playback renders the read-only Tiptap view alongside the segmented timeline, summary metrics, and pause histogram
          described in <span className="font-semibold text-slate-900">docs/frontend-ui-structure.md</span> and{' '}
          <span className="font-semibold text-slate-900">docs/frontend-mvp-plan.md</span>.
        </p>
        <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">MVP goals</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Segment bar keyed to write/delete/pause/paste events</li>
            <li>Play/pause + scrubber controls tied to event log</li>
            <li>Summary cards (duration, words, unmatched pastes)</li>
            <li>Pause histogram and paste anomaly markers</li>
          </ul>
        </div>
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Next engineering steps</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Derive pause + burst metrics from recorder output.</li>
          <li>Rebuild document snapshots on-the-fly for scrubbing.</li>
          <li>Paint timeline + editor highlights in sync.</li>
          <li>Surface unmatched paste markers with ledger context.</li>
        </ol>
      </section>
    </ShellLayout>
  );
};

export default PlaybackRoute;

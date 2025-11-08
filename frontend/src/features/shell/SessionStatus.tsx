type SessionState = 'idle' | 'recording' | 'reviewing';

type SessionStatusProps = {
  state: SessionState;
};

const LABELS: Record<SessionState, string> = {
  idle: 'Recorder idle',
  recording: 'Recording',
  reviewing: 'Playback mode',
};

const DOT_STYLES: Record<SessionState, string> = {
  idle: 'bg-slate-400',
  recording: 'bg-rose-400 animate-pulse',
  reviewing: 'bg-sky-400',
};

const SessionStatus = ({ state }: SessionStatusProps) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
      <span className={`h-2 w-2 rounded-full ${DOT_STYLES[state]}`} aria-hidden />
      {LABELS[state]}
    </div>
  );
};

export default SessionStatus;

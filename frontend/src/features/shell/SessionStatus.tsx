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
  recording: 'bg-rose-500',
  reviewing: 'bg-sky-500',
};

const DOT_PULSE_CLASS: Partial<Record<SessionState, string>> = {
  recording: 'session-status-dot--pulse-red',
  reviewing: 'session-status-dot--pulse-blue',
};

const SessionStatus = ({ state }: SessionStatusProps) => {
  const classes = [
    'session-status relative inline-flex items-center gap-2 rounded-full border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600',
    state === 'recording' ? 'session-status--recording' : '',
    state === 'reviewing' ? 'session-status--reviewing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const glowClass =
    state === 'recording'
      ? 'session-status-aura session-status-aura--recording'
      : state === 'reviewing'
        ? 'session-status-aura session-status-aura--reviewing'
        : null;

  const dotClass = ['session-status-dot', DOT_STYLES[state], DOT_PULSE_CLASS[state] ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="session-status-wrapper">
      {glowClass ? <span className={glowClass} aria-hidden /> : null}
      <div className={classes}>
        <span className={dotClass} aria-hidden />
        {LABELS[state]}
      </div>
    </div>
  );
};

export default SessionStatus;

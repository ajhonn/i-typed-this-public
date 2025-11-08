import { useMemo } from 'react';
import { useSession } from '@features/session/SessionProvider';
import { usePlaybackController } from './PlaybackControllerContext';

const PlaybackToolbar = () => {
  const {
    playbackEvents,
    isPlaying,
    togglePlay,
    reset,
    speed,
    setSpeed,
    currentTime,
    setCurrentTime,
    totalDuration,
    currentSnapshot,
    canPlay,
  } = usePlaybackController();
  const { session } = useSession();

  const formattedTime = useMemo(() => `${(currentTime / 1000).toFixed(2)}s`, [currentTime]);
  const timelineDisabled = playbackEvents.length <= 1 || totalDuration === 0;
  const idleSkipNote = useMemo(() => {
    if (!currentSnapshot?.skippedGapMs) {
      return null;
    }
    const seconds = (currentSnapshot.skippedGapMs / 1000).toFixed(1);
    return `Skipped ${seconds}s idle`;
  }, [currentSnapshot]);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="Playback controls">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!canPlay}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
            {isPlaying ? '❚❚' : '▶'}
          </span>
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={currentTime === 0}
          className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <span>Speed</span>
        <input
          aria-label="Playback speed"
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
          className="w-32"
        />
        <span>{speed.toFixed(1)}x</span>
      </label>

      <label className="flex min-w-[260px] flex-1 flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
        Event · {formattedTime}
        <input
          aria-label="Playback position"
          type="range"
          min={0}
          max={totalDuration || 1}
          value={currentTime}
          onInput={(event) => setCurrentTime(Number((event.target as HTMLInputElement).value))}
          disabled={timelineDisabled}
          className="mt-1 w-full"
        />
        <span className="text-[11px] font-normal normal-case text-slate-500">
          {currentSnapshot?.label ?? 'No events recorded yet'}
          {idleSkipNote ? (
            <span className="ml-1 text-[11px] font-medium text-amber-600">{idleSkipNote}</span>
          ) : null}
        </span>
      </label>

      <button
        type="button"
        onClick={handleDownload}
        className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Download session JSON
      </button>
    </div>
  );
};

export default PlaybackToolbar;

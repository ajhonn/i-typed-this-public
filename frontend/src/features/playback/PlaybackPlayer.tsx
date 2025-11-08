import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useSession } from '@features/session/SessionProvider';
import PlaybackCursor from './PlaybackCursor';

const PlaybackPlayer = () => {
  const { session } = useSession();
  const events = session.events;

  const playbackEvents = useMemo(() => {
    if (!events.length) {
      return [
        {
          html: session.editorHTML,
          label: 'Current',
          timestamp: Date.now(),
          durationMs: 500,
          selection: { from: 0, to: 0 },
          source: 'transaction' as const,
          elapsedMs: 0,
        },
      ];
    }

    let chosen = events.filter((event) => {
      if (event.source === 'dom') return true;
      if (event.type === 'text-input' || event.type === 'delete') {
        // Skip transaction-level typing snapshots when we have DOM data.
        return false;
      }
      return true;
    });
    if (!chosen.length) {
      chosen = events;
    }
    let elapsed = 0;

    return chosen.map((event, index) => ({
      html: event.meta.html,
      label: `${index + 1}. ${event.type}`,
      timestamp: event.timestamp,
      durationMs: event.meta.durationMs ?? 500,
      selection: event.meta.selection,
      source: event.source,
      elapsedMs: (elapsed += event.meta.durationMs ?? 500),
    }));
  }, [events, session.editorHTML]);

  const totalDuration = playbackEvents.reduce((sum, event) => sum + event.durationMs, 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const editor = useEditor({
    extensions: [StarterKit],
    content: playbackEvents[0]?.html ?? '<p></p>',
    editable: false,
  });

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [playbackEvents.length]);

  useEffect(() => {
    if (!editor) return;
    const currentIndex = playbackEvents.findIndex((event) => event.elapsedMs >= currentTime);
    const html = playbackEvents[currentIndex]?.html ?? playbackEvents.at(-1)?.html ?? '<p></p>';
    editor.commands.setContent(html, false);

    // Scroll to keep caret near view bottom
    const editorEl = editor.view.dom as HTMLElement;
    const root = editorEl.closest('.playback-frame');
    if (root) {
      root.scrollTop = editorEl.scrollHeight;
    }
  }, [editor, currentTime, playbackEvents]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentTime >= totalDuration) {
      setIsPlaying(false);
      return;
    }
    const tick = () => {
      setCurrentTime((prev) => Math.min(prev + 16 * speed, totalDuration));
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, currentTime, totalDuration, speed]);

  if (!editor) {
    return null;
  }

  const currentIndex = playbackEvents.findIndex((event) => event.elapsedMs >= currentTime);
  const currentSnapshot = playbackEvents[currentIndex] ?? playbackEvents.at(-1);

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Playback</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={playbackEvents.length <= 1}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentTime(0)}
            disabled={currentTime === 0}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
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
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Event · {(currentTime / 1000).toFixed(2)}s
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTime}
            onInput={(event) => setCurrentTime(Number((event.target as HTMLInputElement).value))}
            disabled={totalDuration === 0}
            className="mt-1 w-full"
          />
        </label>
        <div className="text-sm text-slate-700">
          {currentSnapshot?.label ?? 'No events recorded yet'}
        </div>
      </div>

      <div className="playback-frame rounded-2xl border border-slate-100 bg-slate-50 p-4 max-h-[480px] overflow-auto">
        <EditorContent editor={editor} />
        <PlaybackCursor selection={currentSnapshot?.selection ?? { from: 0, to: 0 }} />
      </div>
    </section>
  );
};

export default PlaybackPlayer;

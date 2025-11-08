import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '@features/session/SessionProvider';
import type { RecorderEvent } from '@features/recorder/types';

export type PlaybackSnapshot = {
  html: string;
  label: string;
  timestamp: number;
  durationMs: number;
  selection: { from: number; to: number };
  source: RecorderEvent['source'];
  elapsedMs: number;
  skippedGapMs?: number;
};

type PlaybackControllerContextValue = {
  playbackEvents: PlaybackSnapshot[];
  totalDuration: number;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  reset: () => void;
  speed: number;
  setSpeed: (value: number) => void;
  currentSnapshot: PlaybackSnapshot | null;
  canPlay: boolean;
};

const PlaybackControllerContext = createContext<PlaybackControllerContextValue | undefined>(undefined);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const MIN_EVENT_DURATION_MS = 16;
const IDLE_GAP_THRESHOLD_MS = 4000;
const COMPRESSED_GAP_DURATION_MS = 600;

const derivePlaybackEvents = (events: RecorderEvent[], editorHTML: string): PlaybackSnapshot[] => {
  if (!events.length) {
    return [
      {
        html: editorHTML,
        label: 'Current',
        timestamp: Date.now(),
        durationMs: 500,
        selection: { from: 0, to: 0 },
        source: 'transaction',
        elapsedMs: 0,
      },
    ];
  }

  let chosen = events.filter((event) => {
    if (event.source === 'dom') return true;
    if (event.type === 'text-input' || event.type === 'delete') {
      return false;
    }
    return true;
  });

  if (!chosen.length) {
    chosen = events;
  }

  const sorted = chosen
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      if (a.event.timestamp === b.event.timestamp) {
        return a.index - b.index;
      }
      return a.event.timestamp - b.event.timestamp;
    });

  let elapsed = 0;
  return sorted.map(({ event }, index) => {
    const next = sorted[index + 1]?.event;
    const rawDuration = next ? Math.max(next.timestamp - event.timestamp, MIN_EVENT_DURATION_MS) : 500;
    const exceedsIdleThreshold = next ? next.timestamp - event.timestamp > IDLE_GAP_THRESHOLD_MS : false;
    const duration = exceedsIdleThreshold ? COMPRESSED_GAP_DURATION_MS : rawDuration;
    const skippedGapMs = exceedsIdleThreshold ? rawDuration - COMPRESSED_GAP_DURATION_MS : 0;
    const currentElapsed = elapsed;
    elapsed += duration;

    return {
      html: event.meta.html,
      label: `${index + 1}. ${event.type}`,
      timestamp: event.timestamp,
      durationMs: duration,
      selection: event.meta.selection,
      source: event.source,
      elapsedMs: currentElapsed,
      skippedGapMs: skippedGapMs || undefined,
    };
  });
};

export const PlaybackProvider = ({ children }: PropsWithChildren) => {
  const { session } = useSession();
  const playbackEvents = useMemo(() => derivePlaybackEvents(session.events, session.editorHTML), [
    session.editorHTML,
    session.events,
  ]);
  const totalDuration = useMemo(
    () => playbackEvents.reduce((sum, event) => sum + event.durationMs, 0),
    [playbackEvents]
  );

  const [currentTime, setCurrentTimeState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);

  const setCurrentTime = useCallback(
    (nextTime: number) => {
      setCurrentTimeState(clamp(nextTime, 0, totalDuration));
    },
    [totalDuration]
  );

  const setSpeed = useCallback((nextSpeed: number) => {
    setSpeedState(clamp(nextSpeed, 0.5, 10));
  }, []);

  useEffect(() => {
    setCurrentTimeState((prev) => clamp(prev, 0, totalDuration));
  }, [totalDuration]);

  useEffect(() => {
    setCurrentTimeState(0);
    setIsPlaying(false);
  }, [playbackEvents.length]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    if (currentTime >= totalDuration) {
      setIsPlaying(false);
      return;
    }

    const tick = () => {
      setCurrentTimeState((prev) => {
        const next = clamp(prev + 16 * speed, 0, totalDuration);
        if (next >= totalDuration) {
          setIsPlaying(false);
        }
        return next;
      });
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, currentTime, totalDuration, speed]);

  const canPlay = playbackEvents.length > 1;

  const togglePlay = useCallback(() => {
    if (!canPlay) return;
    setIsPlaying((prev) => !prev);
  }, [canPlay]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTimeState(0);
  }, []);

  const currentSnapshot = useMemo(() => {
    if (!playbackEvents.length) {
      return null;
    }

    const index = playbackEvents.findIndex((event) => event.elapsedMs >= currentTime);
    return playbackEvents[index] ?? playbackEvents[playbackEvents.length - 1] ?? null;
  }, [playbackEvents, currentTime]);

  const value = useMemo<PlaybackControllerContextValue>(
    () => ({
      playbackEvents,
      totalDuration,
      currentTime,
      setCurrentTime,
      isPlaying,
      togglePlay,
      reset,
      speed,
      setSpeed,
      currentSnapshot,
      canPlay,
    }),
    [
      playbackEvents,
      totalDuration,
      currentTime,
      setCurrentTime,
      isPlaying,
      togglePlay,
      reset,
      speed,
      setSpeed,
      currentSnapshot,
      canPlay,
    ]
  );

  return <PlaybackControllerContext.Provider value={value}>{children}</PlaybackControllerContext.Provider>;
};

export const usePlaybackController = () => {
  const context = useContext(PlaybackControllerContext);
  if (!context) {
    throw new Error('usePlaybackController must be used within PlaybackProvider');
  }

  return context;
};

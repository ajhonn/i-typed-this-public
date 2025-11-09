import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '@features/session/SessionProvider';
import type { RecorderEvent } from '@features/recorder/types';

export type PlaybackSnapshot = {
  id: string;
  html: string;
  label: string;
  timestamp: number;
  durationMs: number;
  selection: { from: number; to: number };
  source: RecorderEvent['source'];
  elapsedMs: number;
  skippedGapMs?: number;
  eventType: RecorderEvent['type'];
  diff?: {
    added?: string;
    removed?: string;
  };
  classification?: 'paste-internal' | 'paste-external';
};

type PlaybackControllerContextValue = {
  playbackEvents: PlaybackSnapshot[];
  totalDuration: number;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  reset: () => void;
  speed: number;
  setSpeed: (value: number) => void;
  currentSnapshot: PlaybackSnapshot | null;
  canPlay: boolean;
  highlightAlert: boolean;
  pauseOnUnmatchedPastes: boolean;
  setPauseOnUnmatchedPastes: Dispatch<SetStateAction<boolean>>;
};

const PlaybackControllerContext = createContext<PlaybackControllerContextValue | undefined>(undefined);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const MIN_EVENT_DURATION_MS = 16;
const IDLE_GAP_THRESHOLD_MS = 4000;
const COMPRESSED_GAP_DURATION_MS = 600;
const MAX_DIFF_PREVIEW = 80;
const PAUSE_PREF_KEY = 'playback.pauseOnUnmatched';

const getPausePreference = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  const stored = window.localStorage.getItem(PAUSE_PREF_KEY);
  if (stored === null) {
    return true;
  }
  return stored === 'true';
};

const htmlToPlainText = (html: string) => {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const summarizeDiff = (previousText: string, nextText: string) => {
  if (previousText === nextText) {
    return undefined;
  }

  let start = 0;
  const maxStart = Math.min(previousText.length, nextText.length);
  while (start < maxStart && previousText[start] === nextText[start]) {
    start += 1;
  }

  let endPrev = previousText.length - 1;
  let endNext = nextText.length - 1;

  while (endPrev >= start && endNext >= start && previousText[endPrev] === nextText[endNext]) {
    endPrev -= 1;
    endNext -= 1;
  }

  const addedRaw = endNext >= start ? nextText.slice(start, endNext + 1) : '';
  const removedRaw = endPrev >= start ? previousText.slice(start, endPrev + 1) : '';
  const formatPreview = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, MAX_DIFF_PREVIEW);
  const added = formatPreview(addedRaw);
  const removed = formatPreview(removedRaw);

  if (!added && !removed) {
    return undefined;
  }

  return {
    added: added || undefined,
    removed: removed || undefined,
  };
};

const derivePlaybackEvents = (events: RecorderEvent[], editorHTML: string): PlaybackSnapshot[] => {
  if (!events.length) {
    return [
      {
        id: 'current',
        html: editorHTML,
        label: 'Current',
        timestamp: Date.now(),
        durationMs: 500,
        selection: { from: 0, to: 0 },
        source: 'transaction',
        elapsedMs: 0,
        eventType: 'transaction',
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
  let previousPlainText = '';
  const snapshots: PlaybackSnapshot[] = [];
  sorted.forEach(({ event }, index) => {
    if (event.type === 'transaction') {
      const prevEvent = sorted[index - 1]?.event;
      if (prevEvent && prevEvent.type === 'delete') {
        return;
      }
    }
    const next = sorted[index + 1]?.event;
    const rawDuration = next ? Math.max(next.timestamp - event.timestamp, MIN_EVENT_DURATION_MS) : 500;
    const exceedsIdleThreshold = next ? next.timestamp - event.timestamp > IDLE_GAP_THRESHOLD_MS : false;
    const duration = exceedsIdleThreshold ? COMPRESSED_GAP_DURATION_MS : rawDuration;
    const skippedGapMs = exceedsIdleThreshold ? rawDuration - COMPRESSED_GAP_DURATION_MS : 0;
    const currentElapsed = elapsed;
    elapsed += duration;
    const plainText = htmlToPlainText(event.meta.html);
    const diff = summarizeDiff(previousPlainText, plainText);
    previousPlainText = plainText;
    let classification: PlaybackSnapshot['classification'];
    if (event.type === 'paste' && event.meta.pastePayload) {
      classification = event.meta.pastePayload.source === 'ledger' ? 'paste-internal' : 'paste-external';
    }

    snapshots.push({
      id: event.id,
      html: event.meta.html,
      label: `${index + 1}. ${event.type}`,
      timestamp: event.timestamp,
      durationMs: duration,
      selection: event.meta.selection,
      source: event.source,
      elapsedMs: currentElapsed,
      skippedGapMs: skippedGapMs || undefined,
      eventType: event.type,
      diff,
      classification,
    });
  });

  return snapshots;
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
  const [highlightAlert, setHighlightAlert] = useState(false);
  const [alertEventId, setAlertEventId] = useState<string | null>(null);
  const [pauseOnUnmatchedPastes, setPauseOnUnmatchedPastes] = useState<boolean>(() => getPausePreference());

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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PAUSE_PREF_KEY, String(pauseOnUnmatchedPastes));
  }, [pauseOnUnmatchedPastes]);

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

  const setPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTimeState(0);
    setHighlightAlert(false);
    setAlertEventId(null);
  }, []);

  const currentSnapshot = useMemo(() => {
    if (!playbackEvents.length) {
      return null;
    }
    let snapshot = playbackEvents[0];
    for (let i = 0; i < playbackEvents.length; i += 1) {
      const event = playbackEvents[i];
      if (event.elapsedMs <= currentTime) {
        snapshot = event;
      } else {
        break;
      }
    }
    return snapshot ?? playbackEvents[0];
  }, [playbackEvents, currentTime]);

  useEffect(() => {
    if (!currentSnapshot) {
      setHighlightAlert(false);
      setAlertEventId(null);
      return;
    }
    const isUnmatched =
      currentSnapshot.eventType === 'paste' && currentSnapshot.classification === 'paste-external';
    if (isUnmatched) {
      setHighlightAlert(true);
      if (currentSnapshot.id !== alertEventId) {
        setAlertEventId(currentSnapshot.id);
        if (pauseOnUnmatchedPastes) {
          setIsPlaying(false);
        }
      }
    } else if (alertEventId) {
      setHighlightAlert(false);
      setAlertEventId(null);
    }
  }, [currentSnapshot, alertEventId, pauseOnUnmatchedPastes]);

  const value = useMemo<PlaybackControllerContextValue>(
    () => ({
      playbackEvents,
      totalDuration,
      currentTime,
      setCurrentTime,
      isPlaying,
      setPlaying,
      togglePlay,
      reset,
      speed,
      setSpeed,
      currentSnapshot,
      canPlay,
      highlightAlert,
      pauseOnUnmatchedPastes,
      setPauseOnUnmatchedPastes,
    }),
    [
      playbackEvents,
      totalDuration,
      currentTime,
      setCurrentTime,
      isPlaying,
      setPlaying,
      togglePlay,
      reset,
      speed,
      setSpeed,
      currentSnapshot,
      canPlay,
      highlightAlert,
      pauseOnUnmatchedPastes,
      setPauseOnUnmatchedPastes,
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

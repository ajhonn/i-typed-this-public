import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type ChangeEvent,
  type PointerEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { createPortal } from 'react-dom';
import { useSession } from '@features/session/SessionProvider';
import { buildArchiveFilename, createSessionArchive, parseSessionArchive } from '@features/session/sessionArchive';
import { usePlaybackController, type PlaybackSnapshot } from './PlaybackControllerContext';
import PlaybackAnalysisDock from './PlaybackAnalysisDock';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const DEFAULT_VIEWPORT_MS = 60000;
const MIN_VIEWPORT_MS = 5000;

const EVENT_LABELS: Record<string, string> = {
  'text-input': 'Typing',
  paste: 'Paste',
  delete: 'Revision',
  'selection-change': 'Selection change',
  transaction: 'Edit',
  copy: 'Copy',
  cut: 'Cut',
};

type MarkerVariant = {
  shape: 'circle' | 'diamond' | 'triangle' | 'line';
  className: string;
  offset: number;
  size: number;
};

const markerVariants: Record<string, MarkerVariant> = {
  'text-input': { shape: 'line', className: 'bg-emerald-400/90', offset: 0, size: 24 },
  paste: { shape: 'diamond', className: 'bg-sky-400', offset: 0, size: 12 },
  delete: { shape: 'line', className: 'bg-rose-400/90', offset: 0, size: 24 },
};

const unmatchedVariant: MarkerVariant = { shape: 'diamond', className: 'bg-rose-500', offset: 0, size: 16 };
type LegendEntry = { key: string; label: string; variant?: MarkerVariant; type?: 'idle' };

type IconProps = SVGProps<SVGSVGElement>;

const iconBaseProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
};

const PlayIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <polygon points="6 4 12 8 6 12" fill="currentColor" />
  </svg>
);

const PauseIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <rect x="5" y="4" width="2" height="8" rx="0.5" fill="currentColor" />
    <rect x="9" y="4" width="2" height="8" rx="0.5" fill="currentColor" />
  </svg>
);

const RotateCcwIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <path
      d="M4.5 6.5a4.5 4.5 0 1 1 1.2 3"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="6 3.5 3.5 3.5 3.5 6"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownloadIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <path d="M8 3v7" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    <polyline points="5.5 7.5 8 10.5 10.5 7.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12.5h8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);

const SettingsIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <line x1="4" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    <line x1="4" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    <circle cx="6.5" cy="4" r="1" fill="currentColor" />
    <circle cx="10" cy="8" r="1" fill="currentColor" />
    <circle cx="5.5" cy="12" r="1" fill="currentColor" />
  </svg>
);

const UploadIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <path d="M8 13V6" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    <polyline
      points="5.5 8.5 8 5.5 10.5 8.5"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4 3.5h8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);

const ChevronLeftIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <polyline
      points="9.5 4 5.5 8 9.5 12"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = (props: IconProps) => (
  <svg {...iconBaseProps} {...props}>
    <polyline
      points="6.5 4 10.5 8 6.5 12"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
    highlightAlert,
    pauseOnUnmatchedPastes,
    setPauseOnUnmatchedPastes,
  } = usePlaybackController();
  const { session, loadSession } = useSession();
  const minimapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [viewportDuration, setViewportDuration] = useState(DEFAULT_VIEWPORT_MS);
  const [viewportStart, setViewportStart] = useState(0);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPanelId = useId();
  const [transferNote, setTransferNote] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
  const [isUploadingArchive, setIsUploadingArchive] = useState(false);

  const detailSnapshot = useMemo(() => {
    if (selectedMarkerId) {
      return playbackEvents.find((event) => event.id === selectedMarkerId) ?? currentSnapshot;
    }
    return currentSnapshot;
  }, [selectedMarkerId, playbackEvents, currentSnapshot]);

  const formattedTime = useMemo(() => `${(currentTime / 1000).toFixed(2)}s`, [currentTime]);
  const timelineDisabled = playbackEvents.length <= 1 || totalDuration === 0;
  const idleSkipNote = useMemo(() => {
    if (!currentSnapshot?.skippedGapMs) {
      return null;
    }
    const seconds = (currentSnapshot.skippedGapMs / 1000).toFixed(1);
    return `Skipped ${seconds}s idle`;
  }, [currentSnapshot]);

  const viewportEnd = viewportStart + viewportDuration;

  useEffect(() => {
    const duration = totalDuration || DEFAULT_VIEWPORT_MS;
    setViewportDuration((prev) => clamp(prev, MIN_VIEWPORT_MS, duration));
    setViewportStart((prev) => clamp(prev, 0, Math.max(duration - viewportDuration, 0)));
  }, [totalDuration, viewportDuration]);

  useEffect(() => {
    if (!totalDuration || !viewportDuration || isScrubbing) {
      return;
    }
    const halfWindow = viewportDuration * 0.5;
    const margin = viewportDuration * 0.1;
    const lowerBound = viewportStart + margin;
    const upperBound = viewportStart + viewportDuration - margin;
    let nextStart = viewportStart;

    if (currentTime < lowerBound) {
      nextStart = clamp(currentTime - halfWindow, 0, Math.max(totalDuration - viewportDuration, 0));
    } else if (currentTime > upperBound) {
      nextStart = clamp(currentTime - halfWindow, 0, Math.max(totalDuration - viewportDuration, 0));
    }

    if (Math.abs(nextStart - viewportStart) > 1) {
      setViewportStart(nextStart);
    }
  }, [currentTime, totalDuration, viewportDuration, viewportStart, isScrubbing]);

  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      setSelectedMarkerId(null);
    }
  }, [isPlaying, isScrubbing, currentTime]);

  const visibleEvents = useMemo(() => {
    return playbackEvents.filter((event) => {
      const elapsed = event.elapsedMs;
      return elapsed >= viewportStart && elapsed <= viewportEnd;
    });
  }, [playbackEvents, viewportStart, viewportEnd]);

  const idleBoundaries = useMemo(() => playbackEvents.filter((event) => event.skippedGapMs), [playbackEvents]);
  const visibleIdleLines = useMemo(
    () => idleBoundaries.filter((event) => event.elapsedMs >= viewportStart && event.elapsedMs <= viewportEnd),
    [idleBoundaries, viewportStart, viewportEnd]
  );

  const progressWithinViewport = useMemo(() => {
    if (!viewportDuration) return 0;
    return clamp(((currentTime - viewportStart) / viewportDuration) * 100, 0, 100);
  }, [currentTime, viewportDuration, viewportStart]);

  const minimapViewport = useMemo(() => {
    if (!totalDuration) {
      return { left: 0, width: 100 };
    }
    const width = clamp((viewportDuration / totalDuration) * 100, 2, 100);
    const left = clamp((viewportStart / totalDuration) * 100, 0, 100 - width);
    return { left, width };
  }, [viewportDuration, viewportStart, totalDuration]);

  const updateTimeFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !viewportDuration) {
        return;
      }
      const rect = trackRef.current.getBoundingClientRect();
      if (!rect.width) {
        return;
      }
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const target = viewportStart + ratio * viewportDuration;
      setCurrentTime(Math.round(target));
    },
    [setCurrentTime, viewportDuration, viewportStart]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (timelineDisabled) return;
      event.preventDefault();
      trackRef.current?.setPointerCapture(event.pointerId);
      setIsScrubbing(true);
      updateTimeFromPointer(event.clientX);
    },
    [timelineDisabled, updateTimeFromPointer]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return;
      event.preventDefault();
      updateTimeFromPointer(event.clientX);
    },
    [isScrubbing, updateTimeFromPointer]
  );

  const endScrub = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return;
      trackRef.current?.releasePointerCapture(event.pointerId);
      setIsScrubbing(false);
      updateTimeFromPointer(event.clientX);
    },
    [isScrubbing, updateTimeFromPointer]
  );


  const handleDownload = useCallback(async () => {
    try {
      setIsDownloadingArchive(true);
      const { blob, manifest } = await createSessionArchive(session);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = buildArchiveFilename(session, manifest.createdAt);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTransferNote({
        status: 'success',
        message: `Archive downloaded · saved as ${filename}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build session archive.';
      setTransferNote({ status: 'error', message });
    } finally {
      setIsDownloadingArchive(false);
    }
  }, [session]);

  const handleUploadClick = useCallback(() => {
    archiveInputRef.current?.click();
  }, []);

  const handleArchiveInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        setIsUploadingArchive(true);
        const { session: importedSession, manifest } = await parseSessionArchive(file);
        loadSession(importedSession);
        setTransferNote({
          status: 'success',
          message: `Archive verified · SHA-256 ${manifest.sessionHash.slice(0, 12)}…`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to verify archive. Confirm the zip is intact.';
        setTransferNote({ status: 'error', message });
      } finally {
        setIsUploadingArchive(false);
      }
    },
    [loadSession]
  );

  const handleMinimapClick = (event: PointerEvent<HTMLDivElement>) => {
    if (!totalDuration) return;
    const rect = minimapRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const nextStart = clamp(ratio * totalDuration - viewportDuration / 2, 0, Math.max(totalDuration - viewportDuration, 0));
    setViewportStart(nextStart);
  };

  const handleZoomChange = (value: number | 'all') => {
    if (!totalDuration) return;
    const target = value === 'all' ? totalDuration : value;
    const duration = clamp(target, MIN_VIEWPORT_MS, totalDuration);
    setViewportDuration(duration);
    setViewportStart((prev) => clamp(prev, 0, Math.max(totalDuration - duration, 0)));
  };

  const panViewport = (direction: 'left' | 'right') => {
    if (!totalDuration) return;
    const delta = viewportDuration * 0.5 * (direction === 'left' ? -1 : 1);
    setViewportStart((prev) => clamp(prev + delta, 0, Math.max(totalDuration - viewportDuration, 0)));
  };

  const toggleSettingsPanel = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handlePausePreferenceToggle = () => {
    setPauseOnUnmatchedPastes((prev) => !prev);
  };

  const zoomOptions: Array<{ label: string; value: number | 'all' }> = [
    { label: '5s', value: 5000 },
    { label: '15s', value: 15000 },
    { label: '60s', value: 60000 },
    { label: 'All', value: 'all' },
  ];

  const getFriendlyLabel = (snapshot?: PlaybackSnapshot | null) => {
    if (!snapshot) return 'No events yet';
    const base = EVENT_LABELS[snapshot.eventType] ?? snapshot.eventType.replace(/-/g, ' ');
    if (snapshot.eventType === 'paste' && snapshot.classification === 'paste-external') {
      return `${base} (external)`;
    }
    if (snapshot.eventType === 'paste' && snapshot.classification === 'paste-internal') {
      return `${base} (internal)`;
    }
    return base;
  };

  const renderMarkerShape = (variant: MarkerVariant, isActive: boolean, sizeOverride?: number) => {
    const size = sizeOverride ?? variant.size;
    const base = `${variant.className} shadow ${isActive ? 'ring-2 ring-slate-900 scale-110' : ''}`;
    if (variant.shape === 'line') {
      return (
        <span
          className={`${base} block rounded-full`}
          style={{ width: 3, height: size }}
        />
      );
    }
    const borderedBase = `${base} border border-white`;
    if (variant.shape === 'triangle') {
      return (
        <span
          className={borderedBase}
          style={{
            width: size,
            height: size,
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          }}
        />
      );
    }
    if (variant.shape === 'diamond') {
      return (
        <span
          className={`${borderedBase} flex items-center justify-center`}
          style={{
            width: size,
            height: size,
            transform: 'rotate(45deg)',
            borderRadius: 4,
          }}
        />
      );
    }
    return (
      <span
        className={`${borderedBase} rounded-full`}
        style={{ width: size, height: size }}
      />
    );
  };

  const getMarkerVariant = (event: PlaybackSnapshot) => {
    if (event.eventType === 'paste' && event.classification === 'paste-external') {
      return unmatchedVariant;
    }
    return markerVariants[event.eventType];
  };

  const renderMarkers = () => {
    if (!viewportDuration) return null;
    return visibleEvents.map((event) => {
      const ratio = ((event.elapsedMs - viewportStart) / viewportDuration) * 100;
      const left = clamp(ratio, 0, 100);
      const variant = getMarkerVariant(event);
      if (!variant) {
        return null;
      }
      const label = `${getFriendlyLabel(event)} · ${new Date(event.timestamp).toLocaleTimeString()}`;
      const isActive = detailSnapshot?.id === event.id;
      return (
        <button
          key={`${event.id}-marker`}
          type="button"
          onClick={() => {
            setCurrentTime(event.elapsedMs);
            setSelectedMarkerId(event.id);
          }}
          className="group absolute flex flex-col items-center"
          style={{ left: `${left}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {renderMarkerShape(variant, isActive)}
          <span className="pointer-events-none mt-1 hidden rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow group-hover:block">
            {label}
          </span>
        </button>
      );
    });
  };

  const renderIdleSeparators = () => {
    if (!viewportDuration) return null;
    return visibleIdleLines.map((event) => {
      const ratio = ((event.elapsedMs - viewportStart) / viewportDuration) * 100;
      const left = clamp(ratio, 0, 100);
      const isActive = detailSnapshot?.id === event.id;
      const seconds = (event.elapsedMs / 1000).toFixed(2);
      return (
        <button
          key={`${event.id}-idle`}
          type="button"
          onClick={() => {
            setCurrentTime(event.elapsedMs);
            setSelectedMarkerId(event.id);
          }}
          className={`group absolute z-10 flex flex-col items-center ${timelineDisabled ? 'pointer-events-none' : ''}`}
          style={{ left: `${left}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          aria-label={`Skipped idle at ${seconds} seconds`}
          title="Idle gap boundary"
        >
          <span
            className={`block w-[3px] rounded-full shadow-[0_0_4px_rgba(251,191,36,0.8)] ${
              isActive ? 'h-10 bg-amber-400 ring-2 ring-amber-500/60' : 'h-8 bg-amber-300/80'
            }`}
          />
          <span className="pointer-events-none mt-1 hidden rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow group-hover:block">
            Skipped idle · {seconds}s
          </span>
        </button>
      );
    });
  };

  const timelineLegend = useMemo<LegendEntry[]>(
    () => [
      { key: 'typing', label: 'Typing & editing', variant: markerVariants['text-input'] },
      { key: 'paste', label: 'Paste (matched)', variant: markerVariants.paste },
      { key: 'unmatched', label: 'Paste (unmatched)', variant: unmatchedVariant },
      { key: 'delete', label: EVENT_LABELS.delete, variant: markerVariants.delete },
      { key: 'idle', label: 'Skipped idle gap', type: 'idle' },
    ],
    []
  );

  const renderDiffChips = (diff?: PlaybackSnapshot['diff'], alert?: boolean) => {
    if (!diff) return null;
    const chips: ReactNode[] = [];
    if (alert && diff.added) {
      chips.push(
        <span
          key="warning"
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
        >
          Warning: unmatched paste · + &quot;{diff.added.slice(0, 40)}&quot;
        </span>
      );
    } else if (diff.added) {
      chips.push(
        <span
          key="added"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
        >
          + &quot;{diff.added.slice(0, 40)}&quot;
        </span>
      );
    }
    if (!alert && diff.removed) {
      chips.push(
        <span
          key="removed"
          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
        >
          - &quot;{diff.removed.slice(0, 40)}&quot;
        </span>
      );
    }
    if (!chips.length) return null;
    return <>{chips}</>;
  };

  const detailLabel = getFriendlyLabel(detailSnapshot);
  const detailTime = detailSnapshot ? `${(detailSnapshot.elapsedMs / 1000).toFixed(2)}s` : formattedTime;
  const detailDiff = detailSnapshot?.diff;

  const timelineSection = (
    <section className="flex w-full flex-col gap-3" aria-label="Timeline controls">
      <div className="flex min-h-[36px] flex-wrap items-center gap-4 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{detailLabel}</span>
          <span className="text-[11px] text-slate-500">{detailTime}</span>
          {renderDiffChips(detailDiff, highlightAlert)}
        </div>
        {detailSnapshot?.eventType === 'paste' && detailSnapshot?.classification === 'paste-external' ? (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">Unmatched paste</span>
        ) : null}
        {idleSkipNote ? <span className="text-amber-600">{idleSkipNote}</span> : null}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
          <span>Zoom</span>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
            {zoomOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleZoomChange(option.value)}
                className={`rounded-full px-2 py-0.5 ${
                  (option.value === 'all' && viewportDuration >= (totalDuration || 0)) ||
                  (typeof option.value === 'number' && viewportDuration === option.value)
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 disabled:opacity-40"
            onClick={() => panViewport('left')}
            disabled={viewportStart <= 0}
            aria-label="Pan timeline left"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 disabled:opacity-40"
                onClick={() => panViewport('right')}
                disabled={viewportStart + viewportDuration >= (totalDuration || 0)}
                aria-label="Pan timeline right"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
      </div>

      <div className="flex flex-col gap-2">
        <div
          ref={minimapRef}
          className={`relative h-2.5 w-full rounded-full bg-slate-100 ${timelineDisabled ? 'opacity-50' : ''}`}
          onPointerDown={handleMinimapClick}
          role="presentation"
          aria-label="Timeline overview"
        >
          <div
            className="absolute top-0 bottom-0 rounded-full border border-slate-500/40 bg-slate-400/60"
            style={{ left: `${minimapViewport.left}%`, width: `${minimapViewport.width}%` }}
            aria-hidden="true"
          />
        </div>

        <div
          ref={trackRef}
          data-testid="playback-timeline"
          className={`relative h-12 w-full rounded-2xl border border-slate-200 bg-white shadow-inner ${
            timelineDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          role="presentation"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
        >
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-slate-200/70" aria-hidden="true" />
          <div className="absolute inset-0">{renderIdleSeparators()}</div>
          <div className="absolute inset-0">{renderMarkers()}</div>
          <div
            className="pointer-events-none absolute top-1 bottom-1 w-0.5 bg-slate-900"
            style={{ left: `${progressWithinViewport}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-medium normal-case text-slate-500" aria-label="Timeline legend">
          {timelineLegend.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1">
              {item.type === 'idle' ? (
                <span className="h-4 w-[3px] rounded-full bg-amber-300/70" aria-hidden="true" />
              ) : item.variant ? (
                renderMarkerShape(item.variant, false, item.variant.size - 2)
              ) : null}
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );

  const transportControls = (
    <section
      className="flex w-full max-w-[640px] flex-col gap-2 self-center rounded-3xl border border-slate-200 bg-white/95 px-5 py-3 text-xs text-slate-600 shadow-lg backdrop-blur"
      aria-label="Playback transport controls"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!canPlay}
          aria-pressed={isPlaying}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isPlaying
              ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-100'
          }`}
        >
          <span aria-hidden className="text-current">
            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </span>
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={currentTime === 0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
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
        <div className="flex items-center gap-2">
          <button
            type="button"
          aria-label="Upload session zip at i-typed-this.com/playback"
            onClick={handleUploadClick}
            disabled={isUploadingArchive}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Download session zip with README"
            onClick={() => void handleDownload()}
            disabled={isDownloadingArchive}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Toggle playback settings"
          onClick={toggleSettingsPanel}
          aria-pressed={isSettingsOpen}
          aria-expanded={isSettingsOpen}
          aria-controls={isSettingsOpen ? settingsPanelId : undefined}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100"
        >
          <SettingsIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {transferNote ? (
        <p
          role="status"
          className={`text-xs font-semibold ${
            transferNote.status === 'success' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {transferNote.message}
        </p>
      ) : null}
      <input
        ref={archiveInputRef}
        type="file"
        className="sr-only"
        accept=".zip,application/zip"
        onChange={handleArchiveInputChange}
      />
    </section>
  );

  const timelinePanel = (
    <div className="w-full rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur">
      {timelineSection}
    </div>
  );

  const settingsPanel = (
    <section
      id={settingsPanelId}
      aria-label="Playback settings"
      className="w-full rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 text-sm text-slate-600 shadow-lg backdrop-blur"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">Playback settings</p>
          <p className="text-xs text-slate-500">Tweak how the timeline responds during reviews.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm font-semibold text-slate-900">Pause on unmatched pastes</p>
          <p className="text-xs text-slate-500">Automatically stop playback when external clipboard activity is detected.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={pauseOnUnmatchedPastes}
          onClick={handlePausePreferenceToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
            pauseOnUnmatchedPastes ? 'border-emerald-200 bg-emerald-500/70' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <span
            className="ml-[2px] inline-block h-5 w-5 rounded-full bg-white shadow transition"
            style={{ transform: pauseOnUnmatchedPastes ? 'translateX(20px)' : 'translateX(0)' }}
          />
          <span className="sr-only">Toggle pause on unmatched pastes</span>
        </button>
      </div>
    </section>
  );

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const dockStack = (
    <div className="flex w-full flex-col items-center gap-4">
      {timelinePanel}
      {isSettingsOpen ? settingsPanel : null}
      {transportControls}
    </div>
  );

  const floatingDock = (
    <div
      data-playback-dock
      className="fixed bottom-6 left-1/2 z-40 flex w-full -translate-x-1/2 flex-col items-center gap-4 px-4"
    >
      <div className="w-full max-w-[1100px]">
        <PlaybackAnalysisDock />
      </div>
      <div className="w-full max-w-[1100px]">{dockStack}</div>
    </div>
  );

  return (
    <>
      {portalTarget ? createPortal(floatingDock, portalTarget) : null}
      {!portalTarget ? (
        <div className="flex w-full flex-col items-center gap-4" aria-label="Playback controls">
          <div className="w-full max-w-[1100px]">
            <PlaybackAnalysisDock />
          </div>
          <div className="w-full max-w-[1100px]">{dockStack}</div>
        </div>
      ) : null}
    </>
  );
};

export default PlaybackToolbar;

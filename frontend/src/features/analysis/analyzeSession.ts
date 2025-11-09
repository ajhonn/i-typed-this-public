import type { RecorderEvent } from '@features/recorder/types';
import type { SessionAnalysis, TimelineSegment, BurstStat, PasteInsight, ProcessProductPoint } from './types';

const MICRO_PAUSE_MS = 200;
const MACRO_PAUSE_MS = 2000;
const MIN_EVENT_DURATION = 16;
const IDLE_GAP_THRESHOLD_MS = 4000;
const COMPRESSED_GAP_DURATION_MS = 600;
const PRODUCT_PROCESS_LOW_THRESHOLD = 1.05;
const PRODUCT_PROCESS_STRONG_THRESHOLD = 1.25;
const PRODUCT_PROCESS_MAX = 2;

const PAUSE_BUCKETS = [
  { key: 'lt-200', label: '<200 ms', min: 0, max: MICRO_PAUSE_MS },
  { key: '200-1000', label: '200 ms - 1 s', min: MICRO_PAUSE_MS, max: 1000 },
  { key: '1000-2000', label: '1 s - 2 s', min: 1000, max: MACRO_PAUSE_MS },
  { key: 'gt-2000', label: '>2 s', min: MACRO_PAUSE_MS, max: Number.POSITIVE_INFINITY },
] as const;

type PauseBucketKey = (typeof PAUSE_BUCKETS)[number]['key'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const textFromHTML = (html: string) => {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ');
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? '';
};

const wordCount = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

type AnalyzerContext = {
  segments: TimelineSegment[];
  bursts: BurstStat[];
  currentBurst: BurstStat | null;
  producedChars: number;
  deletedChars: number;
  textInputCount: number;
  deleteCount: number;
  pasteCount: number;
  suspiciousPasteCount: number;
  macroPauseCount: number;
  macroPauseTotal: number;
  lastTimestamp: number | null;
  pauseBuckets: Record<PauseBucketKey, number>;
};

const initContext = (): AnalyzerContext => ({
  segments: [],
  bursts: [],
  currentBurst: null,
  producedChars: 0,
  deletedChars: 0,
  textInputCount: 0,
  deleteCount: 0,
  pasteCount: 0,
  suspiciousPasteCount: 0,
  macroPauseCount: 0,
  macroPauseTotal: 0,
  lastTimestamp: null,
  pauseBuckets: PAUSE_BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket.key] = 0;
      return acc;
    },
    {} as Record<PauseBucketKey, number>
  ),
});

const finalizeBurst = (ctx: AnalyzerContext) => {
  if (ctx.currentBurst) {
    ctx.bursts.push({ ...ctx.currentBurst });
    ctx.currentBurst = null;
  }
};

const pushSegment = (
  ctx: AnalyzerContext,
  segment: Omit<TimelineSegment, 'id'>,
) => {
  ctx.segments.push({
    id: `${segment.type}-${ctx.segments.length + 1}`,
    ...segment,
  });
};

export const analyzeSession = (events: RecorderEvent[], finalHtml: string): SessionAnalysis => {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const shouldSkipEvent = (event: RecorderEvent) => {
    if (
      event.source === 'transaction' &&
      (event.type === 'text-input' || event.type === 'delete') &&
      event.meta.correlatedDomEventId
    ) {
      return true;
    }
    if (event.source === 'dom' && event.type === 'paste') {
      return true;
    }
    return false;
  };
  const analyzableEvents = sortedEvents.filter((event) => !shouldSkipEvent(event));
  const ctx = initContext();
  const pasteLog: PasteInsight[] = [];
  const processProductTimeline: ProcessProductPoint[] = [];
  const sessionStart = analyzableEvents[0]?.timestamp ?? 0;
  let timelineElapsed = 0;
  let processArea = 0;
  let productArea = 0;

  let previousDocSize: number | null = null;

  analyzableEvents.forEach((event, index) => {
    if (
      event.source === 'transaction' &&
      (event.type === 'text-input' || event.type === 'delete') &&
      event.meta.correlatedDomEventId
    ) {
      return;
    }
    if (event.source === 'dom' && event.type === 'paste') {
      return;
    }
    const duration = Math.max(event.meta.durationMs ?? MIN_EVENT_DURATION, MIN_EVENT_DURATION);
    const start = event.timestamp;
    const end = event.timestamp + duration;

    if (ctx.lastTimestamp != null) {
      const delta = start - ctx.lastTimestamp;
      if (delta >= MICRO_PAUSE_MS) {
        const severity = delta >= MACRO_PAUSE_MS ? 'macro' : 'micro';
        const bucket = PAUSE_BUCKETS.find((candidate) => delta >= candidate.min && delta < candidate.max);
        if (bucket) {
          ctx.pauseBuckets[bucket.key] += 1;
        }
        pushSegment(ctx, {
          type: 'pause',
          label: severity === 'macro' ? 'Macro pause' : 'Pause',
          start: ctx.lastTimestamp,
          end: start,
          durationMs: delta,
          severity,
        });
        if (severity === 'macro') {
          ctx.macroPauseCount += 1;
          ctx.macroPauseTotal += delta;
          finalizeBurst(ctx);
        }
      }
    }

    const domData = event.meta.domInput?.data ?? '';
    const pastePayload = event.meta.pastePayload;
    const deltaSinceLastEvent = ctx.lastTimestamp != null ? start - ctx.lastTimestamp : 0;
    const docSizeBefore = previousDocSize ?? event.meta.docSize;
    const docSizeAfter = event.meta.docSize;
    const producedDelta = Math.max(0, docSizeAfter - docSizeBefore);
    const deletedDelta = Math.max(0, docSizeBefore - docSizeAfter);
    const domText = typeof domData === 'string' ? domData : '';
    const domTextLength = domText.length;

    if (event.type === 'text-input') {
      ctx.textInputCount += 1;
      const charCount = domTextLength > 0 ? domTextLength : Math.max(1, producedDelta);
      ctx.producedChars += charCount;
      if (!ctx.currentBurst) {
        ctx.currentBurst = {
          start,
          end,
          durationMs: duration,
          charCount: 0,
          eventCount: 0,
        };
      }
      ctx.currentBurst.end = end;
      ctx.currentBurst.durationMs += duration;
      ctx.currentBurst.charCount += charCount;
      ctx.currentBurst.eventCount += 1;
      pushSegment(ctx, {
        type: 'typing',
        label: 'Typing',
        start,
        end,
        durationMs: duration,
        metadata: { charCount },
      });
    } else if (event.type === 'delete') {
      ctx.deleteCount += 1;
      const deleted = domTextLength > 0 ? domTextLength : Math.max(1, deletedDelta);
      ctx.deletedChars += deleted;
      finalizeBurst(ctx);
      pushSegment(ctx, {
        type: 'revision',
        label: 'Revision',
        start,
        end,
        durationMs: duration,
        metadata: { deleted },
      });
    } else if (event.type === 'paste') {
      const domText = typeof domData === 'string' ? domData : '';
      const payloadText = (pastePayload?.text ?? domText ?? pastePayload?.preview ?? '') || '';
      const payloadLength = pastePayload?.length ?? (typeof payloadText === 'string' ? payloadText.length : domText.length) ?? 0;
      ctx.pasteCount += 1;
      ctx.producedChars += payloadLength;
      finalizeBurst(ctx);
      const ledgerMatch = pastePayload?.source === 'ledger';
      const suspicious =
        !ledgerMatch &&
        (payloadLength >= 64 ||
          deltaSinceLastEvent >= 5000 ||
          (payloadLength >= 24 && deltaSinceLastEvent >= 3000));
      if (suspicious) {
        ctx.suspiciousPasteCount += 1;
      }
      const classification: PasteInsight['classification'] = ledgerMatch ? 'internal-copy' : 'unmatched';
      const label = ledgerMatch ? 'Internal paste' : suspicious ? 'Unmatched paste' : 'Paste';
      const ledgerInfo = ledgerMatch
        ? {
            copyEventId: pastePayload?.matchedCopyId,
            ageMs: pastePayload?.ledgerAgeMs,
          }
        : undefined;
      pasteLog.push({
        id: event.id,
        timestamp: event.timestamp,
        label,
        payloadText,
        payloadLength,
        classification,
        idleBeforeMs: deltaSinceLastEvent,
        ledgerMatch: ledgerInfo,
      });
      pushSegment(ctx, {
        type: 'paste',
        label,
        start,
        end,
        durationMs: duration,
        metadata: {
          payloadLength,
          idleBeforeMs: deltaSinceLastEvent,
          classification,
          ledgerMatch: ledgerInfo,
        },
      });
    } else if (event.type === 'selection-change') {
      // no-op for now, but ensures burst resets between selection moves if needed
      finalizeBurst(ctx);
    } else {
      finalizeBurst(ctx);
    }

    const documentChars = textFromHTML(event.meta.html ?? '').length;
    const point = {
      timestamp: event.timestamp,
      elapsedMs: timelineElapsed,
      producedChars: ctx.producedChars,
      documentChars,
    };
    const previousPoint = processProductTimeline[processProductTimeline.length - 1];
    if (previousPoint) {
      const avgProduced = (previousPoint.producedChars + point.producedChars) / 2;
      const avgDocument = (previousPoint.documentChars + point.documentChars) / 2;
      const deltaSeconds = Math.max(point.elapsedMs - previousPoint.elapsedMs, 0) / 1000;
      processArea += avgProduced * deltaSeconds;
      productArea += avgDocument * deltaSeconds;
    }
    processProductTimeline.push(point);

    ctx.lastTimestamp = end;
    previousDocSize = event.meta.docSize;

    const nextEvent = analyzableEvents[index + 1];
    const rawGap = nextEvent ? Math.max(nextEvent.timestamp - event.timestamp, MIN_EVENT_DURATION) : MIN_EVENT_DURATION;
    const timelineAdvance = rawGap > IDLE_GAP_THRESHOLD_MS ? COMPRESSED_GAP_DURATION_MS : rawGap;
    timelineElapsed += timelineAdvance;
  });

  finalizeBurst(ctx);

  const plainText = typeof document !== 'undefined' ? textFromHTML(finalHtml) : finalHtml.replace(/<[^>]+>/g, ' ');
  const finalWordCount = wordCount(plainText);
  const finalCharCount = plainText.length;
  const producedChars = ctx.producedChars || finalCharCount;
  const fallbackRatio = finalCharCount ? producedChars / finalCharCount : 0;

  const lastAnalyzableEvent = analyzableEvents[analyzableEvents.length - 1];
  const finalTimelineTimestamp = lastAnalyzableEvent ? lastAnalyzableEvent.timestamp : sessionStart;
  if (!processProductTimeline.length) {
    processProductTimeline.push({
      timestamp: sessionStart,
      elapsedMs: 0,
      producedChars,
      documentChars: finalCharCount,
    });
  } else {
    const syntheticPoint = {
      timestamp: finalTimelineTimestamp,
      elapsedMs: timelineElapsed,
      producedChars,
      documentChars: finalCharCount,
    };
    const lastPoint = processProductTimeline[processProductTimeline.length - 1];
    if (!lastPoint || lastPoint.elapsedMs !== syntheticPoint.elapsedMs) {
      const prevPoint = processProductTimeline[processProductTimeline.length - 1];
      processProductTimeline.push(syntheticPoint);
      if (prevPoint) {
        const avgProduced = (prevPoint.producedChars + syntheticPoint.producedChars) / 2;
        const avgDocument = (prevPoint.documentChars + syntheticPoint.documentChars) / 2;
        const deltaSeconds = Math.max(syntheticPoint.elapsedMs - prevPoint.elapsedMs, 0) / 1000;
        processArea += avgProduced * deltaSeconds;
        productArea += avgDocument * deltaSeconds;
      }
    } else {
      processProductTimeline[processProductTimeline.length - 1] = syntheticPoint;
    }
  }
  const productProcessRatio = productArea > 0 ? processArea / productArea : fallbackRatio;
  const averageMacroPause = ctx.macroPauseCount ? ctx.macroPauseTotal / ctx.macroPauseCount : 0;
  const pauseScore = clamp(averageMacroPause / 4000, 0, 1);
  const revisionScore = ctx.textInputCount ? ctx.deleteCount / ctx.textInputCount : ctx.deleteCount > 0 ? 1 : 0;

  const burstEvents = ctx.bursts.map((burst) => burst.eventCount);
  const burstMean = burstEvents.length ? burstEvents.reduce((a, b) => a + b, 0) / burstEvents.length : 0;
  const burstVariance =
    burstEvents.length && burstMean > 0
      ? Math.sqrt(burstEvents.reduce((sum, val) => sum + Math.pow(val - burstMean, 2), 0) / burstEvents.length) /
        burstMean
      : 0;

  const signals = {
    pauseScore,
    revisionScore,
    burstVariance,
    pasteAnomalyCount: ctx.suspiciousPasteCount,
    productProcessRatio,
  };

  const metricAlerts: Record<string, boolean> = {};
  let risk = 0;
  const reasoning: string[] = [];

  if (ctx.suspiciousPasteCount > 0) {
    risk += 2;
    reasoning.push('Detected unmatched paste segments.');
    metricAlerts.pasteRisk = true;
  }
  if (ctx.textInputCount > 30 && revisionScore < 0.12) {
    risk += 1;
    reasoning.push('Low revision activity relative to typed content.');
    metricAlerts.revisionScore = true;
  }
  if (burstVariance < 0.2 && ctx.bursts.length > 2) {
    risk += 1;
    reasoning.push('Burst pacing is highly uniform.');
    metricAlerts.burstVariance = true;
  }
  if (pauseScore > 0.55 && ctx.macroPauseCount > 0) {
    risk -= 1;
    reasoning.push('Healthy macro pauses observed before bursts.');
  }
  if (productProcessRatio <= PRODUCT_PROCESS_LOW_THRESHOLD && ctx.textInputCount > 10) {
    risk += 1;
    reasoning.push('Process depth is flat—output closely matches what was typed.');
    metricAlerts.productProcess = true;
  } else if (productProcessRatio >= PRODUCT_PROCESS_STRONG_THRESHOLD && ctx.textInputCount > 10) {
    risk -= 1;
    reasoning.push('Process depth indicates iterative drafting.');
  }

  if (!reasoning.length) {
    reasoning.push('Limited signals collected; continue monitoring.');
  }

  let verdict: SessionAnalysis['verdict'] = 'likely-authentic';
  if (risk >= 2) {
    verdict = 'high-risk';
  } else if (risk === 1) {
    verdict = 'needs-review';
  }

  const pauseScoreNormalized = clamp(pauseScore, 0, 1);
  const revisionScoreNormalized = clamp(revisionScore / 0.2, 0, 1);
  const burstVarianceNormalized = clamp(burstVariance / 0.4, 0, 1);
  const pasteScoreNormalized = ctx.pasteCount
    ? clamp(1 - ctx.suspiciousPasteCount / ctx.pasteCount, 0, 1)
    : 1;
  const productProcessNormalized = clamp(
    (productProcessRatio - PRODUCT_PROCESS_LOW_THRESHOLD) / Math.max(PRODUCT_PROCESS_MAX - PRODUCT_PROCESS_LOW_THRESHOLD, 0.0001),
    0,
    1
  );

  const productProcessTrend = productProcessRatio <= PRODUCT_PROCESS_LOW_THRESHOLD
    ? 'negative'
    : productProcessRatio >= PRODUCT_PROCESS_STRONG_THRESHOLD
      ? 'positive'
      : undefined;

  const metricDetailTargets: Record<string, string | undefined> = {
    pauseScore: 'analysis-pause-card',
    pasteRisk: 'analysis-paste-ledger-card',
    productProcess: 'analysis-process-card',
  };

  const baseMetrics = [
    {
      key: 'pauseScore',
      label: 'Pause cadence',
      value: `${Math.round(pauseScore * 100)}%`,
      helperText: `${ctx.macroPauseCount} macro pauses`,
      trend: pauseScoreNormalized >= 0.5 ? 'positive' : undefined,
      description: 'Long pauses before sentences imply live thinking; rote transcription rarely stops.',
      score: pauseScoreNormalized,
    },
    {
      key: 'revisionScore',
      label: 'Revision rate',
      value: `${(revisionScore * 100).toFixed(1)}%`,
      helperText: `${ctx.deleteCount} deletions`,
      trend: revisionScoreNormalized >= 0.6 ? 'positive' : 'negative',
      description: 'Writers who revisit and edit are typically composing, not pasting.',
      score: revisionScoreNormalized,
    },
    {
      key: 'burstVariance',
      label: 'Burst variety',
      value: burstVariance.toFixed(2),
      helperText: `${ctx.bursts.length} bursts analysed`,
      description: 'Authentic sessions vary in rhythm; uniform bursts suggest copying from another source.',
      score: burstVarianceNormalized,
    },
    {
      key: 'pasteRisk',
      label: 'Paste cleanliness',
      value: ctx.pasteCount ? `${ctx.pasteCount - ctx.suspiciousPasteCount}/${ctx.pasteCount}` : 'No pastes',
      helperText: ctx.pasteCount ? 'Clean vs. suspicious payloads' : 'No paste activity',
      trend: pasteScoreNormalized >= 0.8 ? 'positive' : ctx.suspiciousPasteCount ? 'negative' : undefined,
      description: 'Unmatched or idle pastes often mean imported text—double-check them.',
      score: pasteScoreNormalized,
    },
    {
      key: 'productProcess',
      label: 'Process depth',
      value: productProcessRatio.toFixed(2),
      helperText: `${finalWordCount} final words`,
      description: `Ratios above ${PRODUCT_PROCESS_LOW_THRESHOLD.toFixed(2)} mean the student typed more than what survived, which signals drafting. Anything near that threshold is flagged.`,
      score: productProcessNormalized,
      trend: productProcessTrend,
    },
  ];
  const metrics = baseMetrics.map((metric) => ({
    ...metric,
    alert: metricAlerts[metric.key] ?? false,
    detailTarget: metricDetailTargets[metric.key],
  }));

  const pauseHistogram = PAUSE_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    rangeMs: {
      min: bucket.min,
      ...(Number.isFinite(bucket.max) ? { max: bucket.max } : {}),
    },
    count: ctx.pauseBuckets[bucket.key] ?? 0,
  }));

  return {
    segments: ctx.segments,
    bursts: ctx.bursts,
    metrics,
    pauseHistogram,
    signals,
    verdict,
    verdictReasoning: reasoning,
    pastes: pasteLog,
    processProductTimeline,
  };
};

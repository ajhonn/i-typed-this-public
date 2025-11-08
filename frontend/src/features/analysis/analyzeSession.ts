import type { RecorderEvent } from '@features/recorder/types';
import type { SessionAnalysis, TimelineSegment, BurstStat, PasteInsight } from './types';

const MICRO_PAUSE_MS = 200;
const MACRO_PAUSE_MS = 2000;
const MIN_EVENT_DURATION = 16;

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
  const ctx = initContext();
  const pasteLog: PasteInsight[] = [];

  sortedEvents.forEach((event) => {
    const duration = Math.max(event.meta.durationMs ?? MIN_EVENT_DURATION, MIN_EVENT_DURATION);
    const start = event.timestamp;
    const end = event.timestamp + duration;

    if (ctx.lastTimestamp != null) {
      const delta = start - ctx.lastTimestamp;
      if (delta >= MICRO_PAUSE_MS) {
        const severity = delta >= MACRO_PAUSE_MS ? 'macro' : 'micro';
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

    if (event.type === 'text-input') {
      ctx.textInputCount += 1;
      ctx.producedChars += domData.length || 1;
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
      ctx.currentBurst.charCount += domData.length || 1;
      ctx.currentBurst.eventCount += 1;
      pushSegment(ctx, {
        type: 'typing',
        label: 'Typing',
        start,
        end,
        durationMs: duration,
        metadata: { charCount: domData.length || 1 },
      });
    } else if (event.type === 'delete') {
      ctx.deleteCount += 1;
      ctx.deletedChars += domData.length || 1;
      finalizeBurst(ctx);
      pushSegment(ctx, {
        type: 'revision',
        label: 'Revision',
        start,
        end,
        durationMs: duration,
        metadata: { deleted: domData.length || 1 },
      });
    } else if (event.type === 'paste') {
      const payloadLength = pastePayload?.length ?? domData.length ?? 0;
      const payloadPreview = pastePayload?.preview ?? domData ?? '';
      ctx.pasteCount += 1;
      ctx.producedChars += payloadLength;
      finalizeBurst(ctx);
      const suspicious =
        payloadLength >= 64 ||
        deltaSinceLastEvent >= 5000 ||
        (payloadLength >= 24 && deltaSinceLastEvent >= 3000);
      if (suspicious) {
        ctx.suspiciousPasteCount += 1;
      }
      pasteLog.push({
        id: event.id,
        timestamp: event.timestamp,
        label: suspicious ? 'Unmatched paste' : 'Paste',
        payloadPreview: payloadPreview.slice(0, 160).replace(/\s+/g, ' '),
        payloadLength,
        classification: suspicious ? 'unmatched' : 'likely-internal',
        idleBeforeMs: deltaSinceLastEvent,
      });
      pushSegment(ctx, {
        type: 'paste',
        label: suspicious ? 'Unmatched paste' : 'Paste',
        start,
        end,
        durationMs: duration,
        metadata: {
          payloadLength,
          idleBeforeMs: deltaSinceLastEvent,
          classification: suspicious ? 'unmatched' : 'likely-internal',
        },
      });
    } else if (event.type === 'selection-change') {
      // no-op for now, but ensures burst resets between selection moves if needed
      finalizeBurst(ctx);
    } else {
      finalizeBurst(ctx);
    }

    ctx.lastTimestamp = end;
  });

  finalizeBurst(ctx);

  const plainText = typeof document !== 'undefined' ? textFromHTML(finalHtml) : finalHtml.replace(/<[^>]+>/g, ' ');
  const finalWordCount = wordCount(plainText);
  const finalCharCount = plainText.length;
  const producedChars = ctx.producedChars || finalCharCount;
  const productProcessRatio = finalCharCount ? producedChars / finalCharCount : 0;
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

  let risk = 0;
  const reasoning: string[] = [];

  if (ctx.suspiciousPasteCount > 0) {
    risk += 2;
    reasoning.push('Detected unmatched paste segments.');
  }
  if (ctx.textInputCount > 30 && revisionScore < 0.12) {
    risk += 1;
    reasoning.push('Low revision activity relative to typed content.');
  }
  if (burstVariance < 0.2 && ctx.bursts.length > 2) {
    risk += 1;
    reasoning.push('Burst pacing is highly uniform.');
  }
  if (pauseScore > 0.55 && ctx.macroPauseCount > 0) {
    risk -= 1;
    reasoning.push('Healthy macro pauses observed before bursts.');
  }
  if (productProcessRatio < 0.8 && ctx.textInputCount > 20) {
    risk -= 1;
    reasoning.push('Product-process ratio suggests authentic drafting.');
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
  const productProcessNormalized = clamp(1 - Math.min(productProcessRatio, 1), 0, 1);

  const metrics = [
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
      description: 'Lower ratios mean the student typed more than what survived, which signals drafting.',
      score: productProcessNormalized,
    },
  ];

  return {
    segments: ctx.segments,
    bursts: ctx.bursts,
    metrics,
    signals,
    verdict,
    verdictReasoning: reasoning,
    pastes: pasteLog,
  };
};

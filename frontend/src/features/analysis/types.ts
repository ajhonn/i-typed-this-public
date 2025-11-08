export type TimelineSegmentType = 'typing' | 'revision' | 'pause' | 'paste';

export type TimelineSegment = {
  id: string;
  type: TimelineSegmentType;
  label: string;
  start: number;
  end: number;
  durationMs: number;
  severity?: 'micro' | 'macro';
  metadata?: Record<string, unknown>;
};

export type BurstStat = {
  start: number;
  end: number;
  durationMs: number;
  charCount: number;
  eventCount: number;
};

export type SummaryMetric = {
  key: string;
  label: string;
  value: string;
  description: string;
  score: number;
  trend?: 'positive' | 'negative';
  helperText?: string;
};

export type AnalysisSignals = {
  pauseScore: number;
  revisionScore: number;
  burstVariance: number;
  pasteAnomalyCount: number;
  productProcessRatio: number;
};

export type AnalysisVerdict = 'likely-authentic' | 'needs-review' | 'high-risk';

export type PasteInsight = {
  id: string;
  timestamp: number;
  label: string;
  payloadPreview: string;
  payloadLength: number;
  classification: 'likely-internal' | 'unmatched';
  idleBeforeMs: number;
};

export type SessionAnalysis = {
  segments: TimelineSegment[];
  bursts: BurstStat[];
  metrics: SummaryMetric[];
  signals: AnalysisSignals;
  verdict: AnalysisVerdict;
  verdictReasoning: string[];
  pastes: PasteInsight[];
};

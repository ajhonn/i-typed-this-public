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

export type RevisionSummary = {
  revisionRate: number;
  textInputs: number;
  deletions: number;
  producedChars: number;
  deletedChars: number;
};

export type BurstSummary = {
  totalBursts: number;
  averageEventsPerBurst: number;
  averageCharsPerBurst: number;
  averageDurationMs: number;
  variance: number;
  longestBurstDurationMs: number;
  longestBurstChars: number;
};

export type SummaryMetric = {
  key: string;
  label: string;
  value: string;
  description: string;
  score: number;
  trend?: 'positive' | 'negative';
  helperText?: string;
  alert?: boolean;
  detailTarget?: string;
};

export type AnalysisSignals = {
  pauseScore: number;
  revisionScore: number;
  burstVariance: number;
  pasteAnomalyCount: number;
  productProcessRatio: number;
};

export type AnalysisVerdict = 'likely-authentic' | 'needs-review' | 'high-risk';

export type PauseHistogramBin = {
  key: string;
  label: string;
  rangeMs: {
    min: number;
    max?: number;
  };
  count: number;
};

export type PasteInsight = {
  id: string;
  timestamp: number;
  label: string;
  payloadText: string;
  payloadLength: number;
  classification: 'internal-copy' | 'unmatched';
  idleBeforeMs: number;
  ledgerMatch?: {
    copyEventId?: string;
    ageMs?: number;
  };
};

export type ProcessProductPoint = {
  timestamp: number;
  elapsedMs: number;
  producedChars: number;
  documentChars: number;
};

export type SessionAnalysis = {
  segments: TimelineSegment[];
  bursts: BurstStat[];
  metrics: SummaryMetric[];
  pauseHistogram: PauseHistogramBin[];
  signals: AnalysisSignals;
  verdict: AnalysisVerdict;
  verdictReasoning: string[];
  pastes: PasteInsight[];
  processProductTimeline: ProcessProductPoint[];
  revisionSummary: RevisionSummary;
  burstSummary: BurstSummary;
};

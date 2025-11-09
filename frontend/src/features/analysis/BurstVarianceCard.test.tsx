import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BurstVarianceCard from './BurstVarianceCard';
import type { SessionAnalysis } from './types';
import { useSessionAnalysis } from './useSessionAnalysis';

vi.mock('./useSessionAnalysis', () => ({
  useSessionAnalysis: vi.fn(),
}));

const baseAnalysis: SessionAnalysis = {
  segments: [],
  bursts: [],
  metrics: [],
  pauseHistogram: [],
  processProductTimeline: [],
  signals: {
    pauseScore: 0,
    revisionScore: 0,
    burstVariance: 0.5,
    pasteAnomalyCount: 0,
    productProcessRatio: 0,
  },
  verdict: 'likely-authentic',
  verdictReasoning: [],
  pastes: [],
  revisionSummary: {
    revisionRate: 0,
    textInputs: 0,
    deletions: 0,
    producedChars: 0,
    deletedChars: 0,
  },
  burstSummary: {
    totalBursts: 3,
    averageEventsPerBurst: 4,
    averageCharsPerBurst: 90,
    averageDurationMs: 800,
    variance: 0.5,
    longestBurstDurationMs: 1200,
    longestBurstChars: 150,
  },
};

const mockUseSessionAnalysis = useSessionAnalysis as unknown as vi.Mock;

describe('BurstVarianceCard', () => {
  beforeEach(() => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      bursts: [
        { start: 0, end: 200, durationMs: 200, charCount: 40, eventCount: 3 },
        { start: 200, end: 600, durationMs: 400, charCount: 80, eventCount: 5 },
        { start: 600, end: 1400, durationMs: 800, charCount: 120, eventCount: 6 },
      ],
    });
  });

  it('renders burst stats and recent bursts list', () => {
    render(<BurstVarianceCard />);

    expect(screen.getByTestId('burst-variance-card')).toBeInTheDocument();
    expect(screen.getByText(/Rhythm map/i)).toBeVisible();
    expect(screen.getByText('0.50')).toBeVisible();
    expect(screen.getByText(/Burst scatter/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg events\/burst/i).nextSibling?.textContent).toBe('4.0');
    expect(screen.getByTestId('burst-scatter-plot')).toBeInTheDocument();
  });

  it('shows fallback when no bursts exist', () => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      burstSummary: { ...baseAnalysis.burstSummary, totalBursts: 0, variance: 0 },
      bursts: [],
    });

    render(<BurstVarianceCard />);
    expect(
      screen.getByText(/We need a few typing bursts before we can chart variance/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('burst-scatter-plot')).not.toBeInTheDocument();
  });
});

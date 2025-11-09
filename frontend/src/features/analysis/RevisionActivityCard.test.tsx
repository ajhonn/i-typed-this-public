import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import RevisionActivityCard from './RevisionActivityCard';
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
    burstVariance: 0,
    pasteAnomalyCount: 0,
    productProcessRatio: 0,
  },
  verdict: 'likely-authentic',
  verdictReasoning: [],
  pastes: [],
  revisionSummary: {
    revisionRate: 0.42,
    textInputs: 10,
    deletions: 4,
    producedChars: 500,
    deletedChars: 120,
  },
  burstSummary: {
    totalBursts: 0,
    averageEventsPerBurst: 0,
    averageCharsPerBurst: 0,
    averageDurationMs: 0,
    variance: 0,
    longestBurstDurationMs: 0,
    longestBurstChars: 0,
  },
};

const mockUseSessionAnalysis = useSessionAnalysis as unknown as vi.Mock;

describe('RevisionActivityCard', () => {
  beforeEach(() => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      segments: [
        { id: 'typing-1', type: 'typing', label: 'Typing', start: 0, end: 200, durationMs: 200 },
        { id: 'revision-1', type: 'revision', label: 'Revision', start: 200, end: 320, durationMs: 120 },
        { id: 'typing-2', type: 'typing', label: 'Typing', start: 320, end: 640, durationMs: 320 },
      ],
    });
  });

  it('shows revision score and metrics', () => {
    render(<RevisionActivityCard />);

    expect(screen.getByTestId('revision-activity-card')).toBeInTheDocument();
    expect(screen.getByText(/Editing cadence/i)).toBeVisible();
    expect(screen.getByText('42.0%')).toBeVisible();
    const metrics = screen.getByTestId('revision-metrics');
    expect(within(metrics).getByText(/Text inputs/i).nextElementSibling?.textContent).toBe('10');
    expect(within(metrics).getByText(/Deletions/i).nextElementSibling?.textContent).toBe('4');
  });

  it('renders fallback copy when no timeline exists', () => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      segments: [],
    });
    render(<RevisionActivityCard />);

    expect(
      screen.getByText(/Not enough revision data captured in this session/i)
    ).toBeInTheDocument();
  });
});

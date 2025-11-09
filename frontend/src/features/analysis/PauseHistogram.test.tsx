import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PauseHistogram from './PauseHistogram';
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
};

const mockUseSessionAnalysis = useSessionAnalysis as unknown as vi.Mock;

describe('PauseHistogram', () => {
  beforeEach(() => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      pauseHistogram: [
        { key: 'lt-200', label: '<200 ms', rangeMs: { min: 0, max: 200 }, count: 1 },
        { key: '200-1000', label: '200 ms - 1 s', rangeMs: { min: 200, max: 1000 }, count: 3 },
        { key: '1000-2000', label: '1 s - 2 s', rangeMs: { min: 1000, max: 2000 }, count: 0 },
        { key: 'gt-2000', label: '>2 s', rangeMs: { min: 2000 }, count: 2 },
      ],
    });
  });

  it('renders histogram bars with counts and ranges', () => {
    render(<PauseHistogram />);
    expect(screen.getByTestId('pause-histogram')).toBeInTheDocument();
    expect(screen.getByText('Distribution of observed pauses')).toBeVisible();
    expect(screen.getByRole('img', { name: /histogram/i })).toBeInTheDocument();
    expect(screen.getByText(/Macro pauses/i)).toBeInTheDocument();
  });

  it('shows fallback copy when no pauses are present', () => {
    mockUseSessionAnalysis.mockReturnValue({
      ...baseAnalysis,
      pauseHistogram: [
        { key: 'lt-200', label: '<200 ms', rangeMs: { min: 0, max: 200 }, count: 0 },
        { key: '200-1000', label: '200 ms - 1 s', rangeMs: { min: 200, max: 1000 }, count: 0 },
        { key: '1000-2000', label: '1 s - 2 s', rangeMs: { min: 1000, max: 2000 }, count: 0 },
        { key: 'gt-2000', label: '>2 s', rangeMs: { min: 2000 }, count: 0 },
      ],
    });

    render(<PauseHistogram />);
    expect(
      screen.getByText(/We haven't recorded pauses beyond the 200 ms micro-threshold yet/i)
    ).toBeInTheDocument();
  });
});

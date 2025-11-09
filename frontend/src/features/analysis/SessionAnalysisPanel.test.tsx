import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import SessionAnalysisPanel from './SessionAnalysisPanel';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const SeedAnalysis = () => {
  const { appendEvent, setEditorHTML } = useSession();

  useEffect(() => {
    setEditorHTML('<p>Hello world</p>');
    appendEvent({
      id: 'evt-1',
      type: 'text-input',
      source: 'dom',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 5, to: 5 },
        docChanged: true,
        html: '<p>Hello</p>',
        domInput: { inputType: 'insertText', data: 'Hello' },
      },
    });
    appendEvent({
      id: 'evt-2',
      type: 'paste',
      source: 'dom',
      timestamp: 6000,
      meta: {
        docSize: 11,
        stepTypes: [],
        selection: { from: 11, to: 11 },
        docChanged: true,
        html: '<p>Hello world</p>',
        domInput: { inputType: 'insertFromPaste', data: ' world' },
      },
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

describe('SessionAnalysisPanel', () => {
  it('renders analysis verdict and metrics', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <SeedAnalysis />
          <SessionAnalysisPanel />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('session-analysis')).toBeInTheDocument();
    });
    expect(screen.getByTestId('signals-radar')).toBeInTheDocument();
    expect(screen.getByText(/Authorship signals/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Paste cleanliness/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Paste ledger/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open analysis workspace/i })).toHaveAttribute('href', '/analysis');
  });
});

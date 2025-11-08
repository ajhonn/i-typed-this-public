import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import PlaybackToolbar from './PlaybackToolbar';
import { PlaybackProvider } from './PlaybackControllerContext';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const SeedPlayback = () => {
  const { appendEvent } = useSession();

  useEffect(() => {
    appendEvent({
      id: 'evt-1',
      type: 'selection-change',
      source: 'transaction',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 0, to: 0 },
        docChanged: true,
        html: '<p>hello</p>',
      },
    });
    appendEvent({
      id: 'evt-2',
      type: 'transaction',
      source: 'transaction',
      timestamp: 200,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 5, to: 5 },
        docChanged: true,
        html: '<p>hello world</p>',
      },
    });
  }, [appendEvent]);

  return null;
};

const IdleGapPlayback = () => {
  const { appendEvent } = useSession();

  useEffect(() => {
    appendEvent({
      id: 'evt-1',
      type: 'selection-change',
      source: 'transaction',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 0, to: 0 },
        docChanged: true,
        html: '<p>hello</p>',
      },
    });
    appendEvent({
      id: 'evt-2',
      type: 'transaction',
      source: 'transaction',
      timestamp: 7000,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 5, to: 5 },
        docChanged: true,
        html: '<p>hello world</p>',
      },
    });
  }, [appendEvent]);

  return null;
};

describe('PlaybackToolbar', () => {
  it('renders playback controls inside the ribbon', async () => {
    render(
      <SessionProvider>
        <PlaybackProvider>
          <SeedPlayback />
          <PlaybackToolbar />
        </PlaybackProvider>
      </SessionProvider>
    );

    expect(await screen.findByRole('button', { name: /Play/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Playback speed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download session JSON/i })).toBeInTheDocument();
  });

  it('highlights skipped idle gaps when present', async () => {
    render(
      <SessionProvider>
        <PlaybackProvider>
          <IdleGapPlayback />
          <PlaybackToolbar />
        </PlaybackProvider>
      </SessionProvider>
    );

    expect(await screen.findByText(/Skipped 6.4s idle/i)).toBeInTheDocument();
  });
});

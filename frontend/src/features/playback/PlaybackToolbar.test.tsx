import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
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
      <MemoryRouter>
        <SessionProvider>
          <PlaybackProvider>
            <SeedPlayback />
            <PlaybackToolbar />
          </PlaybackProvider>
        </SessionProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: /^Play$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Playback speed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download session zip/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload session zip/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle playback settings/i })).toBeInTheDocument();
    const timeline = await screen.findByTestId('playback-timeline');
    expect(timeline).toBeInTheDocument();
    expect(screen.getByLabelText(/Timeline legend/i)).toHaveTextContent(/Typing/i);
    expect(screen.getByLabelText(/Timeline overview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByLabelText('Pan timeline left')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan timeline right')).toBeInTheDocument();
  });

  it('highlights skipped idle gaps when present', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <PlaybackProvider>
            <IdleGapPlayback />
            <PlaybackToolbar />
          </PlaybackProvider>
        </SessionProvider>
      </MemoryRouter>
    );

    expect(await screen.findAllByTitle(/Idle gap boundary/i)).toHaveLength(1);
  });
});

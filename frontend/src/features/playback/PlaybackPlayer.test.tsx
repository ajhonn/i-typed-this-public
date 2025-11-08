import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '@features/session/SessionProvider';
import PlaybackPlayer from './PlaybackPlayer';
import { PlaybackProvider } from './PlaybackControllerContext';

const SeedPlayback = () => {
  const { appendEvent } = useSession();

  useEffect(() => {
    appendEvent({
      id: 'evt-1',
      type: 'text-input',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 0, to: 0 },
        docChanged: true,
        html: '<p>hello</p>',
      },
    });
  }, [appendEvent]);

  return null;
};

describe('PlaybackPlayer', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('renders the playback editor surface', async () => {
    render(
      <SessionProvider>
        <PlaybackProvider>
          <SeedPlayback />
          <PlaybackPlayer />
        </PlaybackProvider>
      </SessionProvider>
    );

    expect(await screen.findByTestId('playback-editor')).toBeInTheDocument();
  });

  it('renders the playback cursor overlay', async () => {
    render(
      <SessionProvider>
        <PlaybackProvider>
          <SeedPlayback />
          <PlaybackPlayer />
        </PlaybackProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('.playback-frame .animate-pulse')).not.toBeNull();
    });
  });
});

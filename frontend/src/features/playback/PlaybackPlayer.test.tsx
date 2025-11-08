import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '@features/session/SessionProvider';
import PlaybackPlayer from './PlaybackPlayer';

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
  it('renders slider and controls', async () => {
    render(
      <SessionProvider>
        <SeedPlayback />
        <PlaybackPlayer />
      </SessionProvider>
    );

    expect(await screen.findByText(/Playback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Playback speed/i)).toBeInTheDocument();
  });

  it('renders the playback cursor overlay', async () => {
    render(
      <SessionProvider>
        <SeedPlayback />
        <PlaybackPlayer />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('.playback-frame .animate-pulse')).not.toBeNull();
    });
  });
});

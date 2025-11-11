import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import PlaybackUploadPrompt from './PlaybackUploadPrompt';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const ProviderWrapper = ({ children }: { children?: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe('PlaybackUploadPrompt', () => {
  it('renders when there are no session events', () => {
    render(
      <ProviderWrapper>
        <PlaybackUploadPrompt />
      </ProviderWrapper>
    );

    expect(screen.getByTestId('playback-upload-prompt')).toBeInTheDocument();
    expect(screen.getByText(/Select session zip/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop/i)).toBeInTheDocument();
  });

  it('hides when a session already has events', async () => {
    const SeedEvents = () => {
      const { appendEvent } = useSession();
      useEffect(() => {
        appendEvent({
          id: 'evt-1',
          type: 'text-input',
          source: 'transaction',
          timestamp: 10,
          meta: {
            docSize: 5,
            stepTypes: [],
            selection: { from: 0, to: 0 },
            docChanged: true,
            html: '<p>seed</p>',
          },
        });
      }, [appendEvent]);
      return null;
    };

    render(
      <ProviderWrapper>
        <SeedEvents />
        <PlaybackUploadPrompt />
      </ProviderWrapper>
    );

    await waitFor(() => expect(screen.queryByTestId('playback-upload-prompt')).not.toBeInTheDocument());
  });
});

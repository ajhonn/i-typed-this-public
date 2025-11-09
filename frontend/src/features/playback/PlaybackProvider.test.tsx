import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '@features/session/SessionProvider';
import { PlaybackProvider, usePlaybackController } from './PlaybackControllerContext';

const SeedSession = () => {
  const { appendEvent, setEditorHTML } = useSession();

  useEffect(() => {
    setEditorHTML('<p>Seed</p>');
    appendEvent({
      id: 'seed-1',
      type: 'paste',
      source: 'dom',
      timestamp: 0,
      meta: {
        docSize: 4,
        stepTypes: [],
        selection: { from: 4, to: 4 },
        docChanged: true,
        html: '<p>Seed</p>',
        domInput: { inputType: 'insertText', data: 'Seed' },
      },
    });
    appendEvent({
      id: 'seed-2',
      type: 'paste',
      source: 'dom',
      timestamp: 6000,
      meta: {
        docSize: 8,
        stepTypes: [],
        selection: { from: 8, to: 8 },
        docChanged: true,
        html: '<p>Seed more</p>',
        domInput: { inputType: 'insertFromPaste', data: ' more' },
      },
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

const CurrentTimeProbe = () => {
  const { currentTime } = usePlaybackController();
  return <div data-testid="current-time-probe">{currentTime}</div>;
};

describe('PlaybackProvider', () => {
  it('seeks to provided timestamp on mount', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <SeedSession />
          <PlaybackProvider seekTimestamp={6000}>
            <CurrentTimeProbe />
          </PlaybackProvider>
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-time-probe').textContent).not.toBe('0');
    });
    expect(screen.getByTestId('current-time-probe')).toHaveTextContent('800');
  });
});

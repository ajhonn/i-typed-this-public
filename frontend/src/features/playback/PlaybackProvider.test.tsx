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

const TransactionOnlySession = () => {
  const { appendEvent, setEditorHTML } = useSession();

  useEffect(() => {
    setEditorHTML('<p>Draft</p>');
    appendEvent({
      id: 'txn-1',
      type: 'text-input',
      source: 'transaction',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: ['replace'],
        selection: { from: 5, to: 5 },
        docChanged: true,
        html: '<p>Draft</p>',
      },
    });
    appendEvent({
      id: 'txn-2',
      type: 'delete',
      source: 'transaction',
      timestamp: 2000,
      meta: {
        docSize: 0,
        stepTypes: ['replace'],
        selection: { from: 0, to: 0 },
        docChanged: true,
        html: '<p></p>',
      },
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

const TimelineProbe = () => {
  const { playbackEvents } = usePlaybackController();
  return (
    <ul data-testid="timeline-types">
      {playbackEvents.map((event) => (
        <li key={event.id}>{event.eventType}</li>
      ))}
    </ul>
  );
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

  it('includes transaction delete events when no DOM counterpart exists', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <TransactionOnlySession />
          <PlaybackProvider>
            <TimelineProbe />
          </PlaybackProvider>
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('timeline-types').textContent).toContain('delete');
    });
  });
});

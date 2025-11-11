import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from './SessionProvider';

const SessionConsumer = () => {
  const { session, setEditorHTML, appendEvent, loadSession } = useSession();

  return (
    <div>
      <p data-testid="session-html">{session.editorHTML}</p>
      <button type="button" onClick={() => setEditorHTML('<p>updated</p>')}>
        Update
      </button>
      <button
        type="button"
        onClick={() =>
          appendEvent({
            id: 'evt-1',
            type: 'transaction',
            timestamp: 1,
            meta: {
              docSize: 10,
              stepTypes: [],
              selection: { from: 0, to: 0 },
              docChanged: false,
            },
          })
        }
      >
        Append Event
      </button>
      <button
        type="button"
        onClick={() =>
          loadSession({
            editorHTML: '<p>loaded</p>',
            events: [
              {
                id: 'evt-loaded',
                type: 'transaction',
                timestamp: 99,
                source: 'transaction',
                meta: {
                  docSize: 1,
                  stepTypes: [],
                  selection: { from: 0, to: 0 },
                  docChanged: true,
                  html: '<p>loaded</p>',
                },
              },
            ],
          })
        }
      >
        Load Session
      </button>
      <p data-testid="events-count">{session.events.length}</p>
    </div>
  );
};

describe('SessionProvider', () => {
  it('provides session defaults and allows updates', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>
    );

    expect(screen.getByTestId('session-html')).toHaveTextContent('<p></p>');
    await user.click(screen.getByRole('button', { name: /update/i }));
    expect(screen.getByTestId('session-html')).toHaveTextContent('<p>updated</p>');

    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: /append event/i }));
    expect(screen.getByTestId('events-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: /load session/i }));
    expect(screen.getByTestId('session-html')).toHaveTextContent('<p>loaded</p>');
    expect(screen.getByTestId('events-count')).toHaveTextContent('1');
  });
});

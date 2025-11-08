import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from './SessionProvider';

const SessionConsumer = () => {
  const { session, setEditorHTML } = useSession();

  return (
    <div>
      <p data-testid="session-html">{session.editorHTML}</p>
      <button type="button" onClick={() => setEditorHTML('<p>updated</p>')}>
        Update
      </button>
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
  });
});

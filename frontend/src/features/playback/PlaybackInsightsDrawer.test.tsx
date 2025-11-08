import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import PlaybackInsightsDrawer from './PlaybackInsightsDrawer';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const SeedSession = () => {
  const { appendEvent, setEditorHTML } = useSession();

  useEffect(() => {
    setEditorHTML('<p>Test</p>');
    appendEvent({
      id: 'evt-1',
      type: 'text-input',
      source: 'dom',
      timestamp: 0,
      meta: {
        docSize: 4,
        stepTypes: [],
        selection: { from: 4, to: 4 },
        docChanged: true,
        html: '<p>Test</p>',
        domInput: { inputType: 'insertText', data: 'Test' },
      },
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

describe('PlaybackInsightsDrawer', () => {
  it('toggles visibility of the analysis drawer', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <SeedSession />
        <PlaybackInsightsDrawer />
      </SessionProvider>
    );

    const toggle = await screen.findByRole('button', { name: /hide analysis/i });
    expect(screen.getByTestId('session-analysis')).toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /show analysis/i })).toBeInTheDocument();
  });
});

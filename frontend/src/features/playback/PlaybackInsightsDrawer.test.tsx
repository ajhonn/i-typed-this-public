import { render, screen } from '@testing-library/react';
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
  it('reflects open prop state for the analysis drawer', async () => {
    const { rerender } = render(
      <SessionProvider>
        <SeedSession />
        <PlaybackInsightsDrawer open />
      </SessionProvider>
    );

    const drawer = await screen.findByTestId('playback-insights');
    expect(drawer).toHaveAttribute('aria-hidden', 'false');

    rerender(
      <SessionProvider>
        <SeedSession />
        <PlaybackInsightsDrawer open={false} />
      </SessionProvider>
    );

    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });
});

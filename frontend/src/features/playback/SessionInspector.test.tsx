import { render, screen } from '@testing-library/react';
import { SessionProvider, useSession } from '@features/session/SessionProvider';
import SessionInspector from './SessionInspector';
import { useEffect } from 'react';

const SeedEvents = () => {
  const { appendEvent } = useSession();

  useEffect(() => {
    appendEvent({
      id: 'seed-1',
      type: 'text-input',
      timestamp: 0,
      meta: {
        docSize: 10,
        stepTypes: [],
        selection: { from: 0, to: 0 },
        docChanged: true,
      },
    });
  }, [appendEvent]);

  return null;
};

describe('SessionInspector', () => {
  it('renders event summary', async () => {
    render(
      <SessionProvider>
        <SeedEvents />
        <SessionInspector />
      </SessionProvider>
    );

    const metric = await screen.findByText(/events recorded/i);
    expect(metric).toBeInTheDocument();
    expect(metric.nextElementSibling).toHaveTextContent('1');
  });
});

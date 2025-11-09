import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import PasteLedgerCard from './PasteLedgerCard';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const SeedUnmatchedPaste = () => {
  const { appendEvent, setEditorHTML } = useSession();

  useEffect(() => {
    setEditorHTML('<p>Hello</p>');
    appendEvent({
      id: 'evt-1',
      type: 'text-input',
      source: 'dom',
      timestamp: 0,
      meta: {
        docSize: 5,
        stepTypes: [],
        selection: { from: 5, to: 5 },
        docChanged: true,
        html: '<p>Hello</p>',
        domInput: { inputType: 'insertText', data: 'Hello' },
      },
    });
    [' short', ' much longer suspicious paste body'].forEach((payload, index) => {
      appendEvent({
        id: `evt-paste-${index}`,
        type: 'paste',
        source: 'transaction',
        timestamp: 7000 + index * 200,
        meta: {
          docSize: 25 + payload.length,
          stepTypes: [],
          selection: { from: 25 + payload.length, to: 25 + payload.length },
          docChanged: true,
          html: `<p>Hello${payload}</p>`,
          pastePayload: {
            text: payload,
            length: payload.length,
            preview: payload.slice(0, 40),
            source: 'external',
          },
        },
      });
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

describe('PasteLedgerCard', () => {
  it('renders unmatched paste entries with payload content', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <SeedUnmatchedPaste />
          <PasteLedgerCard />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('paste-ledger-card')).toBeInTheDocument();
    });
    expect(screen.getByText(/Paste ledger/i)).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0].textContent).toMatch(/much longer suspicious paste body/i);
    expect(listItems[1].textContent).toMatch(/short/i);
    const reviewLinks = screen.getAllByRole('link', { name: /review in playback/i });
    expect(reviewLinks[0]).toHaveAttribute('href', expect.stringMatching(/t=\d+/));
  });
});

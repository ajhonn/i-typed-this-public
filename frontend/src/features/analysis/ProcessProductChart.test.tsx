import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useEffect } from 'react';
import ProcessProductChart from './ProcessProductChart';
import { SessionProvider, useSession } from '@features/session/SessionProvider';

const SeedSession = () => {
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
    appendEvent({
      id: 'evt-2',
      type: 'paste',
      source: 'transaction',
      timestamp: 5000,
      meta: {
        docSize: 11,
        stepTypes: [],
        selection: { from: 11, to: 11 },
        docChanged: true,
        html: '<p>Hello world</p>',
        pastePayload: {
          text: ' world',
          length: 6,
          preview: ' world',
          source: 'external',
        },
      },
    });
  }, [appendEvent, setEditorHTML]);

  return null;
};

describe('ProcessProductChart', () => {
  it('renders process vs product ratio when data exists', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <SeedSession />
          <ProcessProductChart />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('process-product-chart')).toBeInTheDocument());
    expect(screen.getByText(/Process vs\. product/i)).toBeInTheDocument();
    expect(screen.getByText(/process \/ product ratio/i)).toBeInTheDocument();
  });
});

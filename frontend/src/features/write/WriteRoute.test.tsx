import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import WriteRoute from './WriteRoute';
import { SessionProvider } from '@features/session/SessionProvider';
import { vi } from 'vitest';

describe('WriteRoute', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the editor surface and controls', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <WriteRoute />,
      },
    ]);

    render(
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    );
    expect(await screen.findByTestId('writer-editor')).toBeInTheDocument();
  });

  it(
    'dismisses the hero modal',
    async () => {
      const router = createMemoryRouter([
        {
          path: '/',
          element: <WriteRoute />,
        },
      ]);

    const user = userEvent.setup();
    render(
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    );
    expect(await screen.findByTestId('hero-modal')).toBeInTheDocument();
    // Advance through the intro deck until the Start writing cta appears.
    while (!screen.queryByRole('button', { name: /start writing/i })) {
      await user.click(screen.getByRole('button', { name: /next/i }));
    }
    await user.click(screen.getByRole('button', { name: /start writing/i }));
    expect(screen.queryByTestId('hero-modal')).not.toBeInTheDocument();
    },
    10000
  );

  it('copies the editor contents when Copy All is pressed', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <WriteRoute />,
      },
    ]);

    const write = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboard = navigator.clipboard;
    const originalWrite = clipboard?.write;
    const originalWriteText = clipboard?.writeText;
    const originalClipboardItem = window.ClipboardItem;
    if (clipboard) {
      clipboard.write = write as typeof clipboard.write;
      clipboard.writeText = writeText as typeof clipboard.writeText;
    }
    class MockClipboardItem {
      constructor(public items: Record<string, Blob>) {
        return this;
      }
    }
    Object.defineProperty(window, 'ClipboardItem', {
      value: MockClipboardItem as typeof ClipboardItem,
      configurable: true,
    });

    const user = userEvent.setup();
    render(
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    );

    const copyButton = await screen.findByRole('button', { name: /copy all/i });
    await waitFor(() => expect(copyButton).toBeEnabled());
    await user.click(copyButton);

    await waitFor(() => expect(write).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: /copied!/i })).toBeInTheDocument();

    if (clipboard) {
      clipboard.write = originalWrite as typeof clipboard.write;
      clipboard.writeText = originalWriteText as typeof clipboard.writeText;
    }
    Object.defineProperty(window, 'ClipboardItem', {
      value: originalClipboardItem,
      configurable: true,
    });
  });
});

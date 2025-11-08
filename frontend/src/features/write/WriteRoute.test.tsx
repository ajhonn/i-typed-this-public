import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import WriteRoute from './WriteRoute';
import { SessionProvider } from '@features/session/SessionProvider';

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
    expect(screen.getByRole('button', { name: /download session json/i })).toBeInTheDocument();
  });

  it('dismisses the hero modal', async () => {
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
    await user.click(screen.getByRole('button', { name: /start writing/i }));
    expect(screen.queryByTestId('hero-modal')).not.toBeInTheDocument();
  });
});

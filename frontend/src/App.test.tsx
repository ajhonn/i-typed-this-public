import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import App from './App';
import { appRoutes } from './routes/AppRouter';
import { ROUTES } from './routes/paths';
import { SessionProvider } from '@features/session/SessionProvider';

describe('App routing', () => {
  it('renders the write route by default', async () => {
    render(<App />);
    expect(await screen.findByTestId('writer-editor')).toBeInTheDocument();
  });

  it('renders the playback placeholder when navigating to /playback', () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.playback],
    });
    render(
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    );

    expect(screen.getByTestId('playback-route')).toBeInTheDocument();
  });

  it('navigates to playback via the ribbon tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: /playback/i }));
    expect(screen.getByTestId('playback-route')).toBeInTheDocument();
  });
});

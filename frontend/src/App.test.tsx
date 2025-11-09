import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import App from './App';
import { appRoutes } from './routes/AppRouter';
import { ROUTES } from './routes/paths';
import { SessionProvider } from '@features/session/SessionProvider';

describe('App routing', () => {
  beforeAll(() => {
    window.scrollTo = vi.fn();
  });

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

    expect(screen.getByTestId('playback-editor')).toBeInTheDocument();
  });

  it('renders the analysis workspace when navigating to /analysis', () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.analysis],
    });
    render(
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    );

    expect(screen.getByTestId('analysis-overview')).toBeInTheDocument();
  });

  it(
    'navigates to playback via the ribbon tab',
    async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(screen.getByRole('link', { name: /playback/i }));
      expect(screen.getByTestId('playback-editor')).toBeInTheDocument();
    },
    10000
  );

  it(
    'navigates to analysis via the ribbon tab',
    async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(screen.getByRole('link', { name: /analysis/i }));
      expect(await screen.findByTestId('analysis-overview')).toBeInTheDocument();
    },
    10000
  );
});

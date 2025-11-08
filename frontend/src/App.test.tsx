import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import App from './App';
import { appRoutes } from './routes/AppRouter';
import { ROUTES } from './routes/paths';

describe('App routing', () => {
  it('renders the write route by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /observe the writing journey/i })).toBeInTheDocument();
  });

  it('renders the playback placeholder when navigating to /playback', () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.playback],
    });
    render(<RouterProvider router={router} />);

    expect(screen.getByTestId('playback-route')).toBeInTheDocument();
  });

  it('navigates to playback via the ribbon tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: /playback/i }));
    expect(screen.getByTestId('playback-route')).toBeInTheDocument();
  });
});

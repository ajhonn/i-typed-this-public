import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    render(
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <RouterProvider router={router} />
      </div>
    );

    expect(screen.getByTestId('playback-route')).toBeInTheDocument();
  });
});

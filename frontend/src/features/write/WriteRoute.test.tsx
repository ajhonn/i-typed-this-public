import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import WriteRoute from './WriteRoute';

describe('WriteRoute', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders primary call to action', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <WriteRoute />,
      },
    ]);

    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /observe the writing journey/i })).toBeInTheDocument();
  });

  it('dismisses the hero modal', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <WriteRoute />,
      },
    ]);

    const user = userEvent.setup();
    render(<RouterProvider router={router} />);
    expect(screen.getByTestId('hero-modal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start writing/i }));
    expect(screen.queryByTestId('hero-modal')).not.toBeInTheDocument();
  });
});

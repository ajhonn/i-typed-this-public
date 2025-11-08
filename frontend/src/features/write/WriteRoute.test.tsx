import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import WriteRoute from './WriteRoute';

describe('WriteRoute', () => {
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
});

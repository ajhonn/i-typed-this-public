import { render, screen } from '@testing-library/react';
import WriteRoute from './WriteRoute';

describe('WriteRoute', () => {
  it('renders primary call to action', () => {
    render(<WriteRoute />);
    expect(screen.getByRole('heading', { name: /observe the writing journey/i })).toBeInTheDocument();
  });
});

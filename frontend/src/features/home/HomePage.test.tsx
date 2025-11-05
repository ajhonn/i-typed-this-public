import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders primary call to action', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /observe the writing journey/i })).toBeInTheDocument();
  });
});

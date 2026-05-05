import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  test('renders the browser app shell', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Recipe Vault' })
    ).toBeInTheDocument();
  });
});

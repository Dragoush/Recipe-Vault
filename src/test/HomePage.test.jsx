import { screen } from '@testing-library/react';
import { renderRoute } from './renderRoute';

describe('Home page', () => {
  test('renders the guest hero and auth calls to action', () => {
    renderRoute('/', { authSession: null });

    expect(
      screen.getByRole('heading', { name: 'Recipe Vault' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Sign in to continue/i })
    ).toHaveAttribute('href', '/login');
    expect(
      screen.getByRole('link', { name: /Create an account/i })
    ).toHaveAttribute('href', '/register');
  });

  test('renders recipe actions for signed-in users', () => {
    renderRoute('/');

    expect(
      screen.getByRole('link', { name: /Explore recipes/i })
    ).toHaveAttribute('href', '/recipes');
    expect(
      screen.getByRole('link', { name: /Add your next recipe/i })
    ).toHaveAttribute('href', '/recipes/new');
  });
});

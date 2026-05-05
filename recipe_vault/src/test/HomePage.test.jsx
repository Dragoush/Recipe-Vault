import { screen } from '@testing-library/react';
import { renderRoute } from './renderRoute';

describe('Home page', () => {
  test('renders the main hero and primary actions', () => {
    renderRoute('/');

    expect(
      screen.getByRole('heading', { name: 'Recipe Vault' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Explore recipes/i })
    ).toHaveAttribute('href', '/recipes');
    expect(
      screen.getByRole('link', { name: /Add your first recipe/i })
    ).toHaveAttribute('href', '/recipes/new');
  });
});

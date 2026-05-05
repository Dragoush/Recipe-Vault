import { screen } from '@testing-library/react';
import { renderRoute } from './renderRoute';

describe('Not found routes', () => {
  test('shows the fallback page for an unknown route', () => {
    renderRoute('/missing');

    expect(
      screen.getByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Go back to recipes/i })
    ).toHaveAttribute('href', '/recipes');
  });

  test('shows the fallback page for a missing recipe detail route', () => {
    renderRoute('/recipes/does-not-exist', {
      initialRecipes: []
    });

    expect(
      screen.getByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
  });

  test('shows the fallback page for a missing recipe edit route', () => {
    renderRoute('/recipes/does-not-exist/edit', {
      initialRecipes: []
    });

    expect(
      screen.getByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import { createMockRecipeSource } from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockRecipeSource = createMockRecipeSource();

describe('Not found routes', () => {
  beforeEach(() => {
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
  });

  afterEach(() => {
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('shows the fallback page for an unknown route', () => {
    renderRoute('/missing');

    expect(
      screen.getByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Go back to recipes/i })
    ).toHaveAttribute('href', '/recipes');
  });

  test('shows the fallback page for a missing recipe detail route', async () => {
    mockRecipeSource.getRecipeById.mockResolvedValue(null);

    renderRoute('/recipes/does-not-exist');

    expect(
      await screen.findByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
  });

  test('shows the fallback page for a missing recipe edit route', async () => {
    mockRecipeSource.getRecipeById.mockResolvedValue(null);

    renderRoute('/recipes/does-not-exist/edit');

    expect(
      await screen.findByRole('heading', { name: 'That page does not exist.' })
    ).toBeInTheDocument();
  });
});

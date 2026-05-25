import { screen } from '@testing-library/react';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import { createMockRecipeSource, createPaginatedRecipesResponse } from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockRecipeSource = createMockRecipeSource();

describe('Auth route guards', () => {
  beforeEach(() => {
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
    mockRecipeSource.listRecipes.mockResolvedValue(
      createPaginatedRecipesResponse([])
    );
  });

  afterEach(() => {
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('redirects guests away from protected recipe routes', async () => {
    renderRoute('/recipes', { authSession: null });

    expect(
      await screen.findByRole('heading', { name: 'Welcome back!' })
    ).toBeInTheDocument();
  });

  test('redirects signed-in users away from auth pages', async () => {
    renderRoute('/login');

    expect(
      await screen.findByRole('heading', { name: 'Recipe collection' })
    ).toBeInTheDocument();
  });
});

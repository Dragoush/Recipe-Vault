import { screen } from '@testing-library/react';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import { setStoredRefreshToken } from '../features/auth/authStorage';
import { createMockAuthApi, createAuthSession } from './mockAuthApi';
import { createMockRecipeSource, createPaginatedRecipesResponse } from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockAuthApi = createMockAuthApi();
const mockRecipeSource = createMockRecipeSource();

describe('AuthProvider bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mockAuthApi).forEach((mock) => mock.mockReset());
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
    mockRecipeSource.listRecipes.mockResolvedValue(
      createPaginatedRecipesResponse([])
    );
  });

  afterEach(() => {
    localStorage.clear();
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('restores a session from a stored refresh token', async () => {
    setStoredRefreshToken('refresh-token');
    mockAuthApi.refresh.mockResolvedValue(
      createAuthSession({
        refreshToken: 'rotated-refresh-token'
      })
    );

    renderRoute('/recipes', {
      authApi: mockAuthApi,
      authSession: null,
      bootstrapOnMount: true
    });

    expect(
      await screen.findByRole('heading', { name: 'Recipe collection' })
    ).toBeInTheDocument();
    expect(mockAuthApi.refresh).toHaveBeenCalledWith('refresh-token');
  });
});

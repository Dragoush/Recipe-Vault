import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import {
  createMockRecipeSource,
  createPaginatedRecipesResponse,
  createRecipe
} from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockRecipeSource = createMockRecipeSource();

describe('Recipes page', () => {
  beforeEach(() => {
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
  });

  afterEach(() => {
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('paginates the table results', async () => {
    const user = userEvent.setup();
    const recipes = Array.from({ length: 5 }, (_, index) => createRecipe(index + 1));

    mockRecipeSource.listRecipes
      .mockResolvedValueOnce(
        createPaginatedRecipesResponse(recipes.slice(0, 4), {
          page: 1,
          pageSize: 4,
          totalItems: 5,
          totalPages: 2
        })
      )
      .mockResolvedValueOnce(
        createPaginatedRecipesResponse(recipes.slice(4), {
          page: 2,
          pageSize: 4,
          totalItems: 5,
          totalPages: 2
        })
      );

    renderRoute('/recipes');

    expect(await screen.findByText('Recipe 1')).toBeInTheDocument();
    expect(screen.getByText('Recipe 4')).toBeInTheDocument();
    expect(screen.queryByText('Recipe 5')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Recipe 5')).toBeInTheDocument();
    expect(screen.queryByText('Recipe 1')).not.toBeInTheDocument();
  });

  test('opens the detail page from the table', async () => {
    const user = userEvent.setup();
    const recipe = createRecipe(1);

    mockRecipeSource.listRecipes.mockResolvedValue(
      createPaginatedRecipesResponse([recipe])
    );
    mockRecipeSource.getRecipeById.mockResolvedValue(recipe);

    renderRoute('/recipes');

    expect(await screen.findByText('Recipe 1')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'View' }));

    expect(
      await screen.findByRole('heading', { name: 'Recipe 1' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ingredient A')).toBeInTheDocument();
  });

  test('keeps a recipe when deletion is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(false);
    const recipe = createRecipe(1);

    mockRecipeSource.listRecipes.mockResolvedValue(
      createPaginatedRecipesResponse([recipe])
    );

    renderRoute('/recipes');

    expect(await screen.findByText('Recipe 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Recipe 1')).toBeInTheDocument();
    expect(mockRecipeSource.deleteRecipe).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('removes a recipe when deletion is confirmed from the table', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);
    const recipe = createRecipe(1);

    mockRecipeSource.listRecipes
      .mockResolvedValueOnce(createPaginatedRecipesResponse([recipe]))
      .mockResolvedValueOnce(createPaginatedRecipesResponse([]));
    mockRecipeSource.deleteRecipe.mockResolvedValue(true);

    renderRoute('/recipes');

    expect(await screen.findByText('Recipe 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByRole('link', { name: 'Add a recipe' })).toHaveAttribute(
      'href',
      '/recipes/new'
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  test('shows a retry panel when the recipes request fails', async () => {
    const user = userEvent.setup();

    mockRecipeSource.listRecipes
      .mockRejectedValueOnce(new Error('The server could not be reached.'))
      .mockResolvedValueOnce(createPaginatedRecipesResponse([createRecipe(1)]));

    renderRoute('/recipes');

    expect(
      await screen.findByRole('heading', { name: "We couldn't load the recipes." })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Recipe 1')).toBeInTheDocument();
  });
});

import { RecipeApiError } from '../features/recipes/recipeApiClient';
import {
  createRecipe,
  deleteRecipe,
  getRecipeById,
  getStatistics,
  listRecipes,
  updateRecipe
} from '../features/recipes/recipeApiSource';
import { toRecipeRequestPayload } from '../features/recipes/recipeFormSchema';

vi.mock('../features/recipes/recipeApiClient', async () => {
  const actual = await vi.importActual('../features/recipes/recipeApiClient');

  return {
    ...actual,
    requestJson: vi.fn()
  };
});

import { requestJson } from '../features/recipes/recipeApiClient';

const validRecipeValues = {
  title: 'Roasted Carrots',
  category: 'Dinner',
  difficulty: 'Easy',
  servings: 4,
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  description: 'Sweet roasted carrots with herbs and a light citrus finish.',
  ingredientLines: 'Carrots\nOlive oil\nParsley',
  instructionLines: 'Prep the carrots.\nRoast until tender.'
};

describe('recipeApiSource', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('lists recipes through the centralized route', async () => {
    requestJson.mockResolvedValue({ items: [] });

    const result = await listRecipes({ page: 3, pageSize: 6 });

    expect(result).toEqual({ items: [] });
    expect(requestJson).toHaveBeenCalledWith('/api/recipes', {
      searchParams: {
        page: 3,
        pageSize: 6
      }
    });
  });

  test('gets a recipe and returns null on 404', async () => {
    requestJson
      .mockResolvedValueOnce({ id: 'recipe-1' })
      .mockRejectedValueOnce(
        new RecipeApiError('Recipe "recipe-2" was not found.', {
          status: 404,
          detail: 'Recipe "recipe-2" was not found.'
        })
      );

    await expect(getRecipeById('recipe-1')).resolves.toEqual({ id: 'recipe-1' });
    await expect(getRecipeById('recipe-2')).resolves.toBeNull();
  });

  test('loads statistics through the centralized route', async () => {
    requestJson.mockResolvedValue({ totalRecipes: 6 });

    await expect(getStatistics()).resolves.toEqual({ totalRecipes: 6 });
    expect(requestJson).toHaveBeenCalledWith('/api/recipes/statistics');
  });

  test('rethrows non-404 get errors', async () => {
    requestJson.mockRejectedValue(new Error('boom'));

    await expect(getRecipeById('recipe-1')).rejects.toThrow('boom');
  });

  test('creates recipes with the transformed request payload', async () => {
    requestJson.mockResolvedValue({ id: 'recipe-1' });

    await createRecipe(validRecipeValues);

    expect(requestJson).toHaveBeenCalledWith('/api/recipes', {
      method: 'POST',
      body: toRecipeRequestPayload(validRecipeValues)
    });
  });

  test('updates recipes and maps 404s to null', async () => {
    requestJson
      .mockResolvedValueOnce({ id: 'recipe-1' })
      .mockRejectedValueOnce(
        new RecipeApiError('Recipe "recipe-1" was not found.', {
          status: 404,
          detail: 'Recipe "recipe-1" was not found.'
        })
      );

    await expect(updateRecipe('recipe-1', validRecipeValues)).resolves.toEqual({
      id: 'recipe-1'
    });
    await expect(updateRecipe('recipe-1', validRecipeValues)).resolves.toBeNull();
    expect(requestJson).toHaveBeenNthCalledWith(1, '/api/recipes/recipe-1', {
      method: 'PUT',
      body: toRecipeRequestPayload(validRecipeValues)
    });
  });

  test('deletes recipes and maps 404s to false', async () => {
    requestJson
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(
        new RecipeApiError('Recipe "recipe-1" was not found.', {
          status: 404,
          detail: 'Recipe "recipe-1" was not found.'
        })
      );

    await expect(deleteRecipe('recipe-1')).resolves.toBe(true);
    await expect(deleteRecipe('recipe-1')).resolves.toBe(false);
    expect(requestJson).toHaveBeenNthCalledWith(1, '/api/recipes/recipe-1', {
      method: 'DELETE'
    });
  });

  test('rethrows non-404 write errors', async () => {
    requestJson.mockRejectedValue(new Error('write failed'));

    await expect(updateRecipe('recipe-1', validRecipeValues)).rejects.toThrow(
      'write failed'
    );
    await expect(deleteRecipe('recipe-1')).rejects.toThrow('write failed');
  });
});

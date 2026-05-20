import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource,
  ramRecipeSource,
  recipeSource
} from '../features/recipes/activeRecipeSource';

describe('activeRecipeSource', () => {
  afterEach(() => {
    __resetActiveRecipeSource();
  });

  test('delegates all operations to the selected source', async () => {
    const mockRecipeSource = {
      listRecipes: vi.fn().mockResolvedValue('list'),
      getRecipeById: vi.fn().mockResolvedValue('get'),
      getStatistics: vi.fn().mockResolvedValue('stats'),
      createRecipe: vi.fn().mockResolvedValue('create'),
      updateRecipe: vi.fn().mockResolvedValue('update'),
      deleteRecipe: vi.fn().mockResolvedValue('delete')
    };

    __setActiveRecipeSource(mockRecipeSource);

    await expect(recipeSource.listRecipes({ page: 1 })).resolves.toBe('list');
    await expect(recipeSource.getRecipeById('recipe-1')).resolves.toBe('get');
    await expect(recipeSource.getStatistics()).resolves.toBe('stats');
    await expect(recipeSource.createRecipe({})).resolves.toBe('create');
    await expect(recipeSource.updateRecipe('recipe-1', {})).resolves.toBe('update');
    await expect(recipeSource.deleteRecipe('recipe-1')).resolves.toBe('delete');
  });

  test('keeps the RAM source export available for manual switching', () => {
    expect(ramRecipeSource).toHaveProperty('listRecipes');
    expect(ramRecipeSource).toHaveProperty('getStatistics');
    expect(ramRecipeSource).toHaveProperty('createRecipe');
    expect(ramRecipeSource).toHaveProperty('updateRecipe');
    expect(ramRecipeSource).toHaveProperty('deleteRecipe');
  });
});

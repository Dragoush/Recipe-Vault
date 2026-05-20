import {
  __resetRecipeRamSource,
  createRecipe,
  deleteRecipe,
  getRecipeById,
  getStatistics,
  listRecipes,
  updateRecipe
} from '../features/recipes/recipeRamSource';

const initialRecipes = [
  {
    id: 'recipe-1',
    title: 'Recipe 1',
    category: 'Dinner',
    difficulty: 'Easy',
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    description: 'Recipe 1 description that is long enough.',
    ingredients: ['Ingredient A', 'Ingredient B'],
    instructions: ['Step one', 'Step two'],
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z'
  },
  {
    id: 'recipe-2',
    title: 'Recipe 2',
    category: 'Lunch',
    difficulty: 'Medium',
    servings: 3,
    prepTimeMinutes: 20,
    cookTimeMinutes: 20,
    totalTimeMinutes: 40,
    description: 'Recipe 2 description that is also long enough.',
    ingredients: ['Ingredient C', 'Ingredient D'],
    instructions: ['Step three', 'Step four'],
    createdAt: '2026-04-02T08:00:00.000Z',
    updatedAt: '2026-04-02T08:00:00.000Z'
  }
];

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

describe('recipeRamSource', () => {
  beforeEach(() => {
    __resetRecipeRamSource(initialRecipes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('lists paginated recipes and clamps page values', async () => {
    const page = await listRecipes({ page: 99, pageSize: 1 });

    expect(page.page).toBe(2);
    expect(page.totalItems).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items).toEqual([initialRecipes[1]]);
  });

  test('gets clones of stored recipes and returns null for missing ids', async () => {
    const recipe = await getRecipeById('recipe-1');
    recipe.ingredients.push('Changed');

    expect(await getRecipeById('missing')).toBeNull();
    expect((await getRecipeById('recipe-1')).ingredients).toEqual([
      'Ingredient A',
      'Ingredient B'
    ]);
  });

  test('builds collection statistics from the current recipes', async () => {
    await expect(getStatistics()).resolves.toEqual({
      totalRecipes: 2,
      countsByCategory: {
        Dinner: 1,
        Lunch: 1
      },
      countsByDifficulty: {
        Easy: 1,
        Medium: 1
      },
      averagePrepTimeMinutes: 15,
      averageCookTimeMinutes: 17.5,
      averageTotalTimeMinutes: 32.5
    });

    __resetRecipeRamSource([]);

    await expect(getStatistics()).resolves.toEqual({
      totalRecipes: 0,
      countsByCategory: {},
      countsByDifficulty: {},
      averagePrepTimeMinutes: 0,
      averageCookTimeMinutes: 0,
      averageTotalTimeMinutes: 0
    });
  });

  test('creates recipes at the front of the collection', async () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'ram-created-id'
    });

    const recipe = await createRecipe(validRecipeValues);
    const page = await listRecipes({ page: 1, pageSize: 3 });

    expect(recipe.id).toBe('ram-created-id');
    expect(page.items[0].id).toBe('ram-created-id');
    expect(page.totalItems).toBe(3);
  });

  test('updates recipes and preserves createdAt', async () => {
    const updated = await updateRecipe('recipe-1', {
      ...validRecipeValues,
      title: 'Updated Carrots'
    });

    expect(updated.title).toBe('Updated Carrots');
    expect(updated.createdAt).toBe('2026-04-01T08:00:00.000Z');
    expect(await updateRecipe('missing', validRecipeValues)).toBeNull();
  });

  test('deletes recipes and reports whether anything was removed', async () => {
    await expect(deleteRecipe('recipe-1')).resolves.toBe(true);
    await expect(deleteRecipe('missing')).resolves.toBe(false);

    const page = await listRecipes({ page: 1, pageSize: 3 });
    expect(page.items).toEqual([initialRecipes[1]]);
  });
});

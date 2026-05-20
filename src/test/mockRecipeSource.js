export function createRecipe(index, overrides = {}) {
  return {
    id: `recipe-${index}`,
    title: `Recipe ${index}`,
    category: 'Dinner',
    difficulty: 'Easy',
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    totalTimeMinutes: 20,
    description: `Description ${index} for testing the table.`,
    ingredients: ['Ingredient A', 'Ingredient B'],
    instructions: ['Step one', 'Step two'],
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z',
    ...overrides
  };
}

export function createPaginatedRecipesResponse(
  items,
  { page = 1, pageSize = 4, totalItems = items.length, totalPages } = {}
) {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
  };
}

export function createMockRecipeSource() {
  return {
    listRecipes: vi.fn(),
    getRecipeById: vi.fn(),
    getStatistics: vi.fn(),
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn()
  };
}

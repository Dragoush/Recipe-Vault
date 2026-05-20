import { buildRecipeFromValues } from './recipeFormSchema';
import { seedRecipes } from './seedRecipes';

const DEFAULT_PAGE_SIZE = 4;

let recipes = seedRecipes.map(cloneRecipe);

function cloneRecipe(recipe) {
  return {
    ...recipe,
    ingredients: [...recipe.ingredients],
    instructions: [...recipe.instructions]
  };
}

function clampPage(page, totalItems, pageSize) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(page, 1), pageCount);
}

function createRecipeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listRecipes({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
} = {}) {
  const currentPage = clampPage(page, recipes.length, pageSize);
  const totalPages = Math.max(1, Math.ceil(recipes.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: recipes.slice(startIndex, startIndex + pageSize).map(cloneRecipe),
    page: currentPage,
    pageSize,
    totalItems: recipes.length,
    totalPages
  };
}

export async function getRecipeById(recipeId) {
  const recipe = recipes.find((item) => item.id === recipeId) ?? null;
  return recipe ? cloneRecipe(recipe) : null;
}

export async function getStatistics() {
  if (recipes.length === 0) {
    return {
      totalRecipes: 0,
      countsByCategory: {},
      countsByDifficulty: {},
      averagePrepTimeMinutes: 0,
      averageCookTimeMinutes: 0,
      averageTotalTimeMinutes: 0
    };
  }

  const countsByCategory = {};
  const countsByDifficulty = {};
  let totalPrepTimeMinutes = 0;
  let totalCookTimeMinutes = 0;
  let totalTimeMinutes = 0;

  recipes.forEach((recipe) => {
    countsByCategory[recipe.category] = (countsByCategory[recipe.category] ?? 0) + 1;
    countsByDifficulty[recipe.difficulty] =
      (countsByDifficulty[recipe.difficulty] ?? 0) + 1;
    totalPrepTimeMinutes += recipe.prepTimeMinutes;
    totalCookTimeMinutes += recipe.cookTimeMinutes;
    totalTimeMinutes += recipe.totalTimeMinutes;
  });

  return {
    totalRecipes: recipes.length,
    countsByCategory,
    countsByDifficulty,
    averagePrepTimeMinutes: Number((totalPrepTimeMinutes / recipes.length).toFixed(2)),
    averageCookTimeMinutes: Number((totalCookTimeMinutes / recipes.length).toFixed(2)),
    averageTotalTimeMinutes: Number((totalTimeMinutes / recipes.length).toFixed(2))
  };
}

export async function createRecipe(values) {
  const recipe = buildRecipeFromValues(values, {
    id: createRecipeId()
  });

  recipes = [recipe, ...recipes];
  return cloneRecipe(recipe);
}

export async function updateRecipe(recipeId, values) {
  const existingRecipe = recipes.find((recipe) => recipe.id === recipeId) ?? null;

  if (!existingRecipe) {
    return null;
  }

  const recipe = buildRecipeFromValues(values, {
    id: recipeId,
    createdAt: existingRecipe.createdAt,
    updatedAt: new Date().toISOString()
  });

  recipes = recipes.map((item) => (item.id === recipeId ? recipe : item));
  return cloneRecipe(recipe);
}

export async function deleteRecipe(recipeId) {
  const recipeExists = recipes.some((recipe) => recipe.id === recipeId);

  if (!recipeExists) {
    return false;
  }

  recipes = recipes.filter((recipe) => recipe.id !== recipeId);
  return true;
}

export function __resetRecipeRamSource(nextRecipes = seedRecipes) {
  recipes = nextRecipes.map(cloneRecipe);
}

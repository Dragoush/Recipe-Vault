import { API_ROUTES } from './apiRoutes';
import { RecipeApiError, requestJson } from './recipeApiClient';
import { toRecipeRequestPayload } from './recipeFormSchema';

export async function listRecipes({ page = 1, pageSize = 4 } = {}) {
  return requestJson(API_ROUTES.recipes, {
    searchParams: {
      page,
      pageSize
    }
  });
}

export async function getRecipeById(recipeId) {
  try {
    return await requestJson(`${API_ROUTES.recipes}/${recipeId}`);
  } catch (error) {
    if (error instanceof RecipeApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getStatistics() {
  return requestJson(API_ROUTES.recipeStatistics);
}

export async function createRecipe(values) {
  return requestJson(API_ROUTES.recipes, {
    method: 'POST',
    body: toRecipeRequestPayload(values)
  });
}

export async function updateRecipe(recipeId, values) {
  try {
    return await requestJson(`${API_ROUTES.recipes}/${recipeId}`, {
      method: 'PUT',
      body: toRecipeRequestPayload(values)
    });
  } catch (error) {
    if (error instanceof RecipeApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function deleteRecipe(recipeId) {
  try {
    await requestJson(`${API_ROUTES.recipes}/${recipeId}`, {
      method: 'DELETE'
    });

    return true;
  } catch (error) {
    if (error instanceof RecipeApiError && error.status === 404) {
      return false;
    }

    throw error;
  }
}

export const API_ROUTES = {
  recipes: '/api/recipes',
  recipeStatistics: '/api/recipes/statistics'
};

//you definitely forgot to set this <3
//best idea i had
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '');

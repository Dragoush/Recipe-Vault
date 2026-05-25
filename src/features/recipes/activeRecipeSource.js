import * as apiRecipeSource from './recipeApiSource';
let activeRecipeSource = apiRecipeSource;

export const recipeSource = {
  listRecipes: (...args) => activeRecipeSource.listRecipes(...args),
  getRecipeById: (...args) => activeRecipeSource.getRecipeById(...args),
  getStatistics: (...args) => activeRecipeSource.getStatistics(...args),
  createRecipe: (...args) => activeRecipeSource.createRecipe(...args),
  updateRecipe: (...args) => activeRecipeSource.updateRecipe(...args),
  deleteRecipe: (...args) => activeRecipeSource.deleteRecipe(...args)
};

export function __setActiveRecipeSource(nextRecipeSource) {
  activeRecipeSource = nextRecipeSource;
}

export function __resetActiveRecipeSource() {
  activeRecipeSource = apiRecipeSource;
}

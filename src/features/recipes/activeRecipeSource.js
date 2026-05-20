import * as apiRecipeSource from './recipeApiSource';
import * as ramRecipeSource from './recipeRamSource';


//this one for api
let activeRecipeSource = apiRecipeSource;
//this one for ram
//let activeRecipeSource = ramRecipeSource;

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

export { ramRecipeSource };

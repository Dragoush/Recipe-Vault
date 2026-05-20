import { createContext, useContext, useReducer } from 'react';
import { buildRecipeFromValues } from './recipeFormSchema';
import { seedRecipes } from './seedRecipes';

const RecipesContext = createContext(null);
export const DEFAULT_PAGE_SIZE = 4;

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

export function createInitialState(
  initialRecipes = seedRecipes,
  pageSize = DEFAULT_PAGE_SIZE
) {
  return {
    recipes: initialRecipes,
    currentPage: 1,
    pageSize
  };
}

export function recipesReducer(state, action) {
  switch (action.type) {
    case 'setPage':
      return {
        ...state,
        currentPage: clampPage(action.page, state.recipes.length, state.pageSize)
      };

    case 'addRecipe':
      return {
        ...state,
        recipes: [action.recipe, ...state.recipes],
        currentPage: 1
      };

    case 'updateRecipe':
      return {
        ...state,
        recipes: state.recipes.map((recipe) =>
          recipe.id === action.recipe.id ? action.recipe : recipe
        )
      };

    case 'deleteRecipe': {
      const recipes = state.recipes.filter((recipe) => recipe.id !== action.id);

      return {
        ...state,
        recipes,
        currentPage: clampPage(state.currentPage, recipes.length, state.pageSize)
      };
    }

    default:
      return state;
  }
}

export function RecipesProvider({
  children,
  initialRecipes = seedRecipes,
  pageSize = DEFAULT_PAGE_SIZE
}) {
  const [state, dispatch] = useReducer(
    recipesReducer,
    createInitialState(initialRecipes, pageSize)
  );

  const pageCount = Math.max(1, Math.ceil(state.recipes.length / state.pageSize));
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const paginatedRecipes = state.recipes.slice(
    startIndex,
    startIndex + state.pageSize
  );

  const value = {
    recipes: state.recipes,
    paginatedRecipes,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    pageCount,
    recipeCount: state.recipes.length,
    setPage: (page) => dispatch({ type: 'setPage', page }),
    getRecipeById: (id) =>
      state.recipes.find((recipe) => recipe.id === id) ?? null,
    addRecipe: (values) => {
      const recipe = buildRecipeFromValues(values, {
        id: createRecipeId()
      });

      dispatch({ type: 'addRecipe', recipe });
      return recipe;
    },
    updateRecipe: (id, values) => {
      const existingRecipe =
        state.recipes.find((recipe) => recipe.id === id) ?? null;

      if (!existingRecipe) {
        return null;
      }

      const recipe = buildRecipeFromValues(values, {
        id,
        createdAt: existingRecipe.createdAt,
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: 'updateRecipe', recipe });
      return recipe;
    },
    deleteRecipe: (id) => dispatch({ type: 'deleteRecipe', id })
  };

  return (
    <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);

  if (!context) {
    throw new Error('useRecipes must be used inside RecipesProvider.');
  }

  return context;
}

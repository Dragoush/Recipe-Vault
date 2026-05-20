import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusPanel from '../../components/StatusPanel';
import { recipeSource } from './activeRecipeSource';
import RecipeTable from './RecipeTable';

const DEFAULT_PAGE_SIZE = 4;
const initialRecipesPage = {
  items: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1
};

export default function RecipesPage() {
  const [pageRequest, setPageRequest] = useState(1);
  const [recipesPage, setRecipesPage] = useState(initialRecipesPage);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRecipes() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const nextRecipesPage = await recipeSource.listRecipes({
          page: pageRequest,
          pageSize: DEFAULT_PAGE_SIZE
        });

        if (!isCancelled) {
          setRecipesPage(nextRecipesPage);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error?.message ?? 'Unable to load the recipes right now.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRecipes();

    return () => {
      isCancelled = true;
    };
  }, [pageRequest, reloadKey]);

  async function handleDelete(recipe) {
    const shouldDelete = window.confirm(
      `Delete "${recipe.title}" from the collection?`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingRecipeId(recipe.id);
    setErrorMessage('');

    try {
      await recipeSource.deleteRecipe(recipe.id);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error?.message ?? 'Unable to delete the recipe right now.'
      );
    } finally {
      setDeletingRecipeId(null);
    }
  }

  function handleRetry() {
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Master view"
        title="Recipe collection"
        description="Browse, explore, and manage your recipes in one place."
        actions={
          <Link className="button" to="/recipes/new">
            New recipe
          </Link>
        }
      />

      <section className="dashboard-grid">
        <article className="panel summary-card">
          <p className="summary-label">Recipes available</p>
          <p className="summary-value">{recipesPage.totalItems}</p>
        </article>
        <article className="panel summary-card">
          <p className="summary-label">Current page</p>
          <p className="summary-value">
            {recipesPage.page} / {recipesPage.totalPages}
          </p>
        </article>
      </section>

      {isLoading ? (
        <StatusPanel
          description="Fetching the current recipe page from the active data source."
          title="Loading recipes..."
        />
      ) : null}

      {!isLoading && errorMessage ? (
        <StatusPanel
          actionLabel="Try again"
          description={errorMessage}
          onAction={handleRetry}
          title="We couldn't load the recipes."
        />
      ) : null}

      {!isLoading && !errorMessage && recipesPage.totalItems === 0 ? (
        <EmptyState
          actionLabel="Add a recipe"
          description="You have not created any recipes yet. Start with one entry and the table will appear here."
          title="The collection is empty."
        />
      ) : null}

      {!isLoading && !errorMessage && recipesPage.totalItems > 0 ? (
        <>
          <RecipeTable
            deletingRecipeId={deletingRecipeId}
            onDelete={handleDelete}
            recipes={recipesPage.items}
          />
          <Pagination
            currentPage={recipesPage.page}
            onPageChange={setPageRequest}
            pageCount={recipesPage.totalPages}
          />
        </>
      ) : null}
    </div>
  );
}

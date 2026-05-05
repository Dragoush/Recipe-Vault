import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import RecipeTable from './RecipeTable';
import { useRecipes } from './recipesContext';

export default function RecipesPage() {
  const {
    currentPage,
    deleteRecipe,
    pageCount,
    paginatedRecipes,
    recipeCount,
    setPage
  } = useRecipes();

  function handleDelete(recipe) {
    const shouldDelete = window.confirm(
      `Delete "${recipe.title}" from the collection?`
    );

    if (shouldDelete) {
      deleteRecipe(recipe.id);
    }
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
          <p className="summary-label">Recipes in memory</p>
          <p className="summary-value">{recipeCount}</p>
        </article>
        <article className="panel summary-card">
          <p className="summary-label">Current page</p>
          <p className="summary-value">
            {currentPage} / {pageCount}
          </p>
        </article>
      </section>

      {recipeCount === 0 ? (
        <EmptyState
          actionLabel="Add a recipe"
          description="You have not created any recipes yet. Start with one entry and the table will appear here."
          title="The collection is empty."
        />
      ) : (
        <>
          <RecipeTable onDelete={handleDelete} recipes={paginatedRecipes} />
          <Pagination
            currentPage={currentPage}
            onPageChange={setPage}
            pageCount={pageCount}
          />
        </>
      )}
    </div>
  );
}

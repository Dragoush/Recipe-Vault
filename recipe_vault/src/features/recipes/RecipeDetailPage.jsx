import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useRecipes } from './recipesContext';
import { formatDateLabel, formatDuration } from './recipeUtils';

function DetailMeta({ label, value }) {
  return (
    <div className="detail-meta-card">
      <p className="detail-meta-label">{label}</p>
      <p className="detail-meta-value">{value}</p>
    </div>
  );
}

export default function RecipeDetailPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const { deleteRecipe, getRecipeById } = useRecipes();

  const recipe = getRecipeById(recipeId);

  if (!recipe) {
    return isDeleting ? null : <Navigate replace to="/404" />;
  }

  function handleDelete() {
    const shouldDelete = window.confirm(
      `Delete "${recipe.title}" from the in-memory collection?`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    deleteRecipe(recipe.id);
    navigate('/recipes', { replace: true });
  }

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Detail view"
        title={recipe.title}
        description={recipe.description}
        actions={
          <>
            <Link className="button button-secondary" to="/recipes">
              Back
            </Link>
            <Link className="button" to={`/recipes/${recipe.id}/edit`}>
              Edit recipe
            </Link>
            <button className="button button-danger" onClick={handleDelete} type="button">
              Delete recipe
            </button>
          </>
        }
      />

      <section className="detail-meta-grid">
        <DetailMeta label="Category" value={recipe.category} />
        <DetailMeta label="Difficulty" value={recipe.difficulty} />
        <DetailMeta label="Servings" value={recipe.servings} />
        <DetailMeta label="Total time" value={formatDuration(recipe.totalTimeMinutes)} />
        <DetailMeta label="Created" value={formatDateLabel(recipe.createdAt)} />
        <DetailMeta label="Updated" value={formatDateLabel(recipe.updatedAt)} />
      </section>

      <section className="detail-grid">
        <article className="panel">
          <h2>Ingredients</h2>
          <ul className="detail-list">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Instructions</h2>
          <ol className="detail-list ordered-list">
            {recipe.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  );
}

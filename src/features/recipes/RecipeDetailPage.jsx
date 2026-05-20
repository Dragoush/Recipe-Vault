import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusPanel from '../../components/StatusPanel';
import { recipeSource } from './activeRecipeSource';
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
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMissing, setIsMissing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const { recipeId } = useParams();

  useEffect(() => {
    let isCancelled = false;

    async function loadRecipe() {
      setIsLoading(true);
      setErrorMessage('');
      setIsMissing(false);
      setRecipe(null);

      try {
        const nextRecipe = await recipeSource.getRecipeById(recipeId);

        if (isCancelled) {
          return;
        }

        if (!nextRecipe) {
          setRecipe(null);
          setIsMissing(true);
          return;
        }

        setRecipe(nextRecipe);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error?.message ?? 'Unable to load the recipe right now.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRecipe();

    return () => {
      isCancelled = true;
    };
  }, [recipeId, reloadKey]);

  async function handleDelete() {
    const shouldDelete = window.confirm(
      `Delete "${recipe.title}" from the collection?`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');

    try {
      const wasDeleted = await recipeSource.deleteRecipe(recipe.id);

      if (!wasDeleted) {
        navigate('/404', { replace: true });
        return;
      }

      navigate('/recipes', { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.message ?? 'Unable to delete the recipe right now.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleRetry() {
    setReloadKey((value) => value + 1);
  }

  if (isMissing) {
    return isDeleting ? null : <Navigate replace to="/404" />;
  }

  if (isLoading) {
    return (
      <div className="stack-lg">
        <StatusPanel
          description="Fetching the recipe details from the active data source."
          title="Loading recipe..."
        />
      </div>
    );
  }

  if (errorMessage && !recipe) {
    return (
      <div className="stack-lg">
        <StatusPanel
          actionLabel="Try again"
          description={errorMessage}
          onAction={handleRetry}
          title="We couldn't load that recipe."
          tone="error"
        />
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="stack-lg">
      {errorMessage ? (
        <StatusPanel
          actionLabel="Reload recipe"
          description={errorMessage}
          onAction={handleRetry}
          title="Something went wrong."
          tone="error"
        />
      ) : null}

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
            <button
              className="button button-danger"
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
            >
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

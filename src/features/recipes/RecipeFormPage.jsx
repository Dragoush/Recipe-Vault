import { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusPanel from '../../components/StatusPanel';
import { recipeSource } from './activeRecipeSource';
import RecipeForm from './RecipeForm';
import { defaultRecipeValues, toRecipeFormValues } from './recipeFormSchema';

export default function RecipeFormPage() {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isMissing, setIsMissing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const isEditing = Boolean(recipeId);

  useEffect(() => {
    if (!isEditing) {
      setRecipe(null);
      setIsLoading(false);
      setErrorMessage('');
      setSubmitError('');
      setIsMissing(false);
      return;
    }

    let isCancelled = false;

    async function loadRecipe() {
      setIsLoading(true);
      setErrorMessage('');
      setSubmitError('');
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
            error?.message ?? 'Unable to load the recipe for editing.'
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
  }, [isEditing, recipeId, reloadKey]);

  async function handleSubmit(values) {
    setSubmitError('');

    try {
      if (isEditing) {
        const updatedRecipe = await recipeSource.updateRecipe(recipeId, values);

        if (!updatedRecipe) {
          navigate('/404', { replace: true });
          return;
        }

        navigate(`/recipes/${updatedRecipe.id}`);
        return;
      }

      const createdRecipe = await recipeSource.createRecipe(values);
      navigate(`/recipes/${createdRecipe.id}`);
    } catch (error) {
      setSubmitError(
        error?.message ?? 'Unable to save the recipe right now.'
      );
    }
  }

  function handleRetry() {
    setReloadKey((value) => value + 1);
  }

  if (isMissing) {
    return <Navigate replace to="/404" />;
  }

  if (isLoading) {
    return (
      <div className="stack-lg">
        <PageHeader
          eyebrow="Update a recipe"
          title="Edit recipe"
          description="Loading the latest recipe details before editing."
          actions={
            <Link className="button button-secondary" to="/recipes">
              Back to recipes
            </Link>
          }
        />

        <StatusPanel
          description="Fetching the recipe details from the active data source."
          title="Loading recipe..."
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="stack-lg">
        <PageHeader
          eyebrow="Update a recipe"
          title="Edit recipe"
          description="We hit a problem while loading the recipe for editing."
          actions={
            <Link className="button button-secondary" to="/recipes">
              Back to recipes
            </Link>
          }
        />

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

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow={isEditing ? 'Update a recipe' : 'Create a recipe'}
        title={isEditing && recipe ? `Edit ${recipe.title}` : 'Add a new recipe'}
        description={
          isEditing
            ? 'Adjust the recipe details and keep the rest of the collection unchanged.'
            : 'Add a new dish, fill in the details, and keep your recipe collection neat and easy to explore.'
        }
        actions={
          <Link className="button button-secondary" to="/recipes">
            Back to recipes
          </Link>
        }
      />

      <RecipeForm
        key={recipeId ?? 'new'}
        initialValues={recipe ? toRecipeFormValues(recipe) : defaultRecipeValues}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </div>
  );
}

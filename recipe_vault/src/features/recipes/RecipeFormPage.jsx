import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import RecipeForm from './RecipeForm';
import { defaultRecipeValues, toRecipeFormValues } from './recipeFormSchema';
import { useRecipes } from './recipesContext';

export default function RecipeFormPage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const { addRecipe, getRecipeById, updateRecipe } = useRecipes();

  const recipe = recipeId ? getRecipeById(recipeId) : null;
  const isEditing = Boolean(recipeId);

  if (recipeId && !recipe) {
    return <Navigate replace to="/404" />;
  }

  function handleSubmit(values) {
    if (isEditing) {
      updateRecipe(recipeId, values);
      navigate(`/recipes/${recipeId}`);
      return;
    }

    const createdRecipe = addRecipe(values);
    navigate(`/recipes/${createdRecipe.id}`);
  }

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow={isEditing ? 'Update a recipe' : 'Create a recipe'}
        title={isEditing ? `Edit ${recipe.title}` : 'Add a new recipe'}
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
        initialValues={recipe ? toRecipeFormValues(recipe) : defaultRecipeValues}
        isEditing={isEditing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

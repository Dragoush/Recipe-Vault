import { Link } from 'react-router-dom';
import { formatDuration } from './recipeUtils';

export default function RecipeTable({
  recipes,
  onDelete,
  deletingRecipeId = null
}) {
  return (
    <div className="table-wrapper panel">
      <table className="recipe-table">
        <thead>
          <tr>
            <th scope="col">Recipe</th>
            <th scope="col">Category</th>
            <th scope="col">Difficulty</th>
            <th scope="col">Total time</th>
            <th scope="col">Servings</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr key={recipe.id}>
              <td>
                <div className="table-primary">
                  <Link className="table-link" to={`/recipes/${recipe.id}`}>
                    {recipe.title}
                  </Link>
                  <p>{recipe.description}</p>
                </div>
              </td>
              <td>{recipe.category}</td>
              <td>{recipe.difficulty}</td>
              <td>{formatDuration(recipe.totalTimeMinutes)}</td>
              <td>{recipe.servings}</td>
              <td>
                <div className="row-actions">
                  <Link className="button button-ghost" to={`/recipes/${recipe.id}`}>
                    View
                  </Link>
                  <Link
                    className="button button-ghost"
                    to={`/recipes/${recipe.id}/edit`}
                  >
                    Edit
                  </Link>
                  <button
                    className="button button-danger"
                    disabled={deletingRecipeId === recipe.id}
                    onClick={() => onDelete(recipe)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  categoryOptions,
  defaultRecipeValues,
  difficultyOptions,
  recipeFormSchema
} from './recipeFormSchema';

function FieldError({ error }) {
  return error ? (
    <p className="field-error" role="alert">
      {error.message}
    </p>
  ) : null;
}

export default function RecipeForm({
  initialValues = defaultRecipeValues,
  isEditing = false,
  onSubmit,
  submitError = ''
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: initialValues
  });

  return (
    <form className="recipe-form panel" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="recipe-title">Recipe title</label>
          <input
            id="recipe-title"
            {...register('title')}
            placeholder="Ex: Pesto Pasta Bowl"
            type="text"
          />
          <FieldError error={errors.title} />
        </div>

        <div className="field">
          <label htmlFor="recipe-category">Category</label>
          <select id="recipe-category" {...register('category')}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError error={errors.category} />
        </div>

        <div className="field">
          <label htmlFor="recipe-difficulty">Difficulty</label>
          <select id="recipe-difficulty" {...register('difficulty')}>
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError error={errors.difficulty} />
        </div>

        <div className="field">
          <label htmlFor="recipe-servings">Servings</label>
          <input id="recipe-servings" {...register('servings')} min="1" type="number" />
          <FieldError error={errors.servings} />
        </div>

        <div className="field">
          <label htmlFor="recipe-prep-time">Prep time (minutes)</label>
          <input
            id="recipe-prep-time"
            {...register('prepTimeMinutes')}
            min="0"
            type="number"
          />
          <FieldError error={errors.prepTimeMinutes} />
        </div>

        <div className="field">
          <label htmlFor="recipe-cook-time">Cook time (minutes)</label>
          <input
            id="recipe-cook-time"
            {...register('cookTimeMinutes')}
            min="0"
            type="number"
          />
          <FieldError error={errors.cookTimeMinutes} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="recipe-description">Short description</label>
        <textarea
          id="recipe-description"
          {...register('description')}
          placeholder="Give a brief summary that helps someone understand the dish."
          rows="3"
        />
        <FieldError error={errors.description} />
      </div>

      <div className="form-grid split-grid">
        <div className="field">
          <label htmlFor="recipe-ingredients">Ingredients</label>
          <textarea
            id="recipe-ingredients"
            {...register('ingredientLines')}
            placeholder={'1 cup flour\n2 eggs\n1 tablespoon olive oil'}
            rows="8"
          />
          <small className="field-hint">Use one ingredient per line.</small>
          <FieldError error={errors.ingredientLines} />
        </div>

        <div className="field">
          <label htmlFor="recipe-instructions">Instructions</label>
          <textarea
            id="recipe-instructions"
            {...register('instructionLines')}
            placeholder={'Mix the dry ingredients.\nBake until golden.'}
            rows="8"
          />
          <small className="field-hint">Use one preparation step per line.</small>
          <FieldError error={errors.instructionLines} />
        </div>
      </div>

      {submitError ? (
        <p className="field-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="button" disabled={isSubmitting} type="submit">
          {isEditing ? 'Save changes' : 'Create recipe'}
        </button>
      </div>
    </form>
  );
}

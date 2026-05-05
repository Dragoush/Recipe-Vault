import {
  buildRecipeFromValues,
  recipeFormSchema,
  toRecipeFormValues
} from '../features/recipes/recipeFormSchema';

const validRecipeValues = {
  title: 'Roasted Carrots',
  category: 'Dinner',
  difficulty: 'Easy',
  servings: 4,
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  description: 'Sweet roasted carrots with herbs and a light citrus finish.',
  ingredientLines: 'Carrots\nOlive oil\nParsley',
  instructionLines: 'Prep the carrots.\nRoast until tender.'
};

describe('recipeFormSchema', () => {
  test('accepts a valid recipe draft', () => {
    const result = recipeFormSchema.safeParse(validRecipeValues);

    expect(result.success).toBe(true);
  });

  test('rejects invalid category, difficulty, and missing line-based content', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipeValues,
      category: 'Brunch',
      difficulty: 'Expert',
      ingredientLines: 'Carrots',
      instructionLines: 'Cook'
    });

    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors.category).toContain(
      'Select a category.'
    );
    expect(result.error.flatten().fieldErrors.difficulty).toContain(
      'Select a difficulty level.'
    );
    expect(result.error.flatten().fieldErrors.ingredientLines).toContain(
      'Add at least 2 ingredients, one per line.'
    );
    expect(result.error.flatten().fieldErrors.instructionLines).toContain(
      'Add at least 2 preparation steps, one per line.'
    );
  });

  test('rejects invalid numeric values and overly short text', () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipeValues,
      title: 'Hi',
      servings: 0.5,
      prepTimeMinutes: -1,
      cookTimeMinutes: 601,
      description: 'Too short'
    });

    expect(result.success).toBe(false);
    expect(result.error.flatten().fieldErrors.title).toContain(
      'Title must have at least 3 characters.'
    );
    expect(result.error.flatten().fieldErrors.servings).toContain(
      'Servings must be a whole number.'
    );
    expect(result.error.flatten().fieldErrors.prepTimeMinutes).toContain(
      'Prep time cannot be negative.'
    );
    expect(result.error.flatten().fieldErrors.cookTimeMinutes).toContain(
      'Cook time is unexpectedly high.'
    );
    expect(result.error.flatten().fieldErrors.description).toContain(
      'Description must have at least 12 characters.'
    );
  });

  test('normalizes recipe values into the stored entity shape', () => {
    const recipe = buildRecipeFromValues(
      {
        ...validRecipeValues,
        title: '  Roasted Carrots  ',
        ingredientLines: ' Carrots \n\n Olive oil \n Parsley ',
        instructionLines: ' Prep the carrots. \n Roast until tender. '
      },
      {
        id: 'recipe-7',
        createdAt: '2026-04-01T08:00:00.000Z'
      }
    );

    expect(recipe.id).toBe('recipe-7');
    expect(recipe.title).toBe('Roasted Carrots');
    expect(recipe.totalTimeMinutes).toBe(45);
    expect(recipe.ingredients).toEqual(['Carrots', 'Olive oil', 'Parsley']);
    expect(recipe.instructions).toEqual([
      'Prep the carrots.',
      'Roast until tender.'
    ]);
    expect(recipe.createdAt).toBe('2026-04-01T08:00:00.000Z');
  });

  test('maps a stored recipe back into form values for editing', () => {
    const formValues = toRecipeFormValues({
      id: 'recipe-7',
      title: 'Roasted Carrots',
      category: 'Dinner',
      difficulty: 'Easy',
      servings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      description: 'Sweet roasted carrots with herbs and a light citrus finish.',
      ingredients: ['Carrots', 'Olive oil', 'Parsley'],
      instructions: ['Prep the carrots.', 'Roast until tender.']
    });

    expect(formValues).toEqual({
      title: 'Roasted Carrots',
      category: 'Dinner',
      difficulty: 'Easy',
      servings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      description: 'Sweet roasted carrots with herbs and a light citrus finish.',
      ingredientLines: 'Carrots\nOlive oil\nParsley',
      instructionLines: 'Prep the carrots.\nRoast until tender.'
    });
  });
});

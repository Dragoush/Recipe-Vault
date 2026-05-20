import { z } from 'zod';

export const categoryOptions = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Drink'
];

export const difficultyOptions = ['Easy', 'Medium', 'Hard'];

const countLines = (value) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean).length;

const splitLines = (value) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const defaultRecipeValues = {
  title: '',
  category: categoryOptions[0],
  difficulty: difficultyOptions[0],
  servings: 2,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  description: '',
  ingredientLines: '',
  instructionLines: ''
};

export const recipeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must have at least 3 characters.')
    .max(60, 'Title must stay under 60 characters.'),
  category: z
    .string()
    .refine((value) => categoryOptions.includes(value), 'Select a category.'),
  difficulty: z
    .string()
    .refine(
      (value) => difficultyOptions.includes(value),
      'Select a difficulty level.'
    ),
  servings: z.coerce
    .number()
    .int('Servings must be a whole number.')
    .min(1, 'Servings must be at least 1.')
    .max(24, 'Servings must stay below 25.'),
  prepTimeMinutes: z.coerce
    .number()
    .int('Prep time must be a whole number.')
    .min(0, 'Prep time cannot be negative.')
    .max(600, 'Prep time is unexpectedly high.'),
  cookTimeMinutes: z.coerce
    .number()
    .int('Cook time must be a whole number.')
    .min(0, 'Cook time cannot be negative.')
    .max(600, 'Cook time is unexpectedly high.'),
  description: z
    .string()
    .trim()
    .min(12, 'Description must have at least 12 characters.')
    .max(260, 'Description must stay under 260 characters.'),
  ingredientLines: z
    .string()
    .trim()
    .refine(
      (value) => countLines(value) >= 2,
      'Add at least 2 ingredients, one per line.'
    ),
  instructionLines: z
    .string()
    .trim()
    .refine(
      (value) => countLines(value) >= 2,
      'Add at least 2 preparation steps, one per line.'
    )
});

export function toRecipeRequestPayload(values) {
  const ingredients = splitLines(values.ingredientLines);
  const instructions = splitLines(values.instructionLines);

  return {
    title: values.title.trim(),
    category: values.category,
    difficulty: values.difficulty,
    servings: Number(values.servings),
    prepTimeMinutes: Number(values.prepTimeMinutes),
    cookTimeMinutes: Number(values.cookTimeMinutes),
    description: values.description.trim(),
    ingredients,
    instructions
  };
}

export function buildRecipeFromValues(values, overrides = {}) {
  const payload = toRecipeRequestPayload(values);

  return {
    id: overrides.id,
    ...payload,
    totalTimeMinutes:
      payload.prepTimeMinutes + payload.cookTimeMinutes,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString()
  };
}

export function toRecipeFormValues(recipe) {
  return {
    title: recipe.title,
    category: recipe.category,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    description: recipe.description,
    ingredientLines: recipe.ingredients.join('\n'),
    instructionLines: recipe.instructions.join('\n')
  };
}

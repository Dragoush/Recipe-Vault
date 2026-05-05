import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from './renderRoute';

function createRecipe(index) {
  return {
    id: `recipe-${index}`,
    title: `Recipe ${index}`,
    category: 'Dinner',
    difficulty: 'Easy',
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    totalTimeMinutes: 20,
    description: `Description ${index} for testing the table.`,
    ingredients: ['Ingredient A', 'Ingredient B'],
    instructions: ['Step one', 'Step two'],
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z'
  };
}

describe('Recipes page', () => {
  test('paginates the table results', async () => {
    const user = userEvent.setup();
    const recipes = Array.from({ length: 5 }, (_, index) => createRecipe(index + 1));

    renderRoute('/recipes', {
      initialRecipes: recipes,
      pageSize: 2
    });

    expect(screen.getByText('Recipe 1')).toBeInTheDocument();
    expect(screen.getByText('Recipe 2')).toBeInTheDocument();
    expect(screen.queryByText('Recipe 3')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Recipe 3')).toBeInTheDocument();
    expect(screen.getByText('Recipe 4')).toBeInTheDocument();
    expect(screen.queryByText('Recipe 1')).not.toBeInTheDocument();
  });

  test('opens the detail page from the table', async () => {
    const user = userEvent.setup();

    renderRoute('/recipes', {
      initialRecipes: [createRecipe(1)]
    });

    await user.click(screen.getByRole('link', { name: 'View' }));

    expect(
      await screen.findByRole('heading', { name: 'Recipe 1' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ingredient A')).toBeInTheDocument();
  });

  test('keeps a recipe when deletion is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(false);

    renderRoute('/recipes', {
      initialRecipes: [createRecipe(1)]
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Recipe 1')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  test('removes a recipe when deletion is confirmed from the table', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);

    renderRoute('/recipes', {
      initialRecipes: [createRecipe(1)]
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByRole('link', { name: 'Add a recipe' })).toHaveAttribute(
      'href',
      '/recipes/new'
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});

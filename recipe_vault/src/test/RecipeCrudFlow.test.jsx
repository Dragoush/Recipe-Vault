import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from './renderRoute';

const existingRecipe = {
  id: 'recipe-100',
  title: 'Test Pasta',
  category: 'Dinner',
  difficulty: 'Easy',
  servings: 2,
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  totalTimeMinutes: 25,
  description: 'A simple pasta used for testing edit and delete flows.',
  ingredients: ['Pasta', 'Salt'],
  instructions: ['Boil water', 'Cook pasta'],
  createdAt: '2026-04-01T08:00:00.000Z',
  updatedAt: '2026-04-01T08:00:00.000Z'
};

describe('Recipe CRUD flows', () => {
  test('validates the add form and creates a recipe', async () => {
    const user = userEvent.setup();

    renderRoute('/recipes/new', {
      initialRecipes: []
    });

    await user.click(screen.getByRole('button', { name: 'Create recipe' }));

    expect(
      screen.getByText('Title must have at least 3 characters.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Description must have at least 12 characters.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add at least 2 ingredients, one per line.')
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Recipe title'), 'Roasted Potatoes');
    await user.clear(screen.getByLabelText('Short description'));
    await user.type(
      screen.getByLabelText('Short description'),
      'Crispy roasted potatoes with herbs.'
    );
    await user.clear(screen.getByLabelText('Ingredients'));
    await user.type(
      screen.getByLabelText('Ingredients'),
      'Potatoes{enter}Olive oil{enter}Rosemary'
    );
    await user.clear(screen.getByLabelText('Instructions'));
    await user.type(
      screen.getByLabelText('Instructions'),
      'Cut the potatoes.{enter}Roast until golden.'
    );

    await user.click(screen.getByRole('button', { name: 'Create recipe' }));

    expect(
      await screen.findByRole('heading', { name: 'Roasted Potatoes' })
    ).toBeInTheDocument();
    expect(screen.getByText('Potatoes')).toBeInTheDocument();
    expect(screen.getByText('Roast until golden.')).toBeInTheDocument();
  });

  test('edits and deletes an existing recipe', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);

    renderRoute('/recipes/recipe-100/edit', {
      initialRecipes: [existingRecipe]
    });

    const titleField = screen.getByLabelText('Recipe title');
    await user.clear(titleField);
    await user.type(titleField, 'Updated Test Pasta');
    await user.clear(screen.getByLabelText('Short description'));
    await user.type(
      screen.getByLabelText('Short description'),
      'A refreshed pasta with basil and lemon for a lighter finish.'
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('heading', { name: 'Updated Test Pasta' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('A refreshed pasta with basil and lemon for a lighter finish.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete recipe' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByRole('link', { name: 'Add a recipe' })).toHaveAttribute(
      'href',
      '/recipes/new'
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  test('stays on the detail page when delete is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(false);

    renderRoute('/recipes/recipe-100', {
      initialRecipes: [existingRecipe]
    });

    await user.click(screen.getByRole('button', { name: 'Delete recipe' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Test Pasta' })
    ).toBeInTheDocument();
    expect(screen.getByText('A simple pasta used for testing edit and delete flows.')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});

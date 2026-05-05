import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../app/AppRoutes';
import { RecipesProvider } from '../features/recipes/recipesContext';

export function renderRoute(
  route = '/',
  { initialRecipes, pageSize } = {}
) {
  return render(
    <RecipesProvider initialRecipes={initialRecipes} pageSize={pageSize}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </RecipesProvider>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import HomePage from '../pages/HomePage';
import RecipesPage from '../features/recipes/RecipesPage';
import RecipeDetailPage from '../features/recipes/RecipeDetailPage';
import RecipeFormPage from '../features/recipes/RecipeFormPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/new" element={<RecipeFormPage />} />
        <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="recipes/:recipeId/edit" element={<RecipeFormPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Route>
    </Routes>
  );
}

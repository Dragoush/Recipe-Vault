import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import LoginPage from '../features/auth/LoginPage';
import PublicOnlyRoute from '../features/auth/PublicOnlyRoute';
import RegisterPage from '../features/auth/RegisterPage';
import RequireAuth from '../features/auth/RequireAuth';
import HomePage from '../pages/HomePage';
import RecipesPage from '../features/recipes/RecipesPage';
import RecipeDetailPage from '../features/recipes/RecipeDetailPage';
import RecipeFormPage from '../features/recipes/RecipeFormPage';
import RecipeStatisticsPage from '../features/recipes/RecipeStatisticsPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="recipes/new" element={<RecipeFormPage />} />
          <Route path="recipes/statistics" element={<RecipeStatisticsPage />} />
          <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
          <Route path="recipes/:recipeId/edit" element={<RecipeFormPage />} />
        </Route>
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Route>
    </Routes>
  );
}

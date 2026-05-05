import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './app/AppRoutes';
import { RecipesProvider } from './features/recipes/recipesContext';

export default function App() {
  return (
    <RecipesProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </RecipesProvider>
  );
}

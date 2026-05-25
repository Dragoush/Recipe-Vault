import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './app/AppRoutes';
import AuthProvider from './features/auth/AuthProvider';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

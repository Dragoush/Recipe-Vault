import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../app/AppRoutes';
import AuthProvider, { createTestSession } from '../features/auth/AuthProvider';

export function renderRoute(
  route = '/',
  {
    authApi,
    authSession = createTestSession(),
    bootstrapOnMount = false
  } = {}
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider
        api={authApi}
        initialSession={authSession}
        bootstrapOnMount={bootstrapOnMount}
      >
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

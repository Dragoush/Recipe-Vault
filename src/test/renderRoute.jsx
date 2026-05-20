import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../app/AppRoutes';

export function renderRoute(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

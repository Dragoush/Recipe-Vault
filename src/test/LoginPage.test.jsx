import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import { createMockAuthApi, createAuthSession } from './mockAuthApi';
import { createMockRecipeSource, createPaginatedRecipesResponse } from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockAuthApi = createMockAuthApi();
const mockRecipeSource = createMockRecipeSource();

describe('Login page', () => {
  beforeEach(() => {
    Object.values(mockAuthApi).forEach((mock) => mock.mockReset());
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
    mockRecipeSource.listRecipes.mockResolvedValue(
      createPaginatedRecipesResponse([])
    );
  });

  afterEach(() => {
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('logs in and redirects into the protected recipes area', async () => {
    const user = userEvent.setup();

    mockAuthApi.login.mockResolvedValue(createAuthSession());

    renderRoute('/login', {
      authApi: mockAuthApi,
      authSession: null
    });

    await user.type(screen.getByLabelText('Username'), 'test_user');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockAuthApi.login).toHaveBeenCalledWith({
      username: 'test_user',
      password: 'password123'
    });
    expect(
      await screen.findByRole('heading', { name: 'Recipe collection' })
    ).toBeInTheDocument();
  });

  test('shows backend login errors', async () => {
    const user = userEvent.setup();

    mockAuthApi.login.mockRejectedValue(new Error('Invalid username or password.'));

    renderRoute('/login', {
      authApi: mockAuthApi,
      authSession: null
    });

    await user.type(screen.getByLabelText('Username'), 'test_user');
    await user.type(screen.getByLabelText('Password'), 'wrongpass123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(
      await screen.findByText('Invalid username or password.')
    ).toBeInTheDocument();
  });

  test('does not show a session-expired notice on a fresh guest visit', async () => {
    mockAuthApi.refresh.mockRejectedValue({
      status: 401,
      message: 'Refresh token is missing.'
    });

    renderRoute('/login', {
      authApi: mockAuthApi,
      authSession: null,
      bootstrapOnMount: true
    });

    expect(
      await screen.findByRole('heading', { name: 'Welcome back!' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Your session expired. Please sign in again.')
    ).not.toBeInTheDocument();
  });
});

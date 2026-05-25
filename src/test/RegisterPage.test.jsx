import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockAuthApi } from './mockAuthApi';
import { renderRoute } from './renderRoute';

const mockAuthApi = createMockAuthApi();

describe('Register page', () => {
  beforeEach(() => {
    Object.values(mockAuthApi).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('registers a new account and redirects to login with a notice', async () => {
    const user = userEvent.setup();

    mockAuthApi.register.mockResolvedValue({
      id: 'user-1',
      username: 'test_user',
      role: 'USER'
    });

    renderRoute('/register', {
      authApi: mockAuthApi,
      authSession: null
    });

    await user.type(screen.getByLabelText('Username'), 'test_user');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockAuthApi.register).toHaveBeenCalledWith({
      username: 'test_user',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(
      await screen.findByRole('heading', { name: 'Welcome back!' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Account created. Sign in to access your recipes.')
    ).toBeInTheDocument();
  });

  test('shows duplicate username errors from the backend', async () => {
    const user = userEvent.setup();

    mockAuthApi.register.mockRejectedValue(
      new Error('Username "test_user" is already in use.')
    );

    renderRoute('/register', {
      authApi: mockAuthApi,
      authSession: null
    });

    await user.type(screen.getByLabelText('Username'), 'test_user');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      await screen.findByText('Username "test_user" is already in use.')
    ).toBeInTheDocument();
  });

  test('blocks submission when confirmation does not match', async () => {
    const user = userEvent.setup();

    renderRoute('/register', {
      authApi: mockAuthApi,
      authSession: null
    });

    await user.type(screen.getByLabelText('Username'), 'test_user');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockAuthApi.register).not.toHaveBeenCalled();
    expect(await screen.findByText('Passwords must match.')).toBeInTheDocument();
  });
});

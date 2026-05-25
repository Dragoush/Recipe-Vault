import { createTestSession } from '../features/auth/AuthProvider';

export function createMockAuthApi() {
  return {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn()
  };
}

export function createAuthSession(overrides = {}) {
  return createTestSession(overrides);
}

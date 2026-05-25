import { requestJson } from '../api/apiClient';
import { toAuthRequestPayload } from './authFormSchema';

export const AUTH_ROUTES = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
  me: '/api/auth/me'
};

export async function register(values) {
  return requestJson(AUTH_ROUTES.register, {
    method: 'POST',
    body: toAuthRequestPayload(values),
    retryOnUnauthorized: false
  });
}

export async function login(values) {
  return requestJson(AUTH_ROUTES.login, {
    method: 'POST',
    body: toAuthRequestPayload(values),
    retryOnUnauthorized: false
  });
}

export async function refresh(refreshToken) {
  return requestJson(AUTH_ROUTES.refresh, {
    method: 'POST',
    body: { refreshToken },
    retryOnUnauthorized: false
  });
}

export async function logout() {
  return requestJson(AUTH_ROUTES.logout, {
    method: 'POST',
    requiresAuth: true,
    retryOnUnauthorized: false
  });
}

export async function getCurrentUser() {
  return requestJson(AUTH_ROUTES.me, {
    requiresAuth: true
  });
}

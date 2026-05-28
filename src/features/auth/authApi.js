import { requestJson } from '../api/apiClient';
import { toAuthRequestPayload } from './authFormSchema';

export const AUTH_ROUTES = {
  register: 'auth/register',
  login: 'auth/login',
  refresh: 'auth/refresh',
  logout: 'auth/logout',
  me: 'auth/me'
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
    retryOnUnauthorized: false,
    includeCredentials: true
  });
}

export async function refresh() {
  return requestJson(AUTH_ROUTES.refresh, {
    method: 'POST',
    retryOnUnauthorized: false,
    includeCredentials: true
  });
}

export async function logout() {
  return requestJson(AUTH_ROUTES.logout, {
    method: 'POST',
    requiresAuth: true,
    retryOnUnauthorized: false,
    includeCredentials: true
  });
}

export async function getCurrentUser() {
  return requestJson(AUTH_ROUTES.me, {
    requiresAuth: true
  });
}

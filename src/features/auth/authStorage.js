const REFRESH_TOKEN_STORAGE_KEY = 'recipe-vault.refresh-token';

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredRefreshToken(refreshToken) {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearStoredRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

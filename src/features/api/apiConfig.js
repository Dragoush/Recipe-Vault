const backendOrigin = (
  import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '');

const apiPrefix = (import.meta.env.VITE_API_PREFIX ?? '/api')
  .replace(/^([^/])/, '/$1')
  .replace(/\/$/, '');

export const API_BASE_URL = `${backendOrigin}${apiPrefix}`;

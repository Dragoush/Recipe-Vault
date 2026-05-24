import { API_BASE_URL } from './apiRoutes';

export class RecipeApiError extends Error {
  constructor(message, { status = null, detail = null } = {}) {
    super(message);
    this.name = 'RecipeApiError';
    this.status = status;
    this.detail = detail;
  }
}

function buildApiUrl(path, searchParams = {}) {
  const url = new URL(path, `${API_BASE_URL}/`);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildErrorMessage(status, detail) {
  if (status === 404 && typeof detail === 'string') {
    return detail;
  }

  if (status === 422) {
    return 'The server rejected the recipe details. Review the form and try again.';
  }

  if (status >= 500) {
    return 'The server returned an unexpected response. Please try again.';
  }

  return 'The request could not be completed. Please try again.';
}

export async function requestJson(
  path,
  { method = 'GET', body, searchParams } = {}
) {
  let response;

  try {
    response = await fetch(buildApiUrl(path, searchParams), {
      method,
      headers: body
        ? {
            'Content-Type': 'application/json'
          }
        : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new RecipeApiError(
      'The server could not be reached'
    );
  }

  const data = await readJsonSafely(response);

  if (!response.ok) {
    const detail = data?.detail ?? null;

    throw new RecipeApiError(buildErrorMessage(response.status, detail), {
      status: response.status,
      detail
    });
  }

  return data;
}

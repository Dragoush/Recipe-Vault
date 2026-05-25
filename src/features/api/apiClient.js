import { API_BASE_URL } from './apiConfig';

export class ApiError extends Error {
  constructor(message, { status = null, detail = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const defaultClientConfig = {
  getAccessToken: () => null,
  refreshAccessToken: null
};

let clientConfig = { ...defaultClientConfig };

export function configureApiClient(nextConfig = {}) {
  clientConfig = {
    ...defaultClientConfig,
    ...nextConfig
  };
}

export function resetApiClientConfiguration() {
  clientConfig = { ...defaultClientConfig };
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
  if (
    typeof detail === 'string' &&
    [401, 403, 404, 409].includes(status)
  ) {
    return detail;
  }

  if (status === 422) {
    return 'The server rejected the submitted data. Review the form and try again.';
  }

  if (status >= 500) {
    return 'The server returned an unexpected response. Please try again.';
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return 'The request could not be completed. Please try again.';
}

async function executeRequest(
  path,
  {
    method = 'GET',
    body,
    searchParams,
    headers,
    accessToken,
    requiresAuth
  }
) {
  const requestHeaders = new Headers(headers ?? {});
  const hasHeaders = Array.from(requestHeaders.entries()).length > 0;

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (requiresAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const resolvedHeaders = Object.fromEntries(requestHeaders.entries());

  const response = await fetch(buildApiUrl(path, searchParams), {
    method,
    headers:
      hasHeaders || body !== undefined || (requiresAuth && accessToken)
        ? resolvedHeaders
        : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await readJsonSafely(response);

  return {
    response,
    data
  };
}

export async function requestJson(
  path,
  {
    method = 'GET',
    body,
    searchParams,
    headers,
    requiresAuth = false,
    retryOnUnauthorized = true
  } = {}
) {
  let accessToken = requiresAuth ? clientConfig.getAccessToken?.() : null;
  let result;

  try {
    result = await executeRequest(path, {
      method,
      body,
      searchParams,
      headers,
      accessToken,
      requiresAuth
    });
  } catch {
    throw new ApiError(
      'The server could not be reached. Check that the backend is running and try again.'
    );
  }

  if (
    result.response.status === 401 &&
    requiresAuth &&
    retryOnUnauthorized &&
    typeof clientConfig.refreshAccessToken === 'function'
  ) {
    try {
      await clientConfig.refreshAccessToken();
      accessToken = clientConfig.getAccessToken?.();

      result = await executeRequest(path, {
        method,
        body,
        searchParams,
        headers,
        accessToken,
        requiresAuth
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError('Authentication required.', {
        status: 401,
        detail: 'Authentication required.'
      });
    }
  }

  if (!result.response.ok) {
    const detail = result.data?.detail ?? null;

    throw new ApiError(buildErrorMessage(result.response.status, detail), {
      status: result.response.status,
      detail
    });
  }

  return result.data;
}

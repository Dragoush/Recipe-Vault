import {
  configureApiClient,
  requestJson as sharedRequestJson,
  resetApiClientConfiguration
} from '../features/api/apiClient';
import {
  RecipeApiError,
  requestJson as recipeRequestJson
} from '../features/recipes/recipeApiClient';

describe('recipeApiClient', () => {
  afterEach(() => {
    resetApiClientConfiguration();
    vi.restoreAllMocks();
  });

  test('builds request URLs with query params and returns parsed JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ items: [] }))
    });

    const result = await sharedRequestJson('/api/recipes', {
      searchParams: {
        page: 2,
        pageSize: 4
      }
    });

    expect(result).toEqual({ items: [] });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/recipes\?page=2&pageSize=4$/),
      {
        method: 'GET',
        headers: undefined,
        body: undefined
      }
    );
  });

  test('sends JSON bodies for write operations', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ id: 'recipe-1' }))
    });

    await sharedRequestJson('/api/recipes', {
      method: 'POST',
      body: {
        title: 'Roasted Potatoes'
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/recipes$/),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Roasted Potatoes'
        })
      })
    );
  });

  test('returns null for empty successful responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('')
    });

    await expect(
      sharedRequestJson('/api/recipes/recipe-1', {
        method: 'DELETE'
      })
    ).resolves.toBeNull();
  });

  test('throws a 404 api error with the backend detail message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({ detail: 'Recipe "recipe-1" was not found.' })
      )
    });

    await expect(recipeRequestJson('/api/recipes/recipe-1')).rejects.toMatchObject({
      name: 'RecipeApiError',
      status: 404,
      detail: 'Recipe "recipe-1" was not found.',
      message: 'Recipe "recipe-1" was not found.'
    });
  });

  test('maps 422 and 500 responses to friendly messages', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue(JSON.stringify({ detail: [] }))
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('not json')
      });

    await expect(recipeRequestJson('/api/recipes')).rejects.toMatchObject({
      message: 'The server rejected the submitted data. Review the form and try again.'
    });

    await expect(recipeRequestJson('/api/recipes')).rejects.toMatchObject({
      message: 'The server returned an unexpected response. Please try again.'
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('maps network failures to a connection error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(recipeRequestJson('/api/recipes')).rejects.toEqual(
      new RecipeApiError(
        'The server could not be reached. Check that the backend is running and try again.'
      )
    );
  });

  test('attaches the bearer token to authenticated requests', async () => {
    configureApiClient({
      getAccessToken: () => 'access-token'
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ items: [] }))
    });

    await sharedRequestJson('/api/recipes', {
      requiresAuth: true
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/recipes$/),
      expect.objectContaining({
        headers: {
          authorization: 'Bearer access-token'
        }
      })
    );
  });

  test('refreshes once and retries a protected request after a 401', async () => {
    const refreshAccessToken = vi.fn().mockImplementation(() => {
      configureApiClient({
        getAccessToken: () => 'new-token',
        refreshAccessToken
      });
      return Promise.resolve();
    });
    configureApiClient({
      getAccessToken: () => 'stale-token',
      refreshAccessToken
    });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({ detail: 'Authentication required.' })
        )
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ items: [] }))
      });

    await expect(
      sharedRequestJson('/api/recipes', { requiresAuth: true })
    ).resolves.toEqual({ items: [] });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/api\/recipes$/),
      expect.objectContaining({
        headers: {
          authorization: 'Bearer stale-token'
        }
      })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/recipes$/),
      expect.objectContaining({
        headers: {
          authorization: 'Bearer new-token'
        }
      })
    );
  });
});

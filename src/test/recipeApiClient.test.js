import { requestJson, RecipeApiError } from '../features/recipes/recipeApiClient';

describe('recipeApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('builds request URLs with query params and returns parsed JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ items: [] }))
    });

    const result = await requestJson('/api/recipes', {
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

    await requestJson('/api/recipes', {
      method: 'POST',
      body: {
        title: 'Roasted Potatoes'
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/recipes$/),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Roasted Potatoes'
        })
      }
    );
  });

  test('returns null for empty successful responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('')
    });

    await expect(
      requestJson('/api/recipes/recipe-1', {
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

    await expect(requestJson('/api/recipes/recipe-1')).rejects.toMatchObject({
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

    await expect(requestJson('/api/recipes')).rejects.toMatchObject({
      message: 'The server rejected the recipe details. Review the form and try again.'
    });

    await expect(requestJson('/api/recipes')).rejects.toMatchObject({
      message: 'The server returned an unexpected response. Please try again.'
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('maps network failures to a connection error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(requestJson('/api/recipes')).rejects.toEqual(
      new RecipeApiError(
        'The server could not be reached. Check that the backend is running and try again.'
      )
    );
  });
});

import { ApiError, requestJson as sharedRequestJson } from '../api/apiClient';

export class RecipeApiError extends ApiError {
  constructor(message, { status = null, detail = null } = {}) {
    super(message, { status, detail });
    this.name = 'RecipeApiError';
  }
}

export async function requestJson(...args) {
  try {
    return await sharedRequestJson(...args);
  } catch (error) {
    if (error instanceof ApiError) {
      throw new RecipeApiError(error.message, {
        status: error.status,
        detail: error.detail
      });
    }

    throw error;
  }
}

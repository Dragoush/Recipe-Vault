import {
  createInitialState,
  recipesReducer
} from '../features/recipes/recipesContext';

describe('recipesReducer', () => {
  test('keeps the current page inside the valid range after delete', () => {
    const initialState = {
      recipes: [
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' },
        { id: '3', title: 'Three' }
      ],
      currentPage: 2,
      pageSize: 2
    };

    const nextState = recipesReducer(initialState, {
      type: 'deleteRecipe',
      id: '3'
    });

    expect(nextState.currentPage).toBe(1);
    expect(nextState.recipes).toHaveLength(2);
  });

  test('returns an initial state with page 1 and the provided recipes', () => {
    const initialState = createInitialState([{ id: 'alpha' }], 6);

    expect(initialState.currentPage).toBe(1);
    expect(initialState.pageSize).toBe(6);
    expect(initialState.recipes).toEqual([{ id: 'alpha' }]);
  });
});

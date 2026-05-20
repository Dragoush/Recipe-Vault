import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  __resetActiveRecipeSource,
  __setActiveRecipeSource
} from '../features/recipes/activeRecipeSource';
import { createMockRecipeSource } from './mockRecipeSource';
import { renderRoute } from './renderRoute';

const mockRecipeSource = createMockRecipeSource();

describe('Recipe statistics page', () => {
  beforeEach(() => {
    Object.values(mockRecipeSource).forEach((mock) => mock.mockReset());
    __setActiveRecipeSource(mockRecipeSource);
  });

  afterEach(() => {
    __resetActiveRecipeSource();
    vi.restoreAllMocks();
  });

  test('loads and displays the statistics summary', async () => {
    mockRecipeSource.getStatistics.mockResolvedValue({
      totalRecipes: 6,
      countsByCategory: {
        Breakfast: 2,
        Dinner: 3,
        Lunch: 1
      },
      countsByDifficulty: {
        Easy: 4,
        Medium: 2
      },
      averagePrepTimeMinutes: 12.5,
      averageCookTimeMinutes: 22.5,
      averageTotalTimeMinutes: 35
    });

    renderRoute('/recipes/statistics');

    expect(
      await screen.findByRole('heading', { name: 'Recipe Statistics' })
    ).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('12.50 min')).toBeInTheDocument();
    expect(screen.getByText('22.50 min')).toBeInTheDocument();
    expect(screen.getByText('35 min')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  test('shows a retry panel when the statistics request fails', async () => {
    const user = userEvent.setup();

    mockRecipeSource.getStatistics
      .mockRejectedValueOnce(new Error('Statistics are temporarily unavailable.'))
      .mockResolvedValueOnce({
        totalRecipes: 2,
        countsByCategory: {
          Dinner: 2
        },
        countsByDifficulty: {
          Easy: 1,
          Medium: 1
        },
        averagePrepTimeMinutes: 10,
        averageCookTimeMinutes: 20,
        averageTotalTimeMinutes: 30
      });

    renderRoute('/recipes/statistics');

    expect(
      await screen.findByRole('heading', {
        name: "We couldn't load the statistics."
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });
});

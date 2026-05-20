import {
  formatDateLabel,
  formatDuration
} from '../features/recipes/recipeUtils';

describe('recipeUtils', () => {
  test('formats short and long durations for display', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(95)).toBe('1h 35m');
  });

  test('formats stored dates into a friendly label', () => {
    expect(formatDateLabel('2026-04-01T08:00:00.000Z')).toBe('01 Apr 2026');
  });
});

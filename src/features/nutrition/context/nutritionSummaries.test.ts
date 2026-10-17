import MealCache from './cache/MealCache';
import {
  getCaloriesForDateRange,
  getCurrentWeekRollingStats,
  getNutritionForDateRange,
  getStepsForDateRange,
  getTrendData,
  getWeeklyAvgSteps,
} from './nutritionSummaries';

jest.mock('../helpers/weightTrackerUtils', () => ({
  getLocalWeekStart: (date: Date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const dateOfMonth = String(weekStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateOfMonth}`;
  },
}));
jest.mock('../helpers/learningCompletionService', () => ({
  getRollingWeekStats: jest.fn(() => ({
    avgCalories: 200,
    avgProtein: 10,
    avgCarbs: 20,
    avgFats: 5,
    avgSteps: 3000,
    daysLoggedNutrition: 2,
    daysLoggedSteps: 3,
  })),
}));

describe('nutrition summaries', () => {
  const cache = new MealCache();

  beforeEach(() => {
    cache.clear();
    cache.buildFromMeals([
      {
        date: '2026-10-12',
        mealType: 'breakfast',
        foods: [
          { id: 'oats', calories: 150, protein: 5, carbohydrates: 27, fats: 3 },
          { id: 'milk', calories: 70, protein: 4, carbohydrates: 6, fats: 3 },
        ],
      },
      {
        date: '2026-10-13',
        mealType: 'dinner',
        foods: [{ id: 'rice', calories: 200, protein: 4, carbohydrates: 45, fats: 1 }],
      },
    ]);
    cache.setSteps('2026-10-12', 1000);
    cache.setSteps('2026-10-13', 3000);
    cache.setSteps('2026-10-14', 5000);
  });

  it('calculates calories, nutrition totals, and trend summaries for inclusive date ranges', () => {
    const start = new Date(2026, 9, 12);
    const end = new Date(2026, 9, 13);

    expect(getCaloriesForDateRange(cache, start, end)).toEqual([
      { date: '2026-10-12', calories: 220 },
      { date: '2026-10-13', calories: 200 },
    ]);
    expect(getNutritionForDateRange(cache, start, end)).toEqual([
      { date: '2026-10-12', calories: 220, protein: 9, carbs: 33, fat: 6 },
      { date: '2026-10-13', calories: 200, protein: 4, carbs: 45, fat: 1 },
    ]);
    expect(getTrendData(cache, end, 2)).toEqual({
      daily: [
        { date: '2026-10-12', calories: 220 },
        { date: '2026-10-13', calories: 200 },
      ],
      total: 420,
      average: 210,
    });
  });

  it('returns daily steps and averages only completed days when the selected date is today', () => {
    expect(getStepsForDateRange(cache, new Date(2026, 9, 12), new Date(2026, 9, 14))).toEqual([
      { date: '2026-10-12', steps: 1000 },
      { date: '2026-10-13', steps: 3000 },
      { date: '2026-10-14', steps: 5000 },
    ]);
    expect(getWeeklyAvgSteps(cache, new Date(2026, 9, 14), new Date(2026, 9, 14))).toBe(571);
    expect(getWeeklyAvgSteps(cache, new Date(2026, 9, 14), new Date(2026, 9, 15))).toBe(1125);
  });

  it('combines rolling nutrition/step stats with current and previous weekly weights', () => {
    const result = getCurrentWeekRollingStats(cache, [
      { weekStart: '2026-10-12', average: 70, days: { monday: 70, tuesday: 70 } },
      { weekStart: '2026-10-05', average: 71, days: { monday: 71 } },
    ], new Date(2026, 9, 14));

    expect(result).toMatchObject({
      avgWeight: 70,
      prevAvgWeight: 71,
      daysLoggedWeight: 2,
    });
    expect(getCurrentWeekRollingStats(null)).toEqual({
      avgCalories: 0,
      avgSteps: 0,
      avgWeight: null,
      prevAvgWeight: null,
    });
  });
});

import MealCache from './cache/MealCache';
import { buildCategoryData } from './categoryData';

describe('buildCategoryData', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 16, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('counts the same food by identity across meal types and breaks ties by recency', () => {
    const cache = new MealCache();
    const today = '2026-10-16';
    const yesterday = '2026-10-15';

    cache.buildFromMeals([
      { date: yesterday, mealType: 'breakfast', foods: [{ id: 'food-1', productName: 'Oats', calories: 150 }] },
      { date: yesterday, mealType: 'lunch', foods: [{ id: 'food-1', productName: 'Oats', calories: 150 }] },
      { date: today, mealType: 'dinner', foods: [{ id: 'food-2', productName: 'Chicken', calories: 200 }] },
      { date: today, mealType: 'snacks', foods: [{ id: 'food-2', productName: 'Chicken', calories: 200 }] },
    ]);

    const result = buildCategoryData(cache);

    expect(result.frequentFoods.map(food => ({ id: food.id, usageCount: food.usageCount }))).toEqual([
      { id: 'food-2', usageCount: 2 },
      { id: 'food-1', usageCount: 2 },
    ]);
    expect(result.frequentFoods[0].lastUsed).toBe(today);
    expect(result.frequentFoods.map(food => ({ id: food.id, mealType: food.mealType }))).toEqual([
      { id: 'food-2', mealType: 'snacks' },
      { id: 'food-1', mealType: 'lunch' },
    ]);
  });

  test('counts repeated additions consolidated into one meal entry', () => {
    const cache = new MealCache();
    const today = '2026-10-16';
    cache.buildFromMeals([
      { date: today, mealType: 'breakfast', foods: [{ id: 'food-1', productName: 'Oats', calories: 300, usageCount: 3 }] },
    ]);

    const result = buildCategoryData(cache);

    expect(result.frequentFoods).toHaveLength(1);
    expect(result.frequentFoods[0].usageCount).toBe(3);
  });
});

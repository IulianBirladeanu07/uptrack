import MealCache from './cache/MealCache';
import { buildCategoryData } from './categoryData';

describe('buildCategoryData', () => {
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
  });
});

import type { LoggedFood, MealType } from '../../../shared/types';
import MealCache from './cache/MealCache';
import { buildCategoryData } from './categoryData';
import { formatDate } from '../utils/dateUtils';

describe('buildCategoryData recent meals', () => {
  it('keeps all meal entries in the recent 30-day cache range', () => {
    const cache = new MealCache();
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const today = new Date();

    for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      const dateKey = formatDate(date);
      const meals = { breakfast: [], lunch: [], dinner: [], snacks: [] } as Record<MealType, LoggedFood[]>;

      mealTypes.forEach(mealType => {
        meals[mealType] = [{ id: `${dateKey}-${mealType}`, calories: 100 }];
      });

      cache.set(dateKey, meals);
    }

    const recentMeals = buildCategoryData(cache).recentMeals;

    expect(recentMeals).toHaveLength(40);
    expect(recentMeals.slice(0, 4).map(meal => meal.mealType)).toEqual([
      'snacks',
      'dinner',
      'lunch',
      'breakfast',
    ]);
  });
});

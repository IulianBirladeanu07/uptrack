import MealCache from './MealCache';
import type { LoggedFood, MealGroup, MealType } from '../../../../shared/types';

describe('MealCache date ranges', () => {
  it('interprets date-only range strings as local calendar dates', () => {
    const cache = new MealCache();

    expect(cache.getDateRange('2026-10-15', '2026-10-16').map(day => day.date)).toEqual([
      '2026-10-15',
      '2026-10-16',
    ]);
  });

  it('uses local dates for step ranges too', () => {
    const cache = new MealCache();
    cache.setSteps('2026-10-15', 5000);
    cache.setSteps('2026-10-16', 6000);

    expect(cache.getStepsRange('2026-10-15', '2026-10-16')).toEqual([
      { date: '2026-10-15', steps: 5000 },
      { date: '2026-10-16', steps: 6000 },
    ]);
  });
});

describe('MealCache buildFromMeals', () => {
  const food = (id: string) => ({ id, calories: 100 }) as LoggedFood;
  const group = (date: string, mealType: MealType, ...ids: string[]): MealGroup => ({
    date,
    mealType,
    foods: ids.map(food),
  });
  const ids = (cache: MealCache, date: string, mealType: MealType) =>
    cache.get(date)[mealType].map(item => item.id);

  it('replaces everything with the loaded meals when nothing was edited locally', () => {
    const cache = new MealCache();
    cache.buildFromMeals([group('2026-10-17', 'lunch', 'old'), group('2026-10-16', 'dinner', 'older')]);

    cache.buildFromMeals([group('2026-10-17', 'lunch', 'new')]);

    expect(ids(cache, '2026-10-17', 'lunch')).toEqual(['new']);
    expect(cache.has('2026-10-16')).toBe(false);
  });

  it('keeps a meal edited since the cache was built and takes server data for the rest', () => {
    const cache = new MealCache();
    cache.buildFromMeals([group('2026-10-17', 'lunch', 'old'), group('2026-10-17', 'dinner', 'old-dinner')]);
    cache.updateMealType('2026-10-17', 'lunch', [food('added')]);

    cache.buildFromMeals([
      group('2026-10-17', 'lunch', 'server-lunch'),
      group('2026-10-17', 'dinner', 'server-dinner'),
      group('2026-10-16', 'snacks', 'server-snack'),
    ]);

    expect(ids(cache, '2026-10-17', 'lunch')).toEqual(['added']);
    expect(ids(cache, '2026-10-17', 'dinner')).toEqual(['server-dinner']);
    expect(ids(cache, '2026-10-16', 'snacks')).toEqual(['server-snack']);
  });

  it('keeps an edited meal on a day the loaded meals do not include', () => {
    const cache = new MealCache();
    cache.set('2026-10-17', { breakfast: [], lunch: [], dinner: [], snacks: [] });
    cache.updateMealType('2026-10-17', 'breakfast', [food('added')]);

    cache.buildFromMeals([]);

    expect(ids(cache, '2026-10-17', 'breakfast')).toEqual(['added']);
  });

  it('keeps a meal that was edited back to empty', () => {
    const cache = new MealCache();
    cache.buildFromMeals([group('2026-10-17', 'lunch', 'old')]);
    cache.updateMealType('2026-10-17', 'lunch', []);

    cache.buildFromMeals([group('2026-10-17', 'lunch', 'old')]);

    expect(ids(cache, '2026-10-17', 'lunch')).toEqual([]);
  });

  it('forgets local edits after clear', () => {
    const cache = new MealCache();
    cache.set('2026-10-17', { breakfast: [], lunch: [], dinner: [], snacks: [] });
    cache.updateMealType('2026-10-17', 'lunch', [food('added')]);
    cache.clear();

    cache.buildFromMeals([group('2026-10-17', 'lunch', 'server')]);

    expect(ids(cache, '2026-10-17', 'lunch')).toEqual(['server']);
  });

  it('does not bring back a day that is no longer cached', () => {
    const cache = new MealCache(1);
    cache.set('2026-10-16', { breakfast: [], lunch: [], dinner: [], snacks: [] });
    cache.updateMealType('2026-10-16', 'lunch', [food('added')]);
    cache.set('2026-10-17', { breakfast: [], lunch: [], dinner: [], snacks: [] });

    cache.buildFromMeals([]);

    expect(cache.has('2026-10-16')).toBe(false);
  });
});

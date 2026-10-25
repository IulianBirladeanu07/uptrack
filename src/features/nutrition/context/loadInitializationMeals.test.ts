jest.mock('../services/mealService', () => ({ fetchLast30DaysMeals: jest.fn() }));
jest.mock('./cache/mealCacheStorage', () => ({ loadPersistedMealCache: jest.fn() }));
jest.mock('../services/pendingMealWrites', () => ({
  flushPendingMealWrites: jest.fn(),
  loadPendingMealWrites: jest.fn(),
  overlayPendingMealWrites: (meals: { date: string; mealType: string; foods: unknown[] }[], writes: { date: string; mealType: string; foods: unknown[] }[]) => {
    const byKey = new Map(meals.map(meal => [`${meal.date}:${meal.mealType}`, meal]));
    writes.forEach(write => byKey.set(`${write.date}:${write.mealType}`, {
      date: write.date,
      mealType: write.mealType,
      foods: write.foods,
    }));
    return [...byKey.values()];
  },
}));

import { fetchLast30DaysMeals } from '../services/mealService';
import { loadPersistedMealCache } from './cache/mealCacheStorage';
import { flushPendingMealWrites, loadPendingMealWrites } from '../services/pendingMealWrites';
import { loadInitializationMeals } from './loadInitializationMeals';
import type { LoggedFood } from '../../../shared/types';

const serverFood: LoggedFood = { id: 'server', calories: 100 };
const queuedFood: LoggedFood = { id: 'queued', calories: 200 };

describe('loadInitializationMeals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadPersistedMealCache as jest.Mock).mockResolvedValue(null);
    (loadPendingMealWrites as jest.Mock).mockResolvedValue([]);
    (fetchLast30DaysMeals as jest.Mock).mockResolvedValue([]);
    (flushPendingMealWrites as jest.Mock).mockResolvedValue([]);
  });

  it('overlays queued changes on both cache and server meals and starts a background retry', async () => {
    (loadPersistedMealCache as jest.Mock).mockResolvedValue([
      { date: '2026-10-24', mealType: 'breakfast', foods: [serverFood] },
    ]);
    (loadPendingMealWrites as jest.Mock).mockResolvedValue([{
      id: 'pending-1', date: '2026-10-24', mealType: 'breakfast', foods: [queuedFood],
    }]);
    (fetchLast30DaysMeals as jest.Mock).mockResolvedValue([
      { date: '2026-10-24', mealType: 'breakfast', foods: [serverFood] },
    ]);
    const cached = jest.fn();
    const fresh = jest.fn();
    const pendingCount = jest.fn();

    await loadInitializationMeals({
      uid: 'user-1',
      isCurrentRequest: () => true,
      onCachedMeals: cached,
      onFreshMeals: fresh,
      onPendingWritesChanged: pendingCount,
    });

    expect(cached).toHaveBeenCalledWith([
      { date: '2026-10-24', mealType: 'breakfast', foods: [queuedFood] },
    ]);
    expect(fresh).toHaveBeenCalledWith([
      { date: '2026-10-24', mealType: 'breakfast', foods: [queuedFood] },
    ], true);
    expect(pendingCount).toHaveBeenCalledWith(1);
    expect(flushPendingMealWrites).toHaveBeenCalledWith('user-1');
  });
});

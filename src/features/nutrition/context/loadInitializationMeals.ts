import { fetchLast30DaysMeals } from '../services/mealService';
import { loadPersistedMealCache } from './cache/mealCacheStorage';
import { flushPendingMealWrites, loadPendingMealWrites, overlayPendingMealWrites } from '../services/pendingMealWrites';
import type { MealGroup } from '../../../shared/types';

type LoadInitializationMealsOptions = {
  uid: string;
  isCurrentRequest: () => boolean;
  onCachedMeals: (meals: MealGroup[]) => void;
  onFreshMeals: (meals: MealGroup[], hadCachedMeals: boolean) => void;
  onPendingWritesChanged: (count: number) => void;
};

export const loadInitializationMeals = async ({
  uid,
  isCurrentRequest,
  onCachedMeals,
  onFreshMeals,
  onPendingWritesChanged,
}: LoadInitializationMealsOptions): Promise<void> => {
  const [cachedMeals, pendingWrites] = await Promise.all([
    loadPersistedMealCache(uid),
    loadPendingMealWrites(uid),
  ]);
  if (!isCurrentRequest()) return;

  onPendingWritesChanged(pendingWrites.length);
  if (cachedMeals || pendingWrites.length) {
    onCachedMeals(overlayPendingMealWrites(cachedMeals || [], pendingWrites));
  }

  const freshMeals = await fetchLast30DaysMeals(uid);
  if (isCurrentRequest()) onFreshMeals(overlayPendingMealWrites(freshMeals, pendingWrites), !!cachedMeals || pendingWrites.length > 0);
  void flushPendingMealWrites(uid)
    .then(remainingWrites => {
      if (isCurrentRequest()) onPendingWritesChanged(remainingWrites.length);
    })
    .catch(error => console.error('[FoodContext] pending meal writes flush failed:', error));
};

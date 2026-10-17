import { fetchLast30DaysMeals } from '../services/mealService';
import { loadPersistedMealCache } from './cache/mealCacheStorage';
import type { MealGroup } from '../../../shared/types';

type LoadInitializationMealsOptions = {
  uid: string;
  isCurrentRequest: () => boolean;
  onCachedMeals: (meals: MealGroup[]) => void;
  onFreshMeals: (meals: MealGroup[], hadCachedMeals: boolean) => void;
};

export const loadInitializationMeals = async ({
  uid,
  isCurrentRequest,
  onCachedMeals,
  onFreshMeals,
}: LoadInitializationMealsOptions): Promise<void> => {
  const cachedMeals = await loadPersistedMealCache(uid);
  if (!isCurrentRequest()) return;

  if (cachedMeals) onCachedMeals(cachedMeals);

  const freshMeals = await fetchLast30DaysMeals(uid);
  if (isCurrentRequest()) onFreshMeals(freshMeals, !!cachedMeals);
};

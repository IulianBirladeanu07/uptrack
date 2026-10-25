import { enqueuePendingMealWrite, flushPendingMealWrites } from '../services/pendingMealWrites';
import type { LoggedFood, MealType } from '../../../shared/types';

type OptimisticMealWriteOptions = {
  uid: string;
  mealType: MealType;
  dateKey: string;
  nextFoods: LoggedFood[];
  getCurrentFoods: () => LoggedFood[];
  updateFoods: (foods: LoggedFood[]) => void;
  persistCache: () => void;
  isCurrentRequest: () => boolean;
  rollback: (currentFoods: LoggedFood[]) => LoggedFood[] | null;
  onPendingWritesChanged?: (count: number) => void;
};

export const persistOptimisticMealWrite = async ({
  uid,
  mealType,
  dateKey,
  nextFoods,
  getCurrentFoods,
  updateFoods,
  persistCache,
  isCurrentRequest,
  rollback,
  onPendingWritesChanged,
}: OptimisticMealWriteOptions): Promise<void> => {
  updateFoods(nextFoods);
  persistCache();

  try {
    const pending = await enqueuePendingMealWrite(uid, dateKey, mealType, nextFoods);
    onPendingWritesChanged?.(pending.length);
  } catch (error) {
    if (isCurrentRequest()) {
      const previousFoods = rollback(getCurrentFoods());
      if (previousFoods) {
        updateFoods(previousFoods);
        persistCache();
      }
    }
    throw error;
  }

  const pending = await flushPendingMealWrites(uid);
  onPendingWritesChanged?.(pending.length);
};

import { writeMealType } from '../services/mealService';
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
}: OptimisticMealWriteOptions): Promise<void> => {
  updateFoods(nextFoods);
  persistCache();

  try {
    await writeMealType(uid, mealType, nextFoods, dateKey);
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
};

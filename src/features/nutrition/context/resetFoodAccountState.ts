import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import type { FoodCategories, MealsByType } from '../../../shared/types';
import type MealCache from './cache/MealCache';

type ResetFoodAccountStateOperations = {
  userGenerationRef: MutableRefObject<number>;
  initializationRef: MutableRefObject<boolean>;
  resetBackgroundEvaluationFlags: () => void;
  resetStepsFlusher: () => void;
  mealCache: MealCache;
  setCategoryData: Dispatch<SetStateAction<FoodCategories>>;
  setMealState: Dispatch<SetStateAction<MealsByType>>;
  setDailySteps: Dispatch<SetStateAction<number>>;
  setStepsVersion: Dispatch<SetStateAction<number>>;
  setStepsLoading: Dispatch<SetStateAction<boolean>>;
  setStepsError: Dispatch<SetStateAction<string | null>>;
  setStepsConnected: Dispatch<SetStateAction<boolean | null>>;
  setCacheVersion: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setInitialLoadComplete: Dispatch<SetStateAction<boolean>>;
  setInitializationError: Dispatch<SetStateAction<string | null>>;
  setFreshMealsLoaded: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setPendingMealWriteCount: Dispatch<SetStateAction<number>>;
};

export const resetFoodAccountState = (
  user: User | null,
  operations: ResetFoodAccountStateOperations,
): void => {
  operations.userGenerationRef.current++;
  operations.initializationRef.current = false;
  operations.resetBackgroundEvaluationFlags();
  operations.resetStepsFlusher();
  operations.mealCache.clear();
  operations.setCategoryData({ recentMeals: [], frequentFoods: [], favoriteFoods: [] });
  operations.setMealState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
  operations.setDailySteps(0);
  operations.setStepsVersion(0);
  operations.setStepsLoading(false);
  operations.setStepsError(null);
  operations.setStepsConnected(null);
  operations.setCacheVersion(0);
  operations.setError(null);
  operations.setInitialLoadComplete(false);
  operations.setInitializationError(null);
  operations.setFreshMealsLoaded(false);
  operations.setLoading(!!user);
  operations.setPendingMealWriteCount(0);
};

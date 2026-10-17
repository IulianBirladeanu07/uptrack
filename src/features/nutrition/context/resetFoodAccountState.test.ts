import type { User } from 'firebase/auth';
import MealCache from './cache/MealCache';
import { resetFoodAccountState } from './resetFoodAccountState';

const user = { uid: 'user-2' } as User;

const createOperations = () => ({
  userGenerationRef: { current: 4 },
  initializationRef: { current: true },
  resetBackgroundEvaluationFlags: jest.fn(),
  resetStepsFlusher: jest.fn(),
  mealCache: new MealCache(),
  setCategoryData: jest.fn(),
  setMealState: jest.fn(),
  setDailySteps: jest.fn(),
  setStepsVersion: jest.fn(),
  setStepsLoading: jest.fn(),
  setStepsError: jest.fn(),
  setStepsConnected: jest.fn(),
  setCacheVersion: jest.fn(),
  setError: jest.fn(),
  setInitialLoadComplete: jest.fn(),
  setInitializationError: jest.fn(),
  setFreshMealsLoaded: jest.fn(),
  setLoading: jest.fn(),
});

describe('resetFoodAccountState', () => {
  it('invalidates pending work and clears account-scoped state before the next user loads', () => {
    const operations = createOperations();
    operations.mealCache.set('2026-10-17', {
      breakfast: [{ id: 'food-1', productName: 'Oats', calories: 100 }],
      lunch: [],
      dinner: [],
      snacks: [],
    });
    operations.mealCache.setSteps('2026-10-17', 8000);

    resetFoodAccountState(user, operations);

    expect(operations.userGenerationRef.current).toBe(5);
    expect(operations.initializationRef.current).toBe(false);
    expect(operations.resetBackgroundEvaluationFlags).toHaveBeenCalledTimes(1);
    expect(operations.resetStepsFlusher).toHaveBeenCalledTimes(1);
    expect(operations.mealCache.data.size).toBe(0);
    expect(operations.mealCache.stepsData.size).toBe(0);
    expect(operations.setCategoryData).toHaveBeenCalledWith({
      recentMeals: [],
      frequentFoods: [],
      favoriteFoods: [],
    });
    expect(operations.setMealState).toHaveBeenCalledWith({
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    });
    expect(operations.setDailySteps).toHaveBeenCalledWith(0);
    expect(operations.setStepsVersion).toHaveBeenCalledWith(0);
    expect(operations.setStepsLoading).toHaveBeenCalledWith(false);
    expect(operations.setStepsError).toHaveBeenCalledWith(null);
    expect(operations.setStepsConnected).toHaveBeenCalledWith(null);
    expect(operations.setCacheVersion).toHaveBeenCalledWith(0);
    expect(operations.setError).toHaveBeenCalledWith(null);
    expect(operations.setInitialLoadComplete).toHaveBeenCalledWith(false);
    expect(operations.setInitializationError).toHaveBeenCalledWith(null);
    expect(operations.setFreshMealsLoaded).toHaveBeenCalledWith(false);
    expect(operations.setLoading).toHaveBeenCalledWith(true);
  });

  it('leaves loading false when the account is signed out', () => {
    const operations = createOperations();

    resetFoodAccountState(null, operations);

    expect(operations.setLoading).toHaveBeenCalledWith(false);
  });
});

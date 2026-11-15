import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { User } from 'firebase/auth';
import { checkAndCompleteLearning } from '../helpers/learningCompletionService';
import { useFoodBackgroundEvaluations } from './useFoodBackgroundEvaluations';
import MealCache from './cache/MealCache';
import type { EnhancedLearningData } from '../../../shared/types';

jest.mock('../helpers/learningCompletionService', () => ({
  checkAndCompleteLearning: jest.fn().mockResolvedValue(null),
}));

describe('useFoodBackgroundEvaluations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('waits for the user profile to finish loading before completing learning', async () => {
    const options = {
      currentUser: { uid: 'user-1' } as User,
      learningData: { isLearningComplete: true } as EnhancedLearningData,
      hasTargets: false,
      profileLoading: true,
      selectedDate: new Date('2026-02-10'),
      mealCache: new MealCache(),
      userData: null,
      stepsConnected: null,
      freshMealsLoaded: false,
      isMounted: () => true,
      getCurrentUserUid: () => 'user-1',
      getGeneration: () => 1,
      refreshUserData: jest.fn().mockResolvedValue(undefined),
      handleError: jest.fn(),
    };
    const { rerender } = renderHook(
      ({ profileLoading }) => useFoodBackgroundEvaluations({ ...options, profileLoading }),
      { initialProps: { profileLoading: true } },
    );

    expect(checkAndCompleteLearning).not.toHaveBeenCalled();

    await act(async () => {
      rerender({ profileLoading: false });
    });

    await waitFor(() => expect(checkAndCompleteLearning).toHaveBeenCalledTimes(1));
  });
});

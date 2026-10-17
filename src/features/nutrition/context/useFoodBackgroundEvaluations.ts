import { useCallback, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  checkAndBackfillStepsBonus,
  checkAndCompleteLearning,
  checkAndRunWeeklyEval,
} from '../helpers/learningCompletionService';
import { isCurrentUserRequest } from '../utils/userRequest';
import type { EnhancedLearningData, MealCacheLike, UserData } from '../../../shared/types';

type FoodBackgroundEvaluationsOptions = {
  currentUser: User | null;
  learningData: EnhancedLearningData;
  hasTargets: boolean;
  selectedDate: Date;
  mealCache: MealCacheLike;
  userData: UserData | null;
  stepsConnected: boolean | null;
  freshMealsLoaded: boolean;
  isMounted: () => boolean;
  getCurrentUserUid: () => string | undefined;
  getGeneration: () => number;
  refreshUserData: () => Promise<unknown>;
  handleError: (error: unknown, context: string) => void;
};

export const useFoodBackgroundEvaluations = ({
  currentUser,
  learningData,
  hasTargets,
  selectedDate,
  mealCache,
  userData,
  stepsConnected,
  freshMealsLoaded,
  isMounted,
  getCurrentUserUid,
  getGeneration,
  refreshUserData,
  handleError,
}: FoodBackgroundEvaluationsOptions) => {
  const stepsBonusCheckedRef = useRef(false);
  const weeklyEvalCheckedRef = useRef(false);

  const resetBackgroundEvaluationFlags = useCallback(() => {
    stepsBonusCheckedRef.current = false;
    weeklyEvalCheckedRef.current = false;
  }, []);

  useEffect(() => {
    const checkLearningCompletion = async () => {
      if (currentUser && learningData.isLearningComplete && !hasTargets) {
        const request = { uid: currentUser.uid, generation: getGeneration() };
        try {
          const newTargets = await checkAndCompleteLearning(
            currentUser.uid, mealCache, selectedDate, hasTargets
          );
          if (
            newTargets &&
            isMounted() &&
            isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())
          ) await refreshUserData();
        } catch (error) {
          console.error('Failed to complete learning phase:', error);
          if (isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())) {
            handleError(error, 'complete learning phase');
          }
        }
      }
    };
    checkLearningCompletion();
  }, [currentUser, learningData.isLearningComplete, hasTargets, selectedDate, handleError, refreshUserData]);

  useEffect(() => {
    if (!currentUser || !stepsConnected || !userData || stepsBonusCheckedRef.current) return;
    stepsBonusCheckedRef.current = true;

    const runStepsBonusBackfill = async () => {
      const request = { uid: currentUser.uid, generation: getGeneration() };
      try {
        const result = await checkAndBackfillStepsBonus(
          currentUser.uid, userData, mealCache, new Date()
        );
        if (
          result &&
          isMounted() &&
          isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())
        ) {
          await refreshUserData();
        }
      } catch (error) {
        if (isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())) {
          console.error('Failed to backfill steps bonus:', error);
        }
      }
    };
    runStepsBonusBackfill();
  }, [currentUser, stepsConnected, userData, refreshUserData]);

  useEffect(() => {
    if (!currentUser || !freshMealsLoaded || !userData || weeklyEvalCheckedRef.current) return;
    weeklyEvalCheckedRef.current = true;

    const runWeeklyEval = async () => {
      const request = { uid: currentUser.uid, generation: getGeneration() };
      try {
        const adjustment = await checkAndRunWeeklyEval(currentUser.uid, userData, mealCache);
        if (
          adjustment &&
          isMounted() &&
          isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())
        ) {
          await refreshUserData();
        }
      } catch (error) {
        if (isCurrentUserRequest(request, getCurrentUserUid(), getGeneration())) {
          console.error('Failed to run weekly evaluation:', error);
        }
      }
    };
    runWeeklyEval();
  }, [currentUser, freshMealsLoaded, userData, refreshUserData]);

  return resetBackgroundEvaluationFlags;
};

import { arrayUnion } from 'firebase/firestore';
import { mergeUserProfile } from '../../auth/services/userProfileQuery';
import { calculateWeightChangePlan, calculateMacros } from '../../profile/utils/nutritionPlanEngine';
import type { PhaseHistoryEntry, UserData, WeightChangePlan } from '../../../shared/types';

type SwitchInput = { weight: number; kcal: number; entry: PhaseHistoryEntry };

export const switchToMaintenance = async (userId: string, userData: UserData, { weight, kcal, entry }: SwitchInput): Promise<void> => {
  const now = new Date().toISOString();
  const w = Number(weight.toFixed(1));

  const base = calculateWeightChangePlan({
    ...userData,
    currentWeight: w,
    targetWeight: w,
    fitnessGoals: 'maintenance',
  });
  const macros = calculateMacros('maintenance', kcal, w);
  const plan: WeightChangePlan = { ...base, tdee: kcal, goalCalories: kcal, macros, isEstimate: false };

  await mergeUserProfile(userId, {
      currentWeight: w,
      targetWeight: w,
      fitnessGoals: 'maintenance',
      weightChangePlan: plan,
      targetCalories: kcal,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFats: macros.fats,
      maintenanceCalories: kcal,
      maintenanceUpdatedAt: now,
      lastNutritionUpdate: now,
      lastCalorieAdjustment: null,
      lastAdjustmentDate: null,
      slowEvalPending: false,
      stepsBonusAppliedAt: now,
      goalSwitchDate: now,
      weeksSinceCutStart: 0,
      startWeight: w,
      phaseHistory: arrayUnion(entry),
    }, true);
};

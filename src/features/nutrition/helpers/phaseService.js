import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { calculateWeightChangePlan, calculateMacros } from '../../profile/utils/nutritionPlanEngine';

export const switchToMaintenance = async (userId, userData, { weight, kcal, entry }) => {
  const now = new Date().toISOString();
  const w = Number(weight.toFixed(1));

  const base = calculateWeightChangePlan({
    ...userData,
    currentWeight: w,
    targetWeight: w,
    fitnessGoals: 'maintenance',
  });
  const macros = calculateMacros('maintenance', kcal, w);
  const plan = { ...base, tdee: kcal, goalCalories: kcal, macros, isEstimate: false };

  await setDoc(
    doc(db, 'users', userId),
    {
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
    },
    { merge: true },
  );
};

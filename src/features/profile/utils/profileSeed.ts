import type { UserData } from '../../../shared/types';
import { deriveFitnessGoal } from './nutritionPlanEngine';

type UserDataLike = UserData | null | undefined;

export type ProfileFormSeed = {
  age: number;
  height: number;
  gender: string;
  currentWeight: number;
  targetWeight: number;
  activityLevel: string;
  experienceLevel: string;
  stressLevel: string;
  autoAdjustEnabled: boolean;
  fitnessGoals: 'weight_loss' | 'muscle_gain' | 'maintenance';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

export type ProfileIdentitySeed = {
  username: string;
  email: string;
};

export const seedProfileForm = (userData: UserDataLike): ProfileFormSeed => {
  const currentWeight = (userData?.currentWeight as number | undefined) || 80;
  const targetWeight = (userData?.targetWeight as number | undefined) || 80;
  const planMacros = userData?.weightChangePlan?.macros;
  return {
    age: (userData?.age as number | undefined) || 24,
    height: (userData?.height as number | undefined) || 175,
    gender: userData?.gender || 'male',
    currentWeight,
    targetWeight,
    activityLevel: userData?.activityLevel || 'moderately_active',
    experienceLevel: userData?.experienceLevel || 'intermediate',
    stressLevel: userData?.stressLevel || 'moderate',
    autoAdjustEnabled: userData?.autoAdjustEnabled ?? true,
    fitnessGoals: userData?.weightChangePlan?.type
      ?? userData?.fitnessGoals
      ?? deriveFitnessGoal(currentWeight, targetWeight),
    targetCalories: userData?.targetCalories ?? userData?.weightChangePlan?.goalCalories ?? 2000,
    targetProtein: userData?.targetProtein ?? planMacros?.protein ?? 150,
    targetCarbs: userData?.targetCarbs ?? planMacros?.carbs ?? 200,
    targetFats: userData?.targetFats ?? planMacros?.fats ?? 60,
  };
};

export const seedProfileIdentity = (
  userData: UserDataLike,
  authEmail?: string | null,
): ProfileIdentitySeed => ({
  username: userData?.username || '',
  email: userData?.email || authEmail || '',
});

export const seedProfilePicture = (userData: UserDataLike): string | null =>
  userData?.profilePicture || null;

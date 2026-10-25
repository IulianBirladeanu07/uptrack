import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import type { OnboardingFormData, PlanType, UserData, WeightChangePlan } from '../../../shared/types';
import { useSaveUserProfile } from '../../auth/services/useSaveUserProfile';

type PlanConfirmationParams = {
  formData: OnboardingFormData;
  derivedGoal: PlanType;
  plan: WeightChangePlan;
  refreshUserData: () => Promise<UserData | undefined>;
  setProfileSetupComplete: Dispatch<SetStateAction<boolean>>;
};

export const usePlanConfirmation = ({
  formData,
  derivedGoal,
  plan,
  refreshUserData,
  setProfileSetupComplete,
}: PlanConfirmationParams) => {
  const [saving, setSaving] = useState(false);
  const saveUserProfile = useSaveUserProfile();

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    const user = getAuth().currentUser;

    if (!user) {
      Alert.alert('Error', 'No user is logged in.');
      setSaving(false);
      return;
    }

    const now = new Date().toISOString();

    const userData = {
      ...formData,
      fitnessGoals: derivedGoal,
      profileSetupComplete: true,
      weightChangePlan: plan,
      targetCalories: plan.goalCalories,
      targetProtein: plan.macros.protein,
      targetCarbs: plan.macros.carbs,
      targetFats: plan.macros.fats,
      maintenanceCalories: plan.tdee,
      targetsSource: 'formula',
      targetsInitializedAt: now,
      weeksSinceCutStart: 0,
      startWeight: formData.currentWeight,
      goalSwitchDate: now,
      autoAdjustEnabled: true,
      planConfidence: 'estimated',
    };

    try {
      await saveUserProfile.mutateAsync({ uid: user.uid, data: userData });
    } catch (error) {
      console.error('PlanSummaryScreen save error:', error);
      Alert.alert('Error', 'Failed to save your plan. Please try again.');
      setSaving(false);
      return;
    }

    try {
      const data = await refreshUserData();
      if (data === undefined) {
        Alert.alert('Error', 'Your plan was saved, but we could not load your profile. Please try again.');
        setSaving(false);
        return;
      }
    } catch (error) {
      console.error('PlanSummaryScreen refresh error:', error);
      Alert.alert('Error', 'Your plan was saved, but we could not load your profile. Please try again.');
      setSaving(false);
      return;
    }

    setProfileSetupComplete(true);
  }, [derivedGoal, formData, plan, refreshUserData, saveUserProfile, setProfileSetupComplete]);

  return { saving, handleConfirm };
};

import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { Auth, User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { OnboardingFormData, PlanType, UserData, WeightChangePlan } from '../../../shared/types';
import { usePlanConfirmation } from './usePlanConfirmation';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({
  db: {},
}));

const alert = jest.mocked(Alert.alert);
const auth = jest.mocked(getAuth);
const getDocument = jest.mocked(doc);
const saveDocument = jest.mocked(setDoc);

const formData: OnboardingFormData = {
  gender: 'female',
  age: 30,
  height: 170,
  currentWeight: 70,
  targetWeight: 65,
  activityLevel: 'moderately_active',
};
const derivedGoal: PlanType = 'weight_loss';
const plan: WeightChangePlan = {
  type: derivedGoal,
  ratePerWeek: 0.3,
  ratePerMonth: 1.2,
  goalCalories: 1900,
  macros: { protein: 140, carbs: 200, fats: 60 },
  bmr: 1500,
  tdee: 2200,
  weeksToGoal: 16,
  estimatedDate: '2026-12-01',
  isEstimate: true,
};
const user = { uid: 'user-1' } as User;

const createParams = (overrides: Partial<Parameters<typeof usePlanConfirmation>[0]> = {}) => ({
  formData,
  derivedGoal,
  plan,
  refreshUserData: jest.fn().mockResolvedValue({} as UserData),
  setProfileSetupComplete: jest.fn(),
  ...overrides,
});

describe('usePlanConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockReturnValue({ currentUser: user } as Auth);
    getDocument.mockReturnValue({} as ReturnType<typeof doc>);
    saveDocument.mockResolvedValue(undefined);
  });

  it('saves the calculated plan, refreshes the profile, and completes onboarding', async () => {
    const params = createParams();
    const { result } = renderHook(() => usePlanConfirmation(params));

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(getDocument).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1');
    expect(saveDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
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
        weeksSinceCutStart: 0,
        startWeight: formData.currentWeight,
        autoAdjustEnabled: true,
        planConfidence: 'estimated',
        targetsInitializedAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
        goalSwitchDate: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
      }),
      { merge: true },
    );
    expect(params.refreshUserData).toHaveBeenCalledTimes(1);
    expect(params.setProfileSetupComplete).toHaveBeenCalledWith(true);
    expect(result.current.saving).toBe(true);
  });

  it('reports a missing authenticated user without writing', async () => {
    auth.mockReturnValue({ currentUser: null } as Auth);
    const { result } = renderHook(() => usePlanConfirmation(createParams()));

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(alert).toHaveBeenCalledWith('Error', 'No user is logged in.');
    expect(saveDocument).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('reports save failures and leaves onboarding incomplete', async () => {
    saveDocument.mockRejectedValue(new Error('write failed'));
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const params = createParams();
    const { result } = renderHook(() => usePlanConfirmation(params));

    try {
      await act(async () => {
        await result.current.handleConfirm();
      });

      expect(logError).toHaveBeenCalledWith('PlanSummaryScreen save error:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error', 'Failed to save your plan. Please try again.');
      expect(params.refreshUserData).not.toHaveBeenCalled();
      expect(params.setProfileSetupComplete).not.toHaveBeenCalled();
      expect(result.current.saving).toBe(false);
    } finally {
      logError.mockRestore();
    }
  });

  it('reports when the saved profile cannot be refreshed', async () => {
    const params = createParams({ refreshUserData: jest.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => usePlanConfirmation(params));

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(alert).toHaveBeenCalledWith(
      'Error',
      'Your plan was saved, but we could not load your profile. Please try again.',
    );
    expect(params.setProfileSetupComplete).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('logs and reports refresh errors without completing onboarding', async () => {
    const refreshError = new Error('refresh failed');
    const params = createParams({ refreshUserData: jest.fn().mockRejectedValue(refreshError) });
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => usePlanConfirmation(params));

    try {
      await act(async () => {
        await result.current.handleConfirm();
      });

      expect(logError).toHaveBeenCalledWith('PlanSummaryScreen refresh error:', refreshError);
      expect(alert).toHaveBeenCalledWith(
        'Error',
        'Your plan was saved, but we could not load your profile. Please try again.',
      );
      expect(params.setProfileSetupComplete).not.toHaveBeenCalled();
      expect(result.current.saving).toBe(false);
    } finally {
      logError.mockRestore();
    }
  });
});

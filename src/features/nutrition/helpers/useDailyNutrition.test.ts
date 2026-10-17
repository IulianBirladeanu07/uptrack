import { createElement } from 'react';
import { renderHook } from '@testing-library/react-native';
import { AuthContext, type AuthContextValue } from '../../auth/context/AuthContext';
import useDailyNutrition from './useDailyNutrition';

jest.mock('../../auth/context/AuthContext', () => ({
  AuthContext: require('react').createContext(undefined),
}));

const wrapWithUserData = (userData: Record<string, number | null | undefined>) => {
  const value = { userData } as AuthContextValue;
  return ({ children }: { children: React.ReactNode }) =>
    createElement(AuthContext.Provider, { value }, children);
};

describe('useDailyNutrition', () => {
  it('calculates totals across meals and returns configured user targets', () => {
    const { result } = renderHook(
      () => useDailyNutrition(
        [{ calories: 100, protein: 5, carbohydrates: 20, fats: 2 }] as never,
        [{ calories: 200, protein: 10, carbohydrates: 30, fats: 6 }] as never,
        [{ calories: 300, protein: 15, carbohydrates: 40, fats: 10 }] as never,
        [{ calories: 50, protein: 2, carbohydrates: 8, fats: 1 }] as never,
      ),
      { wrapper: wrapWithUserData({
        targetCalories: 1800,
        targetProtein: 120,
        targetCarbs: 200,
        targetFats: 60,
        maintenanceCalories: 2200,
      }) },
    );
    expect(result.current).toEqual({
      dailyNutrition: { calories: 650, protein: 32, carbs: 98, fat: 19 },
      userMacros: {
        targetCalories: 1800,
        targetProtein: 120,
        targetCarbs: 200,
        targetFats: 60,
        maintenanceCalories: 2200,
      },
      hasTargets: true,
    });
  });

  it('handles omitted snacks and clears macros when targets are incomplete', () => {
    const { result } = renderHook(
      () => useDailyNutrition([], [], [], null),
      { wrapper: wrapWithUserData({ targetCalories: 1800, maintenanceCalories: null }) },
    );
    expect(result.current).toEqual({
      dailyNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      userMacros: {
        targetCalories: 0,
        targetProtein: 0,
        targetCarbs: 0,
        targetFats: 0,
        maintenanceCalories: 0,
      },
      hasTargets: false,
    });
  });
});

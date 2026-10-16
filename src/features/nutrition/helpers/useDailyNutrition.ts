import { useContext, useMemo } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import type { FoodItem } from '../../../shared/types';
import { calculateDailyNutrition } from './nutritionTotals';

const useDailyNutrition = (
  breakfastFoods: FoodItem[],
  lunchFoods: FoodItem[],
  dinnerFoods: FoodItem[],
  snacksFoods?: FoodItem[] | null,
) => {
  const { userData } = useContext(AuthContext)!;

  const hasTargets = !!(userData?.targetCalories && userData?.maintenanceCalories);
  const userMacros = useMemo(() => hasTargets
    ? {
        targetCalories: userData.targetCalories,
        targetProtein: userData.targetProtein || 0,
        targetCarbs: userData.targetCarbs || 0,
        targetFats: userData.targetFats || 0,
        maintenanceCalories: userData.maintenanceCalories || 0,
      }
    : {
        targetCalories: 0,
        targetProtein: 0,
        targetCarbs: 0,
        targetFats: 0,
        maintenanceCalories: 0,
      }, [hasTargets, userData]);

  const dailyNutrition = useMemo(() => {
    const allFoods = [...breakfastFoods, ...lunchFoods, ...dinnerFoods, ...(snacksFoods || [])];
    return calculateDailyNutrition(allFoods);
  }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

  return {
    dailyNutrition,
    userMacros,
    hasTargets,
  };
};

export default useDailyNutrition;
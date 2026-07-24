import { useContext, useMemo } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';

const useDailyNutrition = (breakfastFoods, lunchFoods, dinnerFoods, snacksFoods) => {
  const { userData } = useContext(AuthContext);

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
    return allFoods.reduce((totals, food) => ({
      calories: totals.calories + (Number(food.calories) || 0),
      protein: totals.protein + (Number(food.protein) || 0),
      carbs: totals.carbs + (Number(food.carbohydrates) || 0),
      fat: totals.fat + (Number(food.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

  return {
    dailyNutrition,
    userMacros,
    hasTargets,
  };
};

export default useDailyNutrition;
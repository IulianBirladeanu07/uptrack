import type { FoodItem } from '../../../shared/types';

type MacroTargets = {
  carbs?: number;
  protein?: number;
  fat?: number;
};

export const getFoodSelectionCalorieProgress = (currentCalories: number, targetCalories?: number) => {
  if (!targetCalories || targetCalories <= 0) {
    return { fillRatio: 0, status: null as string | null };
  }

  const difference = targetCalories - currentCalories;
  const status = difference > 0
    ? `${Math.round(difference).toLocaleString()} left`
    : difference < 0
      ? `${Math.abs(Math.round(difference)).toLocaleString()} over`
      : 'On target';

  return {
    fillRatio: Math.max(0, Math.min(currentCalories / targetCalories, 1)),
    status,
  };
};

export const getFoodSelectionMacroBalances = (
  currentMacros: { carbs?: number; protein?: number; fat?: number },
  targetMacros: MacroTargets,
  selectedFoods: FoodItem[],
) => {
  const selectedTotals = selectedFoods.reduce<{ carbs: number; protein: number; fat: number }>((totals, food) => ({
    carbs: totals.carbs + (Number(food.carbohydrates) || 0),
    protein: totals.protein + (Number(food.protein) || 0),
    fat: totals.fat + (Number(food.fats) || 0),
  }), { carbs: 0, protein: 0, fat: 0 });

  return (['carbs', 'protein', 'fat'] as const).flatMap(key => {
    const target = Number(targetMacros[key]);
    if (!Number.isFinite(target) || target <= 0) return [];

    const consumed = (Number(currentMacros[key]) || 0) + selectedTotals[key];
    const difference = Math.round(target - consumed);
    const label = key === 'carbs' ? 'C' : key === 'protein' ? 'P' : 'F';
    const status = difference > 0
      ? `${difference}g left`
      : difference < 0
        ? `${Math.abs(difference)}g over`
        : 'on target';

    return [{ key, label, status }];
  });
};

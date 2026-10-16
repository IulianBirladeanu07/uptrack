import type { FoodItem, NutritionTotals } from '../../../shared/types';

export const calculateDailyNutrition = (
  foods: readonly (FoodItem | null | undefined)[],
): NutritionTotals => foods.reduce<NutritionTotals>((totals, food) => {
  if (!food) return totals;
  return {
    calories: totals.calories + (Number(food.calories) || 0),
    protein: totals.protein + (Number(food.protein) || 0),
    carbs: totals.carbs + (Number(food.carbohydrates) || 0),
    fat: totals.fat + (Number(food.fats) || 0),
  };
}, { calories: 0, protein: 0, carbs: 0, fat: 0 });

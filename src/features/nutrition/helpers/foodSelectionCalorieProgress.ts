export const getFoodSelectionCalorieProgress = (currentCalories: number, targetCalories?: number) => {
  if (!targetCalories || !Number.isFinite(targetCalories) || targetCalories <= 0) {
    return { fillRatio: 0, status: null as string | null };
  }

  const consumedCalories = Number.isFinite(currentCalories) ? Math.max(currentCalories, 0) : 0;
  const difference = targetCalories - consumedCalories;
  const status = difference > 0
    ? `${Math.round(difference).toLocaleString()} kcal left`
    : difference < 0
      ? `${Math.abs(Math.round(difference)).toLocaleString()} kcal over`
      : 'On target';

  return {
    fillRatio: Math.max(0, Math.min(consumedCalories / targetCalories, 1)),
    status,
  };
};

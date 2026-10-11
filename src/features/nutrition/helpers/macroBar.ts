export const getMacroEstimate = (value: number, macroType: string): number => {
  const estimates: Record<string, number> = {
    carbs: Math.max(Math.round(value * 1.5), 150),
    protein: Math.max(Math.round(value * 1.3), 80),
    fat: Math.max(Math.round(value * 1.4), 70),
  };
  return estimates[macroType.toLowerCase()] || Math.max(Math.round(value * 1.5), 100);
};

export const getMacroBarState = (
  value: number | null | undefined,
  maxValue: number | null | undefined,
  hasTargets: boolean | null | undefined,
  label: string,
) => {
  const safeValue = Math.round(value || 0);
  const safeMaxValue = Math.round(maxValue || 0);
  const hasTarget = !!hasTargets && safeMaxValue > 0;
  const displayMax = hasTarget ? safeMaxValue : getMacroEstimate(safeValue, label);
  const fillPercentage = Math.min(Math.round((safeValue / displayMax) * 100), 100);
  return { safeValue, safeMaxValue, hasTarget, displayMax, fillPercentage };
};

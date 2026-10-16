export const getMacroBarState = (
  value: number | null | undefined,
  maxValue: number | null | undefined,
  hasTargets: boolean | null | undefined,
) => {
  const safeValue = Math.round(value || 0);
  const safeMaxValue = Math.round(maxValue || 0);
  const hasTarget = !!hasTargets && safeMaxValue > 0;
  const fillPercentage = hasTarget
    ? Math.min(Math.round((safeValue / safeMaxValue) * 100), 100)
    : 0;
  return { safeValue, safeMaxValue, hasTarget, fillPercentage };
};

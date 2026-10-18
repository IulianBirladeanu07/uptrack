export type MacroTargets = {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

export type MacroKey = 'targetProtein' | 'targetCarbs' | 'targetFats';

const ENERGY_PER_GRAM = {
  targetProtein: 4,
  targetCarbs: 4,
  targetFats: 9,
} as const;

const energyOf = (targets: MacroTargets): number =>
  targets.targetProtein * ENERGY_PER_GRAM.targetProtein
  + targets.targetCarbs * ENERGY_PER_GRAM.targetCarbs
  + targets.targetFats * ENERGY_PER_GRAM.targetFats;

const distributeRemainder = (
  calories: number,
  fixed: Partial<Record<MacroKey, number>>,
  proportions: Partial<Record<MacroKey, number>>,
): Record<MacroKey, number> | null => {
  const keys = (Object.keys(ENERGY_PER_GRAM) as MacroKey[]).filter(key => fixed[key] == null);
  const fixedCalories = (Object.keys(fixed) as MacroKey[])
    .reduce((sum, key) => sum + (fixed[key] ?? 0) * ENERGY_PER_GRAM[key], 0);
  const remaining = calories - fixedCalories;
  const proportionTotal = keys.reduce((sum, key) => sum + (proportions[key] ?? 0), 0);
  if (remaining < 0 || keys.length === 0 || proportionTotal <= 0) return null;

  const result: Partial<Record<MacroKey, number>> = { ...fixed };
  let assignedCalories = fixedCalories;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      const exactCalories = calories - assignedCalories;
      const grams = Math.round(exactCalories / ENERGY_PER_GRAM[key]);
      result[key] = grams;
      assignedCalories += grams * ENERGY_PER_GRAM[key];
      return;
    }
    const share = remaining * (proportions[key] ?? 0) / proportionTotal;
    const grams = Math.floor(share / ENERGY_PER_GRAM[key]);
    result[key] = grams;
    assignedCalories += grams * ENERGY_PER_GRAM[key];
  });

  const protein = result.targetProtein;
  const carbs = result.targetCarbs;
  const fats = result.targetFats;
  if (
    Math.abs(assignedCalories - calories) > 4
    || protein == null
    || carbs == null
    || fats == null
  ) return null;
  return { targetProtein: protein, targetCarbs: carbs, targetFats: fats };
};

export const recalculateMacrosForCalories = (
  targets: MacroTargets,
  targetCalories: number,
): MacroTargets | null => {
  if (!Number.isInteger(targetCalories) || targetCalories <= 0) return null;
  const total = energyOf(targets);
  if (total <= 0) return null;
  const proportions: Record<MacroKey, number> = {
    targetProtein: targets.targetProtein * ENERGY_PER_GRAM.targetProtein / total,
    targetCarbs: targets.targetCarbs * ENERGY_PER_GRAM.targetCarbs / total,
    targetFats: targets.targetFats * ENERGY_PER_GRAM.targetFats / total,
  };
  const macros = distributeRemainder(targetCalories, {}, proportions);
  if (!macros) return null;
  return {
    targetCalories,
    targetProtein: macros.targetProtein,
    targetCarbs: macros.targetCarbs,
    targetFats: macros.targetFats,
  };
};

export const recalculateMacrosForEdit = (
  targets: MacroTargets,
  key: MacroKey,
  value: number,
): MacroTargets | null => {
  if (!Number.isInteger(value) || value < 0) return null;
  const proportions: Record<MacroKey, number> = {
    targetProtein: targets.targetProtein * ENERGY_PER_GRAM.targetProtein,
    targetCarbs: targets.targetCarbs * ENERGY_PER_GRAM.targetCarbs,
    targetFats: targets.targetFats * ENERGY_PER_GRAM.targetFats,
  };
  const fixed: Partial<Record<MacroKey, number>> = { [key]: value };
  const macros = distributeRemainder(targets.targetCalories, fixed, proportions);
  if (!macros) return null;
  return {
    targetCalories: targets.targetCalories,
    targetProtein: macros.targetProtein,
    targetCarbs: macros.targetCarbs,
    targetFats: macros.targetFats,
  };
};

export const macroCalories = (targets: MacroTargets): number => energyOf(targets);

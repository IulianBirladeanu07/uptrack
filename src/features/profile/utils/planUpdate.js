import { calculateWeightChangePlan, deriveFitnessGoal, refreshWeightChangePlan } from './nutritionPlanEngine';

const stepsOf = userData => userData?.avgDailySteps || 0;

export const changedFields = (form, original) => {
  const out = {};
  Object.keys(form).forEach(k => {
    if (form[k] !== original[k]) out[k] = form[k];
  });
  return out;
};

export const shouldReplan = (userData, goalChanged) => goalChanged || userData?.planConfidence !== 'calibrated';

const goalsOf = (form, original) => ({
  previous: deriveFitnessGoal(original.currentWeight, original.targetWeight),
  next: deriveFitnessGoal(form.currentWeight, form.targetWeight),
});

export const planView = ({ userData, form, original }) => {
  const { previous, next } = goalsOf(form, original);
  const replan = shouldReplan(userData, previous !== next);
  const steps = stepsOf(userData);
  const formulaNow = calculateWeightChangePlan({ ...original, avgDailySteps: steps, fitnessGoals: previous });
  const formula = calculateWeightChangePlan({ ...form, avgDailySteps: steps, fitnessGoals: next });
  const base = {
    goalCalories: userData?.targetCalories ?? formulaNow.goalCalories,
    macros: {
      protein: userData?.targetProtein ?? formulaNow.macros.protein,
      carbs: userData?.targetCarbs ?? formulaNow.macros.carbs,
      fats: userData?.targetFats ?? formulaNow.macros.fats,
    },
  };
  if (replan) return { replan, goal: next, base, next: formula };
  const refreshed = userData?.weightChangePlan
    ? refreshWeightChangePlan({ ...userData, ...changedFields(form, original) }, {})
    : null;
  return {
    replan,
    goal: next,
    base,
    next: {
      ...base,
      ratePerWeek: refreshed?.ratePerWeek ?? formula.ratePerWeek,
      weeksToGoal: refreshed?.weeksToGoal ?? formula.weeksToGoal,
    },
  };
};

export const buildPlanUpdate = ({ userData, form, original, now }) => {
  const diff = changedFields(form, original);
  const { previous, next } = goalsOf(form, original);
  const goalChanged = previous !== next;
  const payload = { ...diff };

  if (shouldReplan(userData, goalChanged)) {
    const plan = calculateWeightChangePlan({ ...form, avgDailySteps: stepsOf(userData), fitnessGoals: next });
    Object.assign(payload, {
      fitnessGoals: next,
      weightChangePlan: plan,
      targetCalories: plan.goalCalories,
      targetProtein: plan.macros.protein,
      targetCarbs: plan.macros.carbs,
      targetFats: plan.macros.fats,
      maintenanceCalories: plan.tdee,
      lastNutritionUpdate: now,
      planConfidence: 'estimated',
      lastCalorieAdjustment: null,
      lastAdjustmentDate: null,
      stepsBonusAppliedAt: null,
    });
  } else if (userData?.weightChangePlan && Object.keys(diff).some(k => k !== 'autoAdjustEnabled')) {
    const refreshed = refreshWeightChangePlan({ ...userData, ...diff }, {});
    if (refreshed) payload.weightChangePlan = refreshed;
  }

  if (goalChanged) {
    Object.assign(payload, { goalSwitchDate: now, weeksSinceCutStart: 0, startWeight: form.currentWeight });
  }

  return payload;
};

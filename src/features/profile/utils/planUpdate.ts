import { calculateWeightChangePlan, deriveFitnessGoal, refreshWeightChangePlan } from './nutritionPlanEngine';
import type { PlanFormData, PlanType, UserData, WeightChangePlan } from '../../../shared/types';

type EditablePlanForm = PlanFormData & {
  fitnessGoals?: PlanType;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
};

type PlanBase = Pick<WeightChangePlan, 'goalCalories' | 'macros'>;
type PlanNext = Pick<WeightChangePlan, 'goalCalories' | 'macros' | 'ratePerWeek' | 'weeksToGoal'>;
type PlanView = { replan: boolean; goal: PlanType; base: PlanBase; next: PlanNext };

const stepsOf = (userData: UserData | null | undefined): number => userData?.avgDailySteps || 0;

export const changedFields = <T extends object>(form: T, original: T): Partial<T> => {
  const out: Partial<T> = {};
  (Object.keys(form) as (keyof T)[]).forEach(k => {
    if (form[k] !== original[k]) out[k] = form[k];
  });
  return out;
};

export const isTargetWeightOnlyChange = (diff: Partial<PlanFormData>): boolean =>
  Object.keys(diff).length === 1 && Object.prototype.hasOwnProperty.call(diff, 'targetWeight');

export const shouldReplan = (userData: UserData | null | undefined, goalChanged: boolean): boolean =>
  goalChanged || userData?.planConfidence !== 'calibrated';

const savedGoal = (userData: UserData | null | undefined, fallback: PlanType): PlanType =>
  userData?.weightChangePlan?.type
  ?? userData?.fitnessGoals
  ?? fallback;

const goalsOf = (
  userData: UserData | null | undefined,
  form: EditablePlanForm,
  original: EditablePlanForm,
  targetWeightOnly: boolean,
): { previous: PlanType; next: PlanType } => {
  const derivedPrevious = deriveFitnessGoal(original.currentWeight, original.targetWeight);
  const previous = userData?.weightChangePlan?.type ?? userData?.fitnessGoals ?? original.fitnessGoals ?? derivedPrevious;
  const derivedNext = form.fitnessGoals ?? deriveFitnessGoal(form.currentWeight, form.targetWeight);
  return { previous, next: targetWeightOnly ? savedGoal(userData, previous) : derivedNext };
};

export const planView = ({ userData, form, original }: { userData: UserData | null | undefined; form: EditablePlanForm; original: EditablePlanForm }): PlanView => {
  const diff = changedFields(form, original);
  const targetWeightOnly = isTargetWeightOnlyChange(diff);
  const { previous, next } = goalsOf(userData, form, original, targetWeightOnly);
  const goalChanged = !targetWeightOnly && previous !== next;
  const replan = !targetWeightOnly && shouldReplan(userData, goalChanged);
  const steps = stepsOf(userData);
  const formulaNow = calculateWeightChangePlan({ ...original, avgDailySteps: steps, fitnessGoals: previous });
  const formula = calculateWeightChangePlan({ ...form, avgDailySteps: steps, fitnessGoals: next });
  const base: PlanBase = {
    goalCalories: userData?.targetCalories ?? formulaNow.goalCalories,
    macros: {
      protein: userData?.targetProtein ?? formulaNow.macros.protein,
      carbs: userData?.targetCarbs ?? formulaNow.macros.carbs,
      fats: userData?.targetFats ?? formulaNow.macros.fats,
    },
  };
  const hasManualTargetChanges = ['targetCalories', 'targetProtein', 'targetCarbs', 'targetFats']
    .some(key => Object.prototype.hasOwnProperty.call(diff, key));
  const preview: PlanNext = hasManualTargetChanges
    ? {
      ...formula,
      goalCalories: form.targetCalories ?? formula.goalCalories,
      macros: {
        protein: form.targetProtein ?? formula.macros.protein,
        carbs: form.targetCarbs ?? formula.macros.carbs,
        fats: form.targetFats ?? formula.macros.fats,
      },
    }
    : formula;
  if (replan) return { replan, goal: next, base, next: preview };
  const refreshed = userData?.weightChangePlan
    ? refreshWeightChangePlan({ ...userData, ...diff }, {})
    : null;
  return {
    replan,
    goal: next,
    base,
    next: {
      ...base,
      ...(hasManualTargetChanges ? {
        goalCalories: form.targetCalories ?? base.goalCalories,
        macros: {
          protein: form.targetProtein ?? base.macros.protein,
          carbs: form.targetCarbs ?? base.macros.carbs,
          fats: form.targetFats ?? base.macros.fats,
        },
      } : {}),
      ratePerWeek: refreshed?.ratePerWeek ?? formula.ratePerWeek,
      weeksToGoal: refreshed?.weeksToGoal ?? formula.weeksToGoal,
    },
  };
};

export const buildPlanUpdate = ({ userData, form, original, now }: { userData: UserData | null | undefined; form: EditablePlanForm; original: EditablePlanForm; now: string }): Record<string, unknown> => {
  const diff = changedFields(form, original);
  const targetWeightOnly = isTargetWeightOnlyChange(diff);
  const { previous, next } = goalsOf(userData, form, original, targetWeightOnly);
  const goalChanged = !targetWeightOnly && previous !== next;
  const payload: Record<string, unknown> = { ...diff };
  const hasManualTargetChanges = ['targetCalories', 'targetProtein', 'targetCarbs', 'targetFats']
    .some(key => Object.prototype.hasOwnProperty.call(diff, key));

  if (!targetWeightOnly && shouldReplan(userData, goalChanged)) {
    const calculated = calculateWeightChangePlan({ ...form, avgDailySteps: stepsOf(userData), fitnessGoals: next });
    const plan: WeightChangePlan = {
      ...calculated,
      goalCalories: hasManualTargetChanges ? form.targetCalories ?? calculated.goalCalories : calculated.goalCalories,
      macros: {
        protein: hasManualTargetChanges ? form.targetProtein ?? calculated.macros.protein : calculated.macros.protein,
        carbs: hasManualTargetChanges ? form.targetCarbs ?? calculated.macros.carbs : calculated.macros.carbs,
        fats: hasManualTargetChanges ? form.targetFats ?? calculated.macros.fats : calculated.macros.fats,
      },
    };
    Object.assign(payload, {
      fitnessGoals: next,
      weightChangePlan: plan,
      targetCalories: hasManualTargetChanges ? form.targetCalories ?? plan.goalCalories : plan.goalCalories,
      targetProtein: hasManualTargetChanges ? form.targetProtein ?? plan.macros.protein : plan.macros.protein,
      targetCarbs: hasManualTargetChanges ? form.targetCarbs ?? plan.macros.carbs : plan.macros.carbs,
      targetFats: hasManualTargetChanges ? form.targetFats ?? plan.macros.fats : plan.macros.fats,
      maintenanceCalories: plan.tdee,
      lastNutritionUpdate: now,
      planConfidence: 'estimated',
      lastCalorieAdjustment: null,
      lastAdjustmentDate: null,
      stepsBonusAppliedAt: null,
    });
  } else if (!targetWeightOnly && userData?.weightChangePlan && Object.keys(diff).some(k => k !== 'autoAdjustEnabled')) {
    const refreshed = refreshWeightChangePlan({ ...userData, ...diff }, {});
    if (refreshed) {
      const plan = {
        ...refreshed,
        goalCalories: form.targetCalories ?? refreshed.goalCalories,
        macros: {
          protein: form.targetProtein ?? refreshed.macros.protein,
          carbs: form.targetCarbs ?? refreshed.macros.carbs,
          fats: form.targetFats ?? refreshed.macros.fats,
        },
      };
      payload['weightChangePlan'] = plan;
      if (hasManualTargetChanges) {
        payload['targetCalories'] = form.targetCalories ?? plan.goalCalories;
        payload['targetProtein'] = form.targetProtein ?? plan.macros.protein;
        payload['targetCarbs'] = form.targetCarbs ?? plan.macros.carbs;
        payload['targetFats'] = form.targetFats ?? plan.macros.fats;
      }
    }
  }

  if (goalChanged) {
    Object.assign(payload, { goalSwitchDate: now, weeksSinceCutStart: 0, startWeight: form.currentWeight });
  }

  return payload;
};

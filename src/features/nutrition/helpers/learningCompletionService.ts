import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import {
  calculatePlanAdjustment,
  calculateWeightChangePlan,
  calculateMaintenanceEstimate,
  refreshWeightChangePlan,
} from '../../profile/utils/nutritionPlanEngine';
import { weekStepStats, overlayWeekSteps } from './stepStats';
import type {
  DailySteps,
  DayMeals,
  MealCacheLike,
  Numeric,
  NutritionTotals,
  PlanAdjustment,
  UserData,
  WeekStats,
  WeeklySnapshot,
  WeightChangePlan,
  WeightInWeek,
} from '../../../shared/types';

type DateInput = Date | string | number;
type WeeklyEvalResult = Partial<UserData> & { suggestion: PlanAdjustment['suggestion'] | 'maintenance_refresh' };

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEK_MS = 7 * DAY_MS;

export const calculateDailyNutritionFromMeals = (meals: DayMeals | null | undefined): NutritionTotals =>
  Object.values(meals || {})
    .flat()
    .reduce<NutritionTotals>((totals, food) => ({
      calories: totals.calories + (Number(food?.calories) || 0),
      protein:  totals.protein  + (Number(food?.protein)  || 0),
      carbs:    totals.carbs    + (Number(food?.carbohydrates) || 0),
      fat:      totals.fat      + (Number(food?.fats)     || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const avg = <K extends string>(arr: Partial<Record<K, number>>[], key: K): number =>
  arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

export const deriveStartWeight = (weightIns: WeightInWeek[] | null | undefined): Numeric | null => {
  if (!weightIns?.length) return null;
  const oldest = weightIns[0];
  return oldest.average ?? Object.values(oldest.days || {})[0] ?? null;
};

export const getRollingWeekStats = (mealCache: MealCacheLike, weekStart: DateInput, today: DateInput) => {
  const start = new Date(weekStart);
  const end   = new Date(today);
  end.setHours(23, 59, 59, 999);

  const days = mealCache.getDateRange(start, end);

  const nutritionDays = days
    .map(({ meals }) => calculateDailyNutritionFromMeals(meals))
    .filter(d => d.calories > 0);

  const stepDays = mealCache.getStepsRange(start, end).filter(d => d.steps > 0);

  return {
    daysLoggedNutrition: nutritionDays.length,
    avgCalories: avg(nutritionDays, 'calories'),
    avgProtein:  avg(nutritionDays, 'protein'),
    avgCarbs:    avg(nutritionDays, 'carbs'),
    avgFats:     avg(nutritionDays, 'fat'),
    daysLoggedSteps: stepDays.length,
    avgSteps:    avg(stepDays, 'steps'),
    totalSteps:  stepDays.reduce((s, d) => s + d.steps, 0),
  };
};

export const snapshotPreviousWeek = async (
  userId: string,
  previousWeekEntry: WeightInWeek | null | undefined,
  mealCache: MealCacheLike,
  userData: UserData | null | undefined,
): Promise<(WeeklySnapshot & { weeksSinceCutStart: number }) | null> => {
  if (!previousWeekEntry?.weekStart) return null;

  const weekStart = previousWeekEntry.weekStart;
  const [y, m, d] = weekStart.split('-').map(Number);
  const start     = new Date(y, m - 1, d);
  const end       = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const todayKey = mealCache.formatDate(new Date());
  const days     = mealCache.getDateRange(start, end);

  const nutritionDays = days
    .map(({ meals }) => calculateDailyNutritionFromMeals(meals))
    .filter(d => d.calories > 0);

  const stepDays = mealCache.getStepsRange(start, end)
    .filter(d => d.date !== todayKey && d.steps > 0);
  const cacheSteps = new Map(stepDays.map(d => [d.date, d.steps]));

  if (!nutritionDays.length && !stepDays.length) return null;

  const snapshot: WeeklySnapshot = {
    weekStart,
    daysLoggedNutrition: nutritionDays.length,
    avgCalories: avg(nutritionDays, 'calories'),
    avgProtein:  avg(nutritionDays, 'protein'),
    avgCarbs:    avg(nutritionDays, 'carbs'),
    avgFats:     avg(nutritionDays, 'fat'),
    daysLoggedSteps: stepDays.length,
    avgSteps:    avg(stepDays, 'steps'),
    totalSteps:  stepDays.reduce((s, d) => s + d.steps, 0),
    weightAverage: previousWeekEntry.average ?? null,
    createdAt: new Date().toISOString(),
  };

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc    = await getDoc(userDocRef);
    const stored     = userDoc.data() as UserData | undefined;
    const existing: WeeklySnapshot[] = stored?.weeklyNutrition || [];
    const st = weekStepStats(stored?.dailySteps, weekStart, k => cacheSteps.get(k), todayKey);
    snapshot.daysLoggedSteps = st.days;
    snapshot.avgSteps = st.avg;
    snapshot.totalSteps = st.total;

    const updated = [
      ...existing.filter(w => w.weekStart !== weekStart),
      snapshot,
    ].sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    const isWeightLoss = userData?.weightChangePlan?.type === 'weight_loss';
    const goalSwitchDate = userData?.goalSwitchDate;

    let weeksSinceCutStart = userData?.weeksSinceCutStart || 0;
    if (isWeightLoss) {
      if (goalSwitchDate) {
        const switchDate = new Date(goalSwitchDate);
        const snapshotDate = new Date(weekStart);
        const diffMs = snapshotDate.getTime() - switchDate.getTime();
        weeksSinceCutStart = Math.max(0, Math.floor(diffMs / WEEK_MS));
      } else {
        weeksSinceCutStart = weeksSinceCutStart + 1;
      }
    }

    const firestoreUpdate = {
      weeklyNutrition: updated,
      ...(isWeightLoss ? { weeksSinceCutStart } : {}),
    };

    await setDoc(userDocRef, firestoreUpdate, { merge: true });
    return { ...snapshot, weeksSinceCutStart };
  } catch (error) {
    console.error('snapshotPreviousWeek error:', error);
    return null;
  }
};

export const getWeeklyCalorieStats = (weeklyNutrition: WeeklySnapshot[] | null | undefined, weeks = 4, dailySteps?: DailySteps | null): WeekStats[] => {
  if (!weeklyNutrition?.length) return [];
  return weeklyNutrition.slice(-weeks).map(w => {
    const o = overlayWeekSteps(w, dailySteps);
    return {
      weekStart:       w.weekStart,
      daysLogged:      w.daysLoggedNutrition || 0,
      avgCalories:     w.avgCalories || 0,
      avgSteps:        o.avgSteps || 0,
      daysLoggedSteps: o.daysLoggedSteps || 0,
    };
  });
};

const blendMaintenance = (stored: number | null | undefined, measured: number | null | undefined): number | null => {
  if (!measured) return null;
  return stored ? Math.round((stored + measured) / 2) : measured;
};

const daysSince = (isoDateStr: string | null | undefined): number => {
  if (!isoDateStr) return Infinity;
  return (Date.now() - new Date(isoDateStr).getTime()) / DAY_MS;
};

const refreshMaintenanceOnly = async (userId: string, userData: UserData, weeklyCalorieData: WeekStats[]): Promise<WeeklyEvalResult | null> => {
  if (userData.autoAdjustEnabled === false) return null;
  if (daysSince(userData.maintenanceUpdatedAt) < 6) return null;

  const estimate = calculateMaintenanceEstimate(userData, weeklyCalorieData);
  const maintenanceCalories = blendMaintenance(userData.maintenanceCalories, estimate?.maintenance);
  if (!maintenanceCalories) return null;

  const updateData: Partial<UserData> = {
    maintenanceCalories,
    maintenanceUpdatedAt: new Date().toISOString(),
  };
  const weightChangePlan = refreshWeightChangePlan(userData, {
    targetCalories: userData.targetCalories,
    maintenance: maintenanceCalories,
  });
  if (weightChangePlan) updateData.weightChangePlan = weightChangePlan;

  try {
    await setDoc(doc(db, 'users', userId), updateData, { merge: true });
    return { suggestion: 'maintenance_refresh', ...updateData };
  } catch (error) {
    console.error('refreshMaintenanceOnly error:', error);
    return null;
  }
};

export const evaluateWeeklyProgress = async (
  userId: string,
  userData: UserData | null | undefined,
  _mealCache: MealCacheLike,
  _currentDate: Date,
): Promise<WeeklyEvalResult | null> => {
  if (!userData?.weightChangePlan || !userData?.targetCalories) return null;
  if (daysSince(userData.lastAdjustmentDate) < 6) return null;

  const weeklyCalorieData = getWeeklyCalorieStats(userData.weeklyNutrition || [], 8, userData.dailySteps);
  if (!weeklyCalorieData.length) return null;

  const adjustment = calculatePlanAdjustment(userData, weeklyCalorieData);
  if (!adjustment) return refreshMaintenanceOnly(userId, userData, weeklyCalorieData);

  const now = new Date().toISOString();
  const confirmed: Partial<UserData> = { lastAdjustmentDate: now, planConfidence: adjustment.planConfidence };
  let updateData: Partial<UserData>;

  if (adjustment.suggestion === 'goal_reached') {
    updateData = {
      lastCalorieAdjustment: { reason: 'goal_reached', adjustedAt: now },
      ...confirmed,
    };
  } else if (adjustment.suggestion === 'increase_steps') {
    updateData = confirmed;
  } else if (adjustment.suggestion === 'hold') {
    updateData = adjustment.syncedCalories != null && adjustment.syncedMacros
      ? {
          targetCalories: adjustment.syncedCalories,
          targetProtein:  adjustment.syncedMacros.protein,
          targetCarbs:    adjustment.syncedMacros.carbs,
          targetFats:     adjustment.syncedMacros.fats,
          ...confirmed,
        }
      : confirmed;
  } else if (adjustment.newMacros && adjustment.newTargetCalories != null) {
    updateData = {
      targetCalories: adjustment.newTargetCalories,
      targetProtein:  adjustment.newMacros.protein,
      targetCarbs:    adjustment.newMacros.carbs,
      targetFats:     adjustment.newMacros.fats,
      lastCalorieAdjustment: adjustment,
      ...confirmed,
    };
  } else {
    updateData = confirmed;
  }

  updateData = { ...updateData, slowEvalPending: adjustment.slowEvalPending === true };

  const maintenanceCalories = blendMaintenance(userData.maintenanceCalories, adjustment.measuredTDEE);
  if (maintenanceCalories) {
    updateData.maintenanceCalories = maintenanceCalories;
    updateData.maintenanceUpdatedAt = now;
  }

  const weightChangePlan = refreshWeightChangePlan(userData, {
    targetCalories: updateData.targetCalories ?? userData.targetCalories,
    maintenance: maintenanceCalories ?? undefined,
    ratePerWeek: userData.weightChangePlan?.type === 'weight_loss' ? adjustment.targetRate : undefined,
  });
  if (weightChangePlan) updateData.weightChangePlan = weightChangePlan;

  try {
    await setDoc(doc(db, 'users', userId), updateData, { merge: true });
    return { suggestion: adjustment.suggestion, ...updateData };
  } catch (error) {
    console.error('evaluateWeeklyProgress error:', error);
    return null;
  }
};

export const checkAndRunWeeklyEval = async (userId: string, userData: UserData | null | undefined, mealCache: MealCacheLike | null | undefined): Promise<WeeklyEvalResult | null> => {
  if (!userData || !mealCache) return null;
  if (daysSince(userData.lastAdjustmentDate) < 6) return null;

  const weightIns = userData.weightIns || [];
  if (weightIns.length < 2) return null;

  const weeklyNutrition = userData.weeklyNutrition || [];
  if (!weeklyNutrition.length) return null;

  return evaluateWeeklyProgress(userId, userData, mealCache, new Date());
};

export const initializeUserTargets = async (userId: string, weightChangePlan: WeightChangePlan): Promise<Partial<UserData>> => {
  if (!userId || !weightChangePlan) throw new Error('Invalid parameters');

  const targets: Partial<UserData> = {
    targetCalories:       weightChangePlan.goalCalories,
    targetProtein:        weightChangePlan.macros.protein,
    targetCarbs:          weightChangePlan.macros.carbs,
    targetFats:           weightChangePlan.macros.fats,
    maintenanceCalories:  weightChangePlan.tdee,
    targetsInitializedAt: new Date().toISOString(),
    targetsSource:        'formula',
    weeksSinceCutStart:   0,
  };

  await setDoc(doc(db, 'users', userId), targets, { merge: true });
  return targets;
};

export const calculateLearningStats = (mealCache: MealCacheLike, currentDate: DateInput, requiredDays = 7) => {
  const end = new Date(currentDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  const days = mealCache.getDateRange(start, end);
  const nutritionDays = days
    .map(({ date, meals }) => ({
      date,
      ...calculateDailyNutritionFromMeals(meals),
    }))
    .filter(d => d.calories > 0);

  const isComplete = nutritionDays.length >= requiredDays;

  const averages = {
    calories: avg(nutritionDays, 'calories'),
    protein:  avg(nutritionDays, 'protein'),
    carbs:    avg(nutritionDays, 'carbs'),
    fat:      avg(nutritionDays, 'fat'),
  };

  return { daysLogged: nutritionDays.length, isComplete, averages };
};

const STEPS_BONUS_WINDOW_DAYS = 14;
const STEPS_BONUS_MIN_DAYS = 7;

export const checkAndBackfillStepsBonus = async (
  userId: string,
  userData: UserData | null | undefined,
  mealCache: MealCacheLike,
  currentDate: DateInput,
): Promise<Partial<UserData> | null> => {
  if (!userData?.weightChangePlan) return null;
  if (userData.planConfidence !== 'estimated') return null;
  if (userData.lastCalorieAdjustment) return null;
  if (userData.stepsBonusAppliedAt) return null;

  const end = new Date(currentDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - STEPS_BONUS_WINDOW_DAYS);

  const todayKey = mealCache.formatDate(new Date(currentDate));
  const stepDays = mealCache.getStepsRange(start, end)
    .filter(d => d.date !== todayKey && d.steps > 0);

  if (stepDays.length < STEPS_BONUS_MIN_DAYS) return null;

  const avgDailySteps = avg(stepDays, 'steps');
  const plan = calculateWeightChangePlan({ ...userData, avgDailySteps });
  const now = new Date().toISOString();
  const adjustment = plan.goalCalories - Number(userData.targetCalories);

  const targets: Partial<UserData> = {
    weightChangePlan:     plan,
    targetCalories:       plan.goalCalories,
    targetProtein:        plan.macros.protein,
    targetCarbs:          plan.macros.carbs,
    targetFats:           plan.macros.fats,
    maintenanceCalories:  plan.tdee,
    avgDailySteps,
    stepsBonusAppliedAt:  now,
    ...(adjustment !== 0 ? {
      lastCalorieAdjustment: {
        reason:            'steps_calibrated',
        adjustment,
        newTargetCalories: plan.goalCalories,
        adjustedAt:        now,
      },
    } : {}),
  };

  try {
    await setDoc(doc(db, 'users', userId), targets, { merge: true });
    return targets;
  } catch (error) {
    console.error('checkAndBackfillStepsBonus error:', error);
    return null;
  }
};

export const checkAndCompleteLearning = async (userId: string, mealCache: MealCacheLike, currentDate: DateInput, hasTargets: boolean): Promise<Partial<UserData> | null> => {
  if (hasTargets) return null;

  const stats = calculateLearningStats(mealCache, currentDate);
  if (!stats.isComplete) return null;

  const targets: Partial<UserData> = {
    targetCalories:       stats.averages.calories,
    targetProtein:        stats.averages.protein,
    targetCarbs:          stats.averages.carbs,
    targetFats:           stats.averages.fat,
    maintenanceCalories:  stats.averages.calories,
    targetsSource:        'learning',
    targetsInitializedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId), targets, { merge: true });
    return targets;
  } catch (error) {
    console.error('checkAndCompleteLearning error:', error);
    return null;
  }
};

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { calculatePlanAdjustment, calculateWeightChangePlan } from '../../profile/utils/nutritionPlanEngine';

export const calculateDailyNutritionFromMeals = (meals) =>
  Object.values(meals || {})
    .flat()
    .reduce((totals, food) => ({
      calories: totals.calories + (Number(food?.calories) || 0),
      protein:  totals.protein  + (Number(food?.protein)  || 0),
      carbs:    totals.carbs    + (Number(food?.carbohydrates) || 0),
      fat:      totals.fat      + (Number(food?.fats)     || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const avg = (arr, key) =>
  arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;

export const deriveStartWeight = (weightIns) => {
  if (!weightIns?.length) return null;
  const oldest = weightIns[0];
  return oldest.average ?? Object.values(oldest.days || {})[0] ?? null;
};

export const getRollingWeekStats = (mealCache, weekStart, today) => {
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

export const snapshotPreviousWeek = async (userId, previousWeekEntry, mealCache, userData) => {
  if (!previousWeekEntry?.weekStart) return null;

  const weekStart = previousWeekEntry.weekStart;
  const start     = new Date(weekStart);
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

  if (!nutritionDays.length && !stepDays.length) return null;

  const snapshot = {
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
    const existing   = userDoc.data()?.weeklyNutrition || [];

    const updated = [
      ...existing.filter(w => w.weekStart !== weekStart),
      snapshot,
    ].sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));

    const isWeightLoss = userData?.weightChangePlan?.type === 'weight_loss';
    const goalSwitchDate = userData?.goalSwitchDate;

    let weeksSinceCutStart = userData?.weeksSinceCutStart || 0;
    if (isWeightLoss) {
      if (goalSwitchDate) {
        const switchDate = new Date(goalSwitchDate);
        const snapshotDate = new Date(weekStart);
        const diffMs = snapshotDate - switchDate;
        weeksSinceCutStart = Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
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

export const getWeeklyCalorieStats = (weeklyNutrition, weeks = 4) => {
  if (!weeklyNutrition?.length) return [];
  return weeklyNutrition.slice(-weeks).map(w => ({
    daysLogged:  w.daysLoggedNutrition || 0,
    avgCalories: w.avgCalories || 0,
    avgSteps:    w.avgSteps || 0,
  }));
};

const daysSince = (isoDateStr) => {
  if (!isoDateStr) return Infinity;
  return (Date.now() - new Date(isoDateStr).getTime()) / (1000 * 60 * 60 * 24);
};

export const evaluateWeeklyProgress = async (userId, userData, mealCache, currentDate) => {
  if (!userData?.weightChangePlan || !userData?.targetCalories) return null;
  if (daysSince(userData.lastAdjustmentDate) < 6) return null;

  const weeklyCalorieData = getWeeklyCalorieStats(userData.weeklyNutrition || [], 4);
  if (!weeklyCalorieData.length) return null;

  const adjustment = calculatePlanAdjustment(userData, weeklyCalorieData);
  if (!adjustment) return null;

  const now = new Date().toISOString();
  let updateData;

  if (adjustment.suggestion === 'goal_reached') {
    updateData = {
      lastCalorieAdjustment: { reason: 'goal_reached', adjustedAt: now },
      lastAdjustmentDate: now,
      planConfidence: adjustment.planConfidence,
    };
  } else if (adjustment.suggestion === 'increase_steps') {
    updateData = {
      lastAdjustmentDate: now,
      planConfidence: adjustment.planConfidence,
    };
  } else if (adjustment.suggestion === 'hold') {
    updateData = adjustment.syncedCalories != null
      ? {
          targetCalories: adjustment.syncedCalories,
          targetProtein:  adjustment.syncedMacros.protein,
          targetCarbs:    adjustment.syncedMacros.carbs,
          targetFats:     adjustment.syncedMacros.fats,
          lastAdjustmentDate: now,
          planConfidence: adjustment.planConfidence,
        }
      : {
          lastAdjustmentDate: now,
          planConfidence: adjustment.planConfidence,
        };
  } else {
    updateData = {
      targetCalories: adjustment.newTargetCalories,
      targetProtein:  adjustment.newMacros.protein,
      targetCarbs:    adjustment.newMacros.carbs,
      targetFats:     adjustment.newMacros.fats,
      lastCalorieAdjustment: adjustment,
      lastAdjustmentDate:    now,
      planConfidence: adjustment.planConfidence,
    };
  }

  try {
    await setDoc(doc(db, 'users', userId), updateData, { merge: true });
    return { suggestion: adjustment.suggestion, ...updateData };
  } catch (error) {
    console.error('evaluateWeeklyProgress error:', error);
    return null;
  }
};

export const checkAndRunWeeklyEval = async (userId, userData, mealCache) => {
  if (!userData || !mealCache) return null;
  if (daysSince(userData.lastAdjustmentDate) < 6) return null;

  const weightIns = userData.weightIns || [];
  if (weightIns.length < 2) return null;

  const weeklyNutrition = userData.weeklyNutrition || [];
  if (!weeklyNutrition.length) return null;

  return evaluateWeeklyProgress(userId, userData, mealCache, new Date());
};

export const initializeUserTargets = async (userId, weightChangePlan) => {
  if (!userId || !weightChangePlan) throw new Error('Invalid parameters');

  const targets = {
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

export const calculateLearningStats = (mealCache, currentDate, requiredDays = 7) => {
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

export const checkAndBackfillStepsBonus = async (userId, userData, mealCache, currentDate) => {
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
  const adjustment = plan.goalCalories - userData.targetCalories;

  const targets = {
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

export const checkAndCompleteLearning = async (userId, mealCache, currentDate, hasTargets) => {
  if (hasTargets) return null;

  const stats = calculateLearningStats(mealCache, currentDate);
  if (!stats.isComplete) return null;

  const targets = {
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
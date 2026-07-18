export const KCAL_PER_KG = 7700;
const WEEKS_PER_MONTH = 4.34524;

const ACTIVITY_MULTIPLIERS = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  extremely_active:  1.9,
};

const MIN_CALORIES_PER_KG_BY_ACTIVITY = {
  sedentary:         20,
  lightly_active:    22,
  moderately_active: 24,
  very_active:       27,
  extremely_active:  30,
};

const DEFICIT_PERCENT = {
  novice:       0.22,
  beginner:     0.20,
  intermediate: 0.18,
  advanced:     0.15,
  elite:        0.15,
};

const SURPLUS_PERCENT = {
  novice:       0.12,
  beginner:     0.10,
  intermediate: 0.08,
  advanced:     0.05,
  elite:        0.05,
};

const BULKING_RATE_KG_PER_MONTH = {
  male:   { novice: 1.5, beginner: 1.2, intermediate: 0.9, advanced: 0.6, elite: 0.4 },
  female: { novice: 1.0, beginner: 0.8, intermediate: 0.6, advanced: 0.4, elite: 0.25 },
};

export const STRESS_MULTIPLIERS = {
  low:      1.0,
  moderate: 0.85,
  high:     0.7,
};

export const BF_CATEGORY_ROL_PERCENT = {
  shredded:  0.25,
  very_lean: 0.75,
  lean:      1.0,
  higher_bf: 1.5,
};

const STEPS_TDEE_BONUS_PER_KG = {
  very_high: 3.0,
  high:      1.8,
  moderate:  0,
  low:       -1.2,
};

const STEPS_THRESHOLDS = {
  very_high: 15000,
  high:      12000,
  moderate:  8000,
};

const RATE_TOLERANCE_PERCENT = 0.3;
const MIN_WEEKS_OF_DATA = 2;
const STEPS_INCREASE_SUGGESTION = 1500;
const HOLD_SYNC_MIN_DELTA = 25;

export const validateInput = (key, value, fieldType) => {
  if (fieldType === 'picker' || fieldType === 'physique') return !!value;

  const parsed = parseFloat(value);
  if (!value || isNaN(parsed) || parsed <= 0) return false;
  if (key === 'height') return parsed >= 120 && parsed <= 250;
  return true;
};

export const calculateBMR = (gender, weight, height, age) => {
  const genderConstant = gender === 'male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + genderConstant;
};

export const calculateTDEE = (bmr, activityLevel) => {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return bmr * multiplier;
};

export const calculateStepsTDEEBonus = (avgSteps, weight) => {
  if (avgSteps == null || avgSteps <= 0) return 0;

  let bucket = 'low';
  if (avgSteps >= STEPS_THRESHOLDS.very_high) bucket = 'very_high';
  else if (avgSteps >= STEPS_THRESHOLDS.high) bucket = 'high';
  else if (avgSteps >= STEPS_THRESHOLDS.moderate) bucket = 'moderate';

  return Math.round(STEPS_TDEE_BONUS_PER_KG[bucket] * weight);
};

export const calculateRealTDEE = (avgDailyCalories, weeklyWeightChangeKg) => {
  if (!avgDailyCalories || avgDailyCalories <= 0) return null;
  const dailyWeightChangeKcal = (weeklyWeightChangeKg * KCAL_PER_KG) / 7;
  return Math.round(avgDailyCalories - dailyWeightChangeKcal);
};

export const calculateMinCalories = (bmr, tdee, currentWeight, activityLevel) => {
  const perKgFloor = MIN_CALORIES_PER_KG_BY_ACTIVITY[activityLevel] || 24;
  const weightFloor = Math.min(currentWeight * perKgFloor, tdee * 0.9);
  return Math.round(Math.max(bmr * 1.1, tdee * 0.75, weightFloor));
};

export const getTargetROLPercent = (bfCategory, stressLevel) => {
  const baseROL = BF_CATEGORY_ROL_PERCENT[bfCategory] ?? BF_CATEGORY_ROL_PERCENT.lean;
  const stressMultiplier = STRESS_MULTIPLIERS[stressLevel] || STRESS_MULTIPLIERS.moderate;
  return baseROL * stressMultiplier;
};

export const getTargetWeeklyRateKg = (bfCategory, stressLevel, currentWeight) => {
  const rolPercent = getTargetROLPercent(bfCategory, stressLevel);
  return (currentWeight * rolPercent) / 100;
};

export const calculateMacros = (goal, calories, weight) => {
  const proteinPerKg = goal === 'weight_loss' ? 2.4 : goal === 'muscle_gain' ? 2.2 : 1.8;
  const fatPerKg = 1.0;

  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams = Math.round(weight * fatPerKg);

  const proteinKcal = proteinGrams * 4;
  const fatKcal = fatGrams * 9;
  const remaining = calories - proteinKcal - fatKcal;

  if (remaining < 50 * 4) {
    const reducedFat = Math.round(weight * 0.8);
    const reducedFatKcal = reducedFat * 9;
    const carbsFromReduced = Math.max(0, Math.round((calories - proteinKcal - reducedFatKcal) / 4));
    return { protein: proteinGrams, carbs: carbsFromReduced, fats: reducedFat };
  }

  return { protein: proteinGrams, carbs: Math.round(remaining / 4), fats: fatGrams };
};

export const calculateWeightChangePlan = (formData) => {
  const {
    currentWeight, targetWeight, fitnessGoals,
    activityLevel, gender, height, age,
    bfCategory, stressLevel, avgDailySteps, experienceLevel,
  } = formData;

  const weight = parseFloat(currentWeight);
  const target = parseFloat(targetWeight) || weight;
  const weightDiff = Math.abs(weight - target);
  const expLevel = experienceLevel || 'intermediate';

  const goal = fitnessGoals || (
    weight > target ? 'weight_loss' :
    weight < target ? 'muscle_gain' : 'maintenance'
  );

  const bmr = calculateBMR(gender, weight, parseFloat(height), parseFloat(age));
  const tdeeMifflin = calculateTDEE(bmr, activityLevel);
  const stepsBonus = calculateStepsTDEEBonus(avgDailySteps, weight);
  const tdee = Math.round(tdeeMifflin + stepsBonus);

  const stressMultiplier = STRESS_MULTIPLIERS[stressLevel] || STRESS_MULTIPLIERS.moderate;
  const effectiveBfCategory = bfCategory || 'lean';

  let goalCalories;
  let ratePerWeek = 0;
  let ratePerMonth = 0;
  let weeksToGoal = 0;

  if (goal === 'weight_loss') {
    const targetRatePerWeek = getTargetWeeklyRateKg(effectiveBfCategory, stressLevel, weight);
    const deficitPct = DEFICIT_PERCENT[expLevel] || 0.18;
    const dailyDeltaTarget = (targetRatePerWeek * KCAL_PER_KG) / 7;
    const maxDailyDelta = tdee * deficitPct;
    const dailyDelta = Math.min(dailyDeltaTarget, maxDailyDelta);

    goalCalories = Math.round(tdee - dailyDelta);
    const minCal = calculateMinCalories(bmr, tdee, weight, activityLevel);
    goalCalories = Math.max(goalCalories, minCal);

    const actualDailyDelta = tdee - goalCalories;
    ratePerWeek = parseFloat(((actualDailyDelta * 7) / KCAL_PER_KG).toFixed(2));
    ratePerMonth = parseFloat((ratePerWeek * WEEKS_PER_MONTH).toFixed(1));
    weeksToGoal = ratePerWeek > 0 ? Math.ceil(weightDiff / ratePerWeek) : 0;

  } else if (goal === 'muscle_gain') {
    const bulkRates = BULKING_RATE_KG_PER_MONTH[gender] || BULKING_RATE_KG_PER_MONTH.male;
    const baseRate = bulkRates[expLevel] || bulkRates.intermediate;
    const targetRatePerMonth = baseRate * stressMultiplier;
    const targetRatePerWeek = targetRatePerMonth / WEEKS_PER_MONTH;

    const surplusPct = SURPLUS_PERCENT[expLevel] || 0.08;
    const dailyDeltaTarget = (targetRatePerWeek * KCAL_PER_KG) / 7;
    const maxDailyDelta = tdee * surplusPct;
    const dailyDelta = Math.min(dailyDeltaTarget, maxDailyDelta);

    goalCalories = Math.round(tdee + dailyDelta);

    const actualDailyDelta = goalCalories - tdee;
    ratePerWeek = parseFloat(((actualDailyDelta * 7) / KCAL_PER_KG).toFixed(2));
    ratePerMonth = parseFloat((ratePerWeek * WEEKS_PER_MONTH).toFixed(1));
    weeksToGoal = ratePerWeek > 0 ? Math.ceil(weightDiff / ratePerWeek) : 0;

  } else {
    goalCalories = Math.round(tdee);
  }

  const macros = calculateMacros(goal, goalCalories, weight);
  const estimatedDate = new Date();
  if (weeksToGoal > 0) estimatedDate.setDate(estimatedDate.getDate() + weeksToGoal * 7);

  return {
    type: goal,
    ratePerWeek,
    ratePerMonth,
    goalCalories,
    macros,
    bmr: Math.round(bmr),
    tdee,
    weeksToGoal,
    estimatedDate: estimatedDate.toLocaleDateString(),
    isEstimate: true,
  };
};

export const calculatePlanAdjustment = (userData, weeklyCalorieData) => {
  const plan = userData?.weightChangePlan;
  if (!plan || plan.type === 'maintenance' || !plan.ratePerWeek) return null;
  if (userData.autoAdjustEnabled === false) return null;

  const isLoss = plan.type === 'weight_loss';
  const expLevel = userData.experienceLevel || 'intermediate';
  const targetWeight = parseFloat(userData.targetWeight);

  const trendSeries = buildWeightTrendSeries(userData.weightIns);
  if (!trendSeries.length) return null;
  const currentTrendWeight = trendSeries[trendSeries.length - 1].trendWeight;
  const planConfidence = getPlanConfidence(trendSeries, weeklyCalorieData);

  if (isGoalReached(currentTrendWeight, targetWeight)) {
    return { suggestion: 'goal_reached', planConfidence };
  }

  const actualRateKgPerWeek = calculateWeeklyRateOfChange(trendSeries);
  const loggedWeeks = (weeklyCalorieData || [])
    .slice(-MIN_WEEKS_OF_DATA)
    .filter(w => w.daysLogged >= 4);

  if (actualRateKgPerWeek == null || loggedWeeks.length < MIN_WEEKS_OF_DATA) {
    return null;
  }

  const avgLoggedCalories = Math.round(
    loggedWeeks.reduce((sum, w) => sum + w.avgCalories, 0) / loggedWeeks.length
  );

  const targetRate = plan.ratePerWeek;
  const actualMagnitude = isLoss ? -actualRateKgPerWeek : actualRateKgPerWeek;
  const progressRatio = actualMagnitude / targetRate;

  if (progressRatio >= 1 - RATE_TOLERANCE_PERCENT && progressRatio <= 1 + RATE_TOLERANCE_PERCENT) {
    const caloriesDrift = avgLoggedCalories - userData.targetCalories;
    if (Math.abs(caloriesDrift) < HOLD_SYNC_MIN_DELTA) {
      return { suggestion: 'hold', planConfidence };
    }
    return {
      suggestion: 'hold',
      syncedCalories: avgLoggedCalories,
      syncedMacros: calculateMacros(plan.type, avgLoggedCalories, currentTrendWeight),
      planConfidence,
    };
  }

  const tooSlow = progressRatio < 1 - RATE_TOLERANCE_PERCENT;

  const realTDEE = calculateRealTDEE(avgLoggedCalories, actualRateKgPerWeek) || plan.tdee;
  const bmr = calculateBMR(userData.gender, currentTrendWeight, parseFloat(userData.height), parseFloat(userData.age));

  const dailyDeltaTarget = (targetRate * KCAL_PER_KG) / 7;
  const maxDeltaFraction = isLoss
    ? (DEFICIT_PERCENT[expLevel] || 0.18)
    : (SURPLUS_PERCENT[expLevel] || 0.08);
  const dailyDelta = Math.min(dailyDeltaTarget, realTDEE * maxDeltaFraction);

  let newTargetCalories = Math.round(isLoss ? realTDEE - dailyDelta : realTDEE + dailyDelta);

  if (isLoss) {
    const minCal = calculateMinCalories(bmr, realTDEE, currentTrendWeight, userData.activityLevel);
    const alreadyAtFloor = userData.targetCalories <= minCal;
    newTargetCalories = Math.max(newTargetCalories, minCal);

    if (tooSlow && alreadyAtFloor) {
      if (detectPlateau(actualRateKgPerWeek, currentTrendWeight)) {
        return { suggestion: 'increase_steps', suggestedStepsIncrease: STEPS_INCREASE_SUGGESTION, planConfidence };
      }
      return {
        suggestion: 'calorie_adjustment',
        reason: 'plateau_at_min_calories',
        adjustment: minCal - userData.targetCalories,
        newTargetCalories: minCal,
        newMacros: calculateMacros(plan.type, minCal, currentTrendWeight),
        adjustedAt: new Date().toISOString(),
        planConfidence,
      };
    }
  }

  const adjustment = newTargetCalories - userData.targetCalories;
  if (adjustment === 0) return { suggestion: 'hold', planConfidence };

  return {
    suggestion: 'calorie_adjustment',
    reason: tooSlow ? 'too_slow' : 'too_fast',
    adjustment,
    newTargetCalories,
    newMacros: calculateMacros(plan.type, newTargetCalories, currentTrendWeight),
    adjustedAt: new Date().toISOString(),
    planConfidence,
  };
};
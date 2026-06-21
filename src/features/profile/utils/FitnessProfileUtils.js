const KCAL_PER_KG = 7700;
const WEEKS_PER_MONTH = 4.34524;

const ACTIVITY_MULTIPLIERS = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  extremely_active:  1.9,
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

const STRESS_MULTIPLIERS = {
  low:      1.0,
  moderate: 0.85,
  high:     0.7,
};

const STEPS_TDEE_BONUS = {
  very_high: { threshold: 15000, bonus: 250 },
  high:      { threshold: 12000, bonus: 150 },
  moderate:  { threshold: 8000,  bonus: 0   },
  low:       { threshold: 0,     bonus: -100 },
};

const CUTTING_ROL_PERCENT = {
  novice:       { phase1: 0.75, phase2: 0.5,  phase3: 0.4  },
  beginner:     { phase1: 0.85, phase2: 0.65, phase3: 0.45 },
  intermediate: { phase1: 1.0,  phase2: 0.75, phase3: 0.5  },
  advanced:     { phase1: 1.0,  phase2: 0.75, phase3: 0.5  },
  elite:        { phase1: 1.0,  phase2: 0.75, phase3: 0.5  },
};

const PLATEAU_THRESHOLD_KG    = 0.2;
const PLATEAU_MIN_DAYS_LOGGED  = 4;
const PLATEAU_KCAL_REDUCTION   = 200;
const SLOW_KCAL_REDUCTION      = 150;
const FAST_KCAL_INCREASE       = 100;
const PLATEAU_STEPS_SUGGESTION = 2000;
const ROL_LOWER_BOUND          = 0.7;
const ROL_UPPER_BOUND          = 1.3;

export const validateInput = (key, value) => {
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

export const calculateStepsTDEEBonus = (avgSteps) => {
  if (!avgSteps || avgSteps <= 0) return STEPS_TDEE_BONUS.low.bonus;
  if (avgSteps >= STEPS_TDEE_BONUS.very_high.threshold) return STEPS_TDEE_BONUS.very_high.bonus;
  if (avgSteps >= STEPS_TDEE_BONUS.high.threshold)      return STEPS_TDEE_BONUS.high.bonus;
  if (avgSteps >= STEPS_TDEE_BONUS.moderate.threshold)  return STEPS_TDEE_BONUS.moderate.bonus;
  return STEPS_TDEE_BONUS.low.bonus;
};

export const calculateRealTDEE = (avgDailyCalories, weeklyWeightChange, avgSteps = 0) => {
  if (!avgDailyCalories || avgDailyCalories <= 0) return null;
  const dailyWeightChangeKcal = (weeklyWeightChange * KCAL_PER_KG) / 7;
  const stepsBonus = calculateStepsTDEEBonus(avgSteps);
  return Math.round(avgDailyCalories - dailyWeightChangeKcal + stepsBonus);
};

export const calculateMinCalories = (bmr, tdee, currentWeight) => {
  return Math.round(Math.max(
    bmr * 1.2,
    tdee * 0.75,
    currentWeight * 30
  ));
};

export const getTargetROL = (weeksSinceCutStart, experienceLevel, stressLevel) => {
  const levels = CUTTING_ROL_PERCENT[experienceLevel] || CUTTING_ROL_PERCENT.intermediate;
  const stressMultiplier = STRESS_MULTIPLIERS[stressLevel] || STRESS_MULTIPLIERS.moderate;

  let baseROL;
  if (weeksSinceCutStart <= 6) {
    baseROL = levels.phase1;
  } else if (weeksSinceCutStart <= 10) {
    baseROL = levels.phase2;
  } else {
    baseROL = levels.phase3;
  }

  return baseROL * stressMultiplier;
};

export const calculateMacros = (goal, calories, weight) => {
  const proteinPerKg = goal === 'weight_loss' ? 2.4 : goal === 'muscle_gain' ? 2.2 : 1.8;
  const fatPerKg     = 1.0;

  const proteinGrams = Math.round(weight * proteinPerKg);
  const fatGrams     = Math.round(weight * fatPerKg);

  const proteinKcal  = proteinGrams * 4;
  const fatKcal      = fatGrams * 9;
  const remaining    = calories - proteinKcal - fatKcal;

  if (remaining < 50 * 4) {
    const reducedFat = Math.round(weight * 0.8);
    const reducedFatKcal = reducedFat * 9;
    const carbsFromReduced = Math.max(0, Math.round((calories - proteinKcal - reducedFatKcal) / 4));
    return {
      protein: proteinGrams,
      carbs:   carbsFromReduced,
      fats:    reducedFat,
    };
  }

  return {
    protein: proteinGrams,
    carbs:   Math.round(remaining / 4),
    fats:    fatGrams,
  };
};

export const calculateWeightChangePlan = (formData) => {
  const {
    currentWeight, targetWeight, fitnessGoals,
    activityLevel, gender, height, age,
    experienceLevel, stressLevel, avgDailySteps,
  } = formData;

  const weight     = parseFloat(currentWeight);
  const target     = parseFloat(targetWeight) || weight;
  const weightDiff = Math.abs(weight - target);

  const goal = fitnessGoals || (
    weight > target ? 'weight_loss' :
    weight < target ? 'muscle_gain' : 'maintenance'
  );

  const bmr         = calculateBMR(gender, weight, parseFloat(height), parseFloat(age));
  const tdeeMifflin = calculateTDEE(bmr, activityLevel);
  const stepsBonus  = calculateStepsTDEEBonus(avgDailySteps);
  const tdee        = Math.round(tdeeMifflin + stepsBonus * 0.5);

  const stressMultiplier = STRESS_MULTIPLIERS[stressLevel] || STRESS_MULTIPLIERS.moderate;
  const expLevel         = experienceLevel || 'intermediate';

  let goalCalories;
  let ratePerWeek   = 0;
  let ratePerMonth  = 0;
  let weeksToGoal   = 0;

  if (goal === 'weight_loss') {
    const deficitPct     = DEFICIT_PERCENT[expLevel] || 0.18;
    const baseDeficit    = tdee * deficitPct;
    const adjustedDeficit = baseDeficit * stressMultiplier;
    goalCalories = Math.round(tdee - adjustedDeficit);

    const minCal = calculateMinCalories(bmr, tdee, weight);
    goalCalories = Math.max(goalCalories, minCal);

    const targetROL    = getTargetROL(3, expLevel, stressLevel);
    ratePerWeek  = parseFloat(((weight * targetROL) / 100).toFixed(2));
    ratePerMonth = parseFloat((ratePerWeek * WEEKS_PER_MONTH).toFixed(1));
    weeksToGoal  = ratePerWeek > 0 ? Math.ceil(weightDiff / ratePerWeek) : 0;

  } else if (goal === 'muscle_gain') {
    const surplusPct   = SURPLUS_PERCENT[expLevel] || 0.08;
    const bulkRates    = BULKING_RATE_KG_PER_MONTH[gender] || BULKING_RATE_KG_PER_MONTH.male;
    const baseRate     = bulkRates[expLevel] || bulkRates.intermediate;
    ratePerMonth = parseFloat((baseRate * stressMultiplier).toFixed(2));
    ratePerWeek  = parseFloat((ratePerMonth / WEEKS_PER_MONTH).toFixed(2));
    goalCalories = Math.round(tdee + tdee * surplusPct);
    weeksToGoal  = ratePerWeek > 0 ? Math.ceil(weightDiff / ratePerWeek) : 0;

  } else {
    goalCalories = Math.round(tdee);
  }

  const macros        = calculateMacros(goal, goalCalories, weight);
  const estimatedDate = new Date();
  if (weeksToGoal > 0) estimatedDate.setDate(estimatedDate.getDate() + weeksToGoal * 7);

  return {
    type: goal,
    ratePerWeek,
    ratePerMonth,
    goalCalories,
    macros,
    bmr:           Math.round(bmr),
    tdee:          Math.round(tdee),
    weeksToGoal,
    estimatedDate: estimatedDate.toLocaleDateString(),
    isEstimate:    true,
  };
};

const detectPlateau = (recentWeightWeeks) => {
  if (recentWeightWeeks.length < 2) return false;
  const last2 = recentWeightWeeks.slice(-2);
  const bothLogged = last2.every(w => w.daysLogged >= PLATEAU_MIN_DAYS_LOGGED && w.average != null);
  if (!bothLogged) return false;
  const variation = Math.abs(last2[1].average - last2[0].average);
  return variation < PLATEAU_THRESHOLD_KG;
};

export const calculateWeeklyAdjustment = (userData, recentWeightWeeks, weeklyCalorieData) => {
  const {
    weightChangePlan,
    targetCalories,
    currentWeight,
    experienceLevel,
    stressLevel,
    weeksSinceCutStart,
    gender,
    height,
    age,
    activityLevel,
  } = userData;

  if (!weightChangePlan || !targetCalories) return null;
  if (weightChangePlan.type !== 'weight_loss') return null;

  const weeks = weeksSinceCutStart || 0;
  if (weeks <= 2) return null;

  if (recentWeightWeeks.length < 2) return null;
  const hasEnoughWeightData = recentWeightWeeks.every(
    w => w.daysLogged >= PLATEAU_MIN_DAYS_LOGGED && w.average != null
  );
  if (!hasEnoughWeightData) return null;

  const hasEnoughCalorieData = weeklyCalorieData.every(w => w.daysLogged >= PLATEAU_MIN_DAYS_LOGGED);
  if (!hasEnoughCalorieData) return null;

  const weight = parseFloat(currentWeight);
  const expLevel = experienceLevel || 'intermediate';

  const bmr  = calculateBMR(gender, weight, parseFloat(height), parseFloat(age));
  const tdee = calculateTDEE(bmr, activityLevel);
  const minCalories = calculateMinCalories(bmr, tdee, weight);

  const oldest = recentWeightWeeks[0].average;
  const newest = recentWeightWeeks[recentWeightWeeks.length - 1].average;
  const weekSpan = recentWeightWeeks.length - 1;
  const actualWeeklyChange = (newest - oldest) / weekSpan;
  const currentROL = (Math.abs(actualWeeklyChange) / weight) * 100;

  const avgDailyCalories = weeklyCalorieData.reduce((s, w) => s + w.avgCalories, 0) / weeklyCalorieData.length;
  const avgSteps         = weeklyCalorieData.reduce((s, w) => s + (w.avgSteps || 0), 0) / weeklyCalorieData.length;
  const realTDEE         = calculateRealTDEE(avgDailyCalories, actualWeeklyChange, avgSteps);

  const targetROL = getTargetROL(weeks, expLevel, stressLevel);

  const isPlateau = detectPlateau(recentWeightWeeks);
  const avgKcalBelowTDEE = avgDailyCalories < (realTDEE || tdee);

  let adjustment = 0;
  let reason     = '';

  if (isPlateau && avgKcalBelowTDEE) {
    if (targetCalories > minCalories) {
      adjustment = -PLATEAU_KCAL_REDUCTION;
      reason     = 'plateau';
    } else {
      return {
        adjustment:             0,
        newTargetCalories:      targetCalories,
        suggestion:             'steps',
        suggestedStepsIncrease: PLATEAU_STEPS_SUGGESTION,
        reason:                 'plateau_at_min_calories',
        actualWeeklyRate:       parseFloat(actualWeeklyChange.toFixed(3)),
        targetROL:              parseFloat(targetROL.toFixed(3)),
        realTDEE,
        avgSteps: Math.round(avgSteps),
        newMacros: calculateMacros('weight_loss', targetCalories, weight),
        adjustedAt: new Date().toISOString(),
      };
    }
  } else if (currentROL < targetROL * ROL_LOWER_BOUND && !isPlateau) {
    adjustment = -SLOW_KCAL_REDUCTION;
    reason     = 'too_slow';
  } else if (currentROL > targetROL * ROL_UPPER_BOUND) {
    adjustment = FAST_KCAL_INCREASE;
    reason     = 'too_fast';
  } else {
    return null;
  }

  const newTargetCalories = Math.max(minCalories, Math.round(targetCalories + adjustment));
  if (newTargetCalories === targetCalories) return null;

  return {
    previousTargetCalories: targetCalories,
    newTargetCalories,
    adjustment,
    reason,
    actualWeeklyRate: parseFloat(actualWeeklyChange.toFixed(3)),
    currentROL:       parseFloat(currentROL.toFixed(3)),
    targetROL:        parseFloat(targetROL.toFixed(3)),
    weeksSinceCutStart: weeks,
    realTDEE,
    avgSteps:  Math.round(avgSteps),
    newMacros: calculateMacros('weight_loss', newTargetCalories, weight),
    adjustedAt: new Date().toISOString(),
  };
};
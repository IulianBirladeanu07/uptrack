const CONSTANTS = {
  HEIGHT_MIN: 120,
  HEIGHT_MAX: 250,
  WEEKS_PER_MONTH: 4.34524,
  KCAL_PER_KG: 7700,
  STRESS_MULTIPLIERS: {
    low: 1.05,
    moderate: 1.0,
    high: 0.9,
  },
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  },
  STEPS_TDEE_BONUS: {
    low:      { threshold: 5000,  bonus: -100 },
    moderate: { threshold: 8000,  bonus: 0    },
    high:     { threshold: 12000, bonus: 150  },
    very_high:{ threshold: 15000, bonus: 250  },
  },
  BULKING_RATE_KG_PER_MONTH: {
    male:   { novice: 1.5, beginner: 1.2, intermediate: 0.9, advanced: 0.6, elite: 0.4 },
    female: { novice: 1.0, beginner: 0.8, intermediate: 0.6, advanced: 0.4, elite: 0.25 },
  },
  CUTTING_RATE_KG_PER_WEEK: {
    male:   { novice: 0.6, beginner: 0.75, intermediate: 0.85, advanced: 0.9, elite: 1.0 },
    female: { novice: 0.5, beginner: 0.6,  intermediate: 0.7,  advanced: 0.8, elite: 0.9 },
  },
  SURPLUS_PERCENTAGE: 0.10,
  DEFICIT_PERCENTAGE: 0.20,
  MACRO_RATIOS: {
    muscle_gain: { protein: 0.25, carbs: 0.50, fats: 0.25 },
    weight_loss:  { protein: 0.35, carbs: 0.40, fats: 0.25 },
    maintenance:  { protein: 0.30, carbs: 0.45, fats: 0.25 },
  },
  CALORIES_PER_GRAM: {
    protein: 4,
    carbs: 4,
    fats: 9,
  },
  ADJUSTMENT: {
    MIN_WEEKS_DATA: 2,
    MIN_DAYS_LOGGED_PER_WEEK: 4,
    NOISE_THRESHOLD_KG: 0.1,
    MAX_KCAL_ADJUSTMENT: 150,
    MIN_KCAL_ADJUSTMENT: 50,
  },
};

export const validateInput = (key, value) => {
  const parsed = parseFloat(value);
  if (!value || isNaN(parsed) || parsed <= 0) return false;
  if (key === 'height') return parsed >= CONSTANTS.HEIGHT_MIN && parsed <= CONSTANTS.HEIGHT_MAX;
  return true;
};

export const calculateBMR = (gender, weight, height, age) => {
  const genderConstant = gender === 'male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + genderConstant;
};

export const calculateTDEE = (bmr, activityLevel) => {
  const multiplier = CONSTANTS.ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return bmr * multiplier;
};

export const calculateStepsTDEEBonus = (avgSteps) => {
  if (!avgSteps || avgSteps <= 0) return 0;
  if (avgSteps >= 15000) return CONSTANTS.STEPS_TDEE_BONUS.very_high.bonus;
  if (avgSteps >= 12000) return CONSTANTS.STEPS_TDEE_BONUS.high.bonus;
  if (avgSteps >= 8000)  return CONSTANTS.STEPS_TDEE_BONUS.moderate.bonus;
  return CONSTANTS.STEPS_TDEE_BONUS.low.bonus;
};

export const calculateRealTDEE = (avgDailyCalories, weeklyWeightChange, avgSteps = 0) => {
  if (!avgDailyCalories || avgDailyCalories <= 0) return null;
  const dailyWeightChangeKcal = (weeklyWeightChange * CONSTANTS.KCAL_PER_KG) / 7;
  const stepsBonus = calculateStepsTDEEBonus(avgSteps);
  return Math.round(avgDailyCalories - dailyWeightChangeKcal + stepsBonus);
};

export const calculateMacros = (goal, calories, weight) => {
  const ratios = CONSTANTS.MACRO_RATIOS[goal] || CONSTANTS.MACRO_RATIOS.maintenance;

  const proteinPerKg = goal === 'weight_loss' ? 2.4 : goal === 'muscle_gain' ? 2.2 : 1.8;
  const maxProteinFromRatio = (calories * ratios.protein) / CONSTANTS.CALORIES_PER_GRAM.protein;
  const proteinGrams = Math.min(weight * proteinPerKg, maxProteinFromRatio);

  const proteinCalories = proteinGrams * CONSTANTS.CALORIES_PER_GRAM.protein;
  const remaining = calories - proteinCalories;

  if (remaining < 0) {
    return {
      protein: parseFloat((calories / CONSTANTS.CALORIES_PER_GRAM.protein).toFixed(1)),
      carbs: 0,
      fats: 0,
    };
  }

  const carbRatio = ratios.carbs / (ratios.carbs + ratios.fats);
  return {
    protein: parseFloat(proteinGrams.toFixed(1)),
    carbs: parseFloat(((remaining * carbRatio) / CONSTANTS.CALORIES_PER_GRAM.carbs).toFixed(1)),
    fats: parseFloat(((remaining * (1 - carbRatio)) / CONSTANTS.CALORIES_PER_GRAM.fats).toFixed(1)),
  };
};

export const calculateRate = (goal, formData) => {
  const { currentWeight, targetWeight, experienceLevel, gender, stressLevel } = formData;
  const weight = parseFloat(currentWeight);
  const stressMultiplier = CONSTANTS.STRESS_MULTIPLIERS[stressLevel] || 1.0;

  if (goal === 'muscle_gain') {
    const rates = CONSTANTS.BULKING_RATE_KG_PER_MONTH[gender] || CONSTANTS.BULKING_RATE_KG_PER_MONTH.male;
    const baseRatePerMonth = rates[experienceLevel] || rates.intermediate;
    return parseFloat((baseRatePerMonth * stressMultiplier).toFixed(2));
  }

  if (goal === 'weight_loss') {
    const rates = CONSTANTS.CUTTING_RATE_KG_PER_WEEK[gender] || CONSTANTS.CUTTING_RATE_KG_PER_WEEK.male;
    const baseRatePerWeek = rates[experienceLevel] || rates.intermediate;
    const weightToLose = weight - parseFloat(targetWeight);
    const volumePenalty = weightToLose > 10 ? 0.85 : weightToLose > 6 ? 0.93 : 1.0;
    return parseFloat((baseRatePerWeek * stressMultiplier * volumePenalty).toFixed(2));
  }

  return 0;
};

const generateNotes = (goal, stressLevel, ratePerWeek, ratePerMonth) => {
  const notes = [];

  if (goal === 'muscle_gain') {
    notes.push({ type: 'goal', text: `Target: gain ${ratePerMonth} kg/month. Calorie targets auto-adjust weekly based on your actual progress.` });
    notes.push({ type: 'instruction', text: 'Log weight daily and meals consistently. Initial targets are estimates — they improve over 2-3 weeks.' });
    if (stressLevel === 'high') notes.push({ type: 'warning', text: 'High stress slows muscle growth. Prioritize sleep and recovery.' });
  } else if (goal === 'weight_loss') {
    notes.push({ type: 'goal', text: `Target: lose ${ratePerWeek} kg/week. Calorie targets auto-adjust weekly based on your actual progress.` });
    notes.push({ type: 'instruction', text: 'Log weight daily and meals consistently. Initial targets are estimates — they improve over 2-3 weeks of logging.' });
    if (stressLevel === 'high') notes.push({ type: 'warning', text: 'High stress impacts fat loss. Manage recovery alongside nutrition.' });
  } else {
    notes.push({ type: 'instruction', text: 'Log meals and weight to maintain. The app will fine-tune your targets over time.' });
  }

  return notes;
};

export const calculateWeightChangePlan = (formData) => {
  const { currentWeight, targetWeight, fitnessGoals, activityLevel, gender, height, age, experienceLevel, stressLevel } = formData;

  const currentWeightNum = parseFloat(currentWeight);
  const targetWeightNum = parseFloat(targetWeight);
  const weightDifference = Math.abs(currentWeightNum - targetWeightNum);

  const goal =
    fitnessGoals ||
    (currentWeightNum > targetWeightNum ? 'weight_loss' :
     currentWeightNum < targetWeightNum ? 'muscle_gain' : 'maintenance');

  const bmr = calculateBMR(gender, currentWeightNum, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const surplus = goal === 'muscle_gain' ? tdee * CONSTANTS.SURPLUS_PERCENTAGE : 0;
  const deficit = goal === 'weight_loss' ? tdee * CONSTANTS.DEFICIT_PERCENTAGE : 0;
  const goalCalories = Math.round(tdee + surplus - deficit);

  const rawRate = calculateRate(goal, formData);
  const macros = calculateMacros(goal, goalCalories, currentWeightNum);

  let ratePerWeek = 0;
  let ratePerMonth = 0;

  if (goal === 'muscle_gain') {
    ratePerMonth = rawRate;
    ratePerWeek = parseFloat((ratePerMonth / CONSTANTS.WEEKS_PER_MONTH).toFixed(2));
  } else if (goal === 'weight_loss') {
    ratePerWeek = rawRate;
    ratePerMonth = parseFloat((ratePerWeek * CONSTANTS.WEEKS_PER_MONTH).toFixed(1));
  }

  ratePerWeek = parseFloat(ratePerWeek.toFixed(2));
  ratePerMonth = parseFloat(ratePerMonth.toFixed(1));

  const weeksToGoal = ratePerWeek > 0 ? Math.ceil(weightDifference / ratePerWeek) : 0;
  const estimatedDate = new Date();
  if (weeksToGoal > 0) estimatedDate.setDate(estimatedDate.getDate() + weeksToGoal * 7);

  return {
    type: goal,
    ratePerWeek,
    ratePerMonth,
    goalCalories,
    macros,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weeksToGoal,
    estimatedDate: estimatedDate.toLocaleDateString(),
    isEstimate: true,
    notes: generateNotes(goal, stressLevel, ratePerWeek, ratePerMonth),
  };
};

export const calculateWeeklyAdjustment = (userData, weeklyWeightData, weeklyCalorieData) => {
  const { weightChangePlan, targetCalories, currentWeight } = userData;

  if (!weightChangePlan || !targetCalories) return null;

  const { MIN_WEEKS_DATA, MIN_DAYS_LOGGED_PER_WEEK, NOISE_THRESHOLD_KG, MAX_KCAL_ADJUSTMENT, MIN_KCAL_ADJUSTMENT } = CONSTANTS.ADJUSTMENT;

  if (weeklyWeightData.length < MIN_WEEKS_DATA) return null;

  const recentWeightWeeks = weeklyWeightData.slice(-MIN_WEEKS_DATA);
  const hasEnoughWeightData = recentWeightWeeks.every(w => w.daysLogged >= 3 && w.average != null);
  if (!hasEnoughWeightData) return null;

  const hasEnoughCalorieData = weeklyCalorieData.every(w => w.daysLogged >= MIN_DAYS_LOGGED_PER_WEEK);
  if (!hasEnoughCalorieData) return null;

  const oldestAvg = recentWeightWeeks[0].average;
  const newestAvg = recentWeightWeeks[recentWeightWeeks.length - 1].average;
  const actualWeeklyRate = (newestAvg - oldestAvg) / (recentWeightWeeks.length - 1);

  const avgDailyCalories = weeklyCalorieData.reduce((sum, w) => sum + w.avgCalories, 0) / weeklyCalorieData.length;
  const avgSteps = weeklyCalorieData.reduce((sum, w) => sum + (w.avgSteps || 0), 0) / weeklyCalorieData.length;
  const realTDEE = calculateRealTDEE(avgDailyCalories, actualWeeklyRate, avgSteps);

  const targetWeeklyRate = weightChangePlan.type === 'muscle_gain'
    ? weightChangePlan.ratePerMonth / CONSTANTS.WEEKS_PER_MONTH
    : weightChangePlan.ratePerWeek;

  const rateDelta = targetWeeklyRate - actualWeeklyRate;

  if (Math.abs(rateDelta) < NOISE_THRESHOLD_KG) return null;

  let rawAdjustment;
  if (realTDEE) {
    const idealCalories = weightChangePlan.type === 'muscle_gain'
      ? realTDEE + Math.round(realTDEE * CONSTANTS.SURPLUS_PERCENTAGE)
      : realTDEE - Math.round(realTDEE * CONSTANTS.DEFICIT_PERCENTAGE);
    rawAdjustment = Math.round(idealCalories - targetCalories);
  } else {
    rawAdjustment = Math.round(rateDelta * CONSTANTS.KCAL_PER_KG / 7);
  }

  if (Math.abs(rawAdjustment) < MIN_KCAL_ADJUSTMENT) return null;

  const clampedAdjustment = Math.max(-MAX_KCAL_ADJUSTMENT, Math.min(MAX_KCAL_ADJUSTMENT, rawAdjustment));
  const newTargetCalories = Math.round(targetCalories + clampedAdjustment);
  const newMacros = calculateMacros(weightChangePlan.type, newTargetCalories, parseFloat(currentWeight));

  return {
    previousTargetCalories: targetCalories,
    newTargetCalories,
    adjustment: clampedAdjustment,
    actualWeeklyRate: parseFloat(actualWeeklyRate.toFixed(3)),
    targetWeeklyRate: parseFloat(targetWeeklyRate.toFixed(3)),
    realTDEE,
    avgSteps: Math.round(avgSteps),
    newMacros,
    adjustedAt: new Date().toISOString(),
    reason: `Actual rate ${actualWeeklyRate.toFixed(2)}kg/week vs target ${targetWeeklyRate.toFixed(2)}kg/week`,
  };
};
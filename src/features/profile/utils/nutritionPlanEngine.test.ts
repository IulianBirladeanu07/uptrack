import {
  validateInput,
  calculateBMR,
  calculateTDEE,
  calculateStepsTDEEBonus,
  calculateRealTDEE,
  calculateMinCalories,
  getTargetROLPercent,
  getTargetWeeklyRateKg,
  calculateMacros,
  calculateWeightChangePlan,
  calculatePlanAdjustment,
  estimateMaintenance,
  calculateMaintenanceEstimate,
  refreshWeightChangePlan,
} from './nutritionPlanEngine';
import { buildWeightIns, buildDailyWeights, REALISTIC_DAILY_NOISE, buildWeeklyCalorieData } from './testFixtures';
import { buildWeightTrendSeries, calculateWeeklyRateOfChange, getCurrentTrendWeight, getRecentAverageWeight, isGoalReached } from './weightTrendEngine';

describe('validateInput', () => {
  test('picker fields just require truthiness', () => {
    expect(validateInput('activityLevel', 'moderately_active', 'picker')).toBe(true);
    expect(validateInput('activityLevel', '', 'picker')).toBe(false);
  });

  test('rejects non-numeric, zero, or negative values', () => {
    expect(validateInput('weight', 'abc', 'number')).toBe(false);
    expect(validateInput('weight', '0', 'number')).toBe(false);
    expect(validateInput('weight', '-5', 'number')).toBe(false);
  });

  test('height has an additional plausible-range check', () => {
    expect(validateInput('height', '119', 'number')).toBe(false);
    expect(validateInput('height', '120', 'number')).toBe(true);
    expect(validateInput('height', '250', 'number')).toBe(true);
    expect(validateInput('height', '251', 'number')).toBe(false);
  });

  test('accepts a normal weight value', () => {
    expect(validateInput('weight', '82.5', 'number')).toBe(true);
  });

  test('avgDailySteps allows zero (user genuinely may not walk or may not know), unlike other numeric fields', () => {
    expect(validateInput('avgDailySteps', '0', 'number')).toBe(true);
    expect(validateInput('avgDailySteps', 0, 'number')).toBe(true);
    expect(validateInput('avgDailySteps', '8500', 'number')).toBe(true);
    expect(validateInput('avgDailySteps', 'abc', 'number')).toBe(false);
    expect(validateInput('avgDailySteps', '-100', 'number')).toBe(false);
  });
});

describe('calculateBMR', () => {
  test('male uses +5 constant', () => {
    expect(calculateBMR('male', 80, 180, 30)).toBeCloseTo(10 * 80 + 6.25 * 180 - 5 * 30 + 5, 5);
  });

  test('female uses -161 constant', () => {
    expect(calculateBMR('female', 65, 165, 28)).toBeCloseTo(10 * 65 + 6.25 * 165 - 5 * 28 - 161, 5);
  });
});

describe('calculateTDEE', () => {
  test('applies the correct multiplier per activity level', () => {
    const bmr = 1700;
    expect(calculateTDEE(bmr, 'sedentary')).toBeCloseTo(bmr * 1.2, 5);
    expect(calculateTDEE(bmr, 'lightly_active')).toBeCloseTo(bmr * 1.375, 5);
    expect(calculateTDEE(bmr, 'moderately_active')).toBeCloseTo(bmr * 1.55, 5);
    expect(calculateTDEE(bmr, 'very_active')).toBeCloseTo(bmr * 1.725, 5);
    expect(calculateTDEE(bmr, 'extremely_active')).toBeCloseTo(bmr * 1.9, 5);
  });

  test('unknown activity level falls back to moderately_active multiplier', () => {
    expect(calculateTDEE(1700, 'made_up')).toBeCloseTo(1700 * 1.55, 5);
  });
});

describe('calculateStepsTDEEBonus', () => {
  test('null or non-positive steps give zero bonus', () => {
    expect(calculateStepsTDEEBonus(null, 80)).toBe(0);
    expect(calculateStepsTDEEBonus(0, 80)).toBe(0);
    expect(calculateStepsTDEEBonus(-100, 80)).toBe(0);
  });

  test('bucket boundaries are inclusive of the threshold value', () => {
    expect(calculateStepsTDEEBonus(7999, 80)).toBe(Math.round(-1.2 * 80));
    expect(calculateStepsTDEEBonus(8000, 80)).toBe(Math.round(0 * 80));
    expect(calculateStepsTDEEBonus(11999, 80)).toBe(Math.round(0 * 80));
    expect(calculateStepsTDEEBonus(12000, 80)).toBe(Math.round(1.8 * 80));
    expect(calculateStepsTDEEBonus(14999, 80)).toBe(Math.round(1.8 * 80));
    expect(calculateStepsTDEEBonus(15000, 80)).toBe(Math.round(3.0 * 80));
  });
});

describe('calculateRealTDEE', () => {
  test('null or non-positive avgDailyCalories returns null', () => {
    expect(calculateRealTDEE(null, -0.5)).toBeNull();
    expect(calculateRealTDEE(0, -0.5)).toBeNull();
  });

  test('backs out true maintenance from logged calories and actual weight change', () => {
    const result = calculateRealTDEE(2200, -0.5);
    expect(result).toBe(Math.round(2200 - (-0.5 * 7700) / 7));
  });

  test('weight gain reduces the implied real TDEE relative to intake', () => {
    const result = calculateRealTDEE(3000, 0.3);
    expect(result).toBeLessThan(3000);
  });
});

describe('calculateMinCalories', () => {
  test('takes the max of the BMR floor, TDEE floor, and per-kg-by-activity floor', () => {
    const bmr = 1600;
    const tdee = 2400;
    const weight = 90;
    const result = calculateMinCalories(bmr, tdee, weight, 'sedentary');
    const weightFloor = Math.min(weight * 20, tdee * 0.9);
    expect(result).toBe(Math.round(Math.max(bmr * 1.1, tdee * 0.75, weightFloor)));
  });

  test('unknown activity level falls back to 24 kcal/kg', () => {
    const bmr = 1500;
    const tdee = 2000;
    const weight = 70;
    const result = calculateMinCalories(bmr, tdee, weight, 'made_up');
    const weightFloor = Math.min(weight * 24, tdee * 0.9);
    expect(result).toBe(Math.round(Math.max(bmr * 1.1, tdee * 0.75, weightFloor)));
  });

  test('a very heavy user is capped by the tdee*0.9 side of the weight-floor min, not raw bodyweight math', () => {
    const bmr = 2200;
    const tdee = 3200;
    const weight = 150;
    const result = calculateMinCalories(bmr, tdee, weight, 'extremely_active');
    expect(result).toBe(Math.round(tdee * 0.9));
  });
});

describe('getTargetROLPercent / getTargetWeeklyRateKg', () => {
  test('higher stress reduces the target rate of loss', () => {
    const low = getTargetROLPercent('low');
    const high = getTargetROLPercent('high');
    expect(high).toBeLessThan(low);
  });

  test('rate does not taper with distance to goal', () => {
    expect(getTargetWeeklyRateKg(83, 'low')).toBeCloseTo(83 * 0.015, 5);
  });

  test('weekly rate scales with bodyweight', () => {
    const rateAt80 = getTargetWeeklyRateKg(80, 'moderate');
    const rateAt160 = getTargetWeeklyRateKg(160, 'moderate');
    expect(rateAt160).toBeCloseTo(rateAt80 * 2, 5);
  });
});

describe('calculateMacros', () => {
  test('normal weight-loss case splits protein/fat/carbs without hitting the low-calorie fallback', () => {
    const result = calculateMacros('weight_loss', 2000, 80);
    expect(result.protein).toBe(Math.round(80 * 2.4));
    expect(result.fats).toBe(Math.round(80 * 1.0));
    const remaining = 2000 - result.protein * 4 - result.fats * 9;
    expect(result.carbs).toBe(Math.round(remaining / 4));
  });

  test('maintenance and muscle_gain use lower protein-per-kg than weight_loss', () => {
    const loss = calculateMacros('weight_loss', 2500, 80);
    const gain = calculateMacros('muscle_gain', 2500, 80);
    const maint = calculateMacros('maintenance', 2500, 80);
    expect(loss.protein).toBeGreaterThan(gain.protein);
    expect(gain.protein).toBeGreaterThan(maint.protein);
  });

  test('low remaining calories triggers the reduced-fat fallback and carbs floor at zero', () => {
    const result = calculateMacros('weight_loss', 1400, 70);
    expect(result.fats).toBe(Math.round(70 * 0.8));
    expect(result.carbs).toBeGreaterThanOrEqual(0);
  });

  test('regression: extreme low-calorie target relative to bodyweight produces macros that overshoot the requested calories', () => {
    const goalCalories = 900;
    const weight = 90;
    const result = calculateMacros('weight_loss', goalCalories, weight);
    const actualCalories = result.protein * 4 + result.carbs * 4 + result.fats * 9;
    expect(result.carbs).toBe(0);
    expect(actualCalories).toBeGreaterThan(goalCalories);
  });

  test('reduced-fat fallback tracks close to target when the mismatch is not extreme', () => {
    const goalCalories = 1600;
    const weight = 70;
    const result = calculateMacros('weight_loss', goalCalories, weight);
    const actualCalories = result.protein * 4 + result.carbs * 4 + result.fats * 9;
    expect(Math.abs(actualCalories - goalCalories)).toBeLessThanOrEqual(4);
  });
});

const baseFormData = {
  currentWeight: '90',
  targetWeight: '80',
  fitnessGoals: 'weight_loss',
  activityLevel: 'moderately_active',
  gender: 'male',
  height: '180',
  age: '28',
  stressLevel: 'moderate',
  avgDailySteps: 0,
  experienceLevel: 'intermediate',
};

describe('calculateWeightChangePlan', () => {
  test('weight_loss branch produces a negative-calorie-delta plan under the deficit cap', () => {
    const plan = calculateWeightChangePlan(baseFormData);
    expect(plan.type).toBe('weight_loss');
    expect(plan.goalCalories).toBeLessThan(plan.tdee);
    expect(plan.ratePerWeek).toBeGreaterThan(0);
    expect(plan.weeksToGoal).toBeGreaterThan(0);
  });

  test('muscle_gain branch produces a positive-calorie-delta plan scaled by experience level', () => {
    const plan = calculateWeightChangePlan({ ...baseFormData, currentWeight: '70', targetWeight: '78', fitnessGoals: 'muscle_gain' });
    expect(plan.type).toBe('muscle_gain');
    expect(plan.goalCalories).toBeGreaterThan(plan.tdee);
    expect(plan.ratePerWeek).toBeGreaterThan(0);
  });

  test('maintenance branch targets tdee directly with zero projected rate', () => {
    const plan = calculateWeightChangePlan({ ...baseFormData, currentWeight: '75', targetWeight: '75', fitnessGoals: 'maintenance' });
    expect(plan.type).toBe('maintenance');
    expect(plan.goalCalories).toBe(plan.tdee);
    expect(plan.ratePerWeek).toBe(0);
  });

  test('goal is inferred from weight comparison when fitnessGoals is not supplied', () => {
    const plan = calculateWeightChangePlan({ ...baseFormData, fitnessGoals: undefined, currentWeight: '90', targetWeight: '95' });
    expect(plan.type).toBe('muscle_gain');
  });

  test('aggressive novice deficit target still gets clamped by the min-calorie floor', () => {
    const plan = calculateWeightChangePlan({
      ...baseFormData,
      currentWeight: '150',
      targetWeight: '90',
      experienceLevel: 'novice',
      stressLevel: 'low',
    });
    const minCal = calculateMinCalories(calculateBMR('male', 150, 180, 28), plan.tdee, 150, 'moderately_active');
    expect(plan.goalCalories).toBeGreaterThanOrEqual(Math.round(minCal) - 1);
  });

  test('step count feeds into TDEE through the steps bonus', () => {
    const withSteps = calculateWeightChangePlan({ ...baseFormData, avgDailySteps: 16000 });
    const withoutSteps = calculateWeightChangePlan({ ...baseFormData, avgDailySteps: 0 });
    expect(withSteps.tdee).toBeGreaterThan(withoutSteps.tdee);
  });
});

const baseUserData = {
  weightChangePlan: { type: 'weight_loss', ratePerWeek: 0.5, tdee: 2900 },
  targetWeight: '85',
  targetCalories: 2400,
  experienceLevel: 'intermediate',
  gender: 'male',
  height: '180',
  age: '28',
  activityLevel: 'moderately_active',
  autoAdjustEnabled: true,
};

const weeksOfDecline = (startWeight, weeklyRateKg, numWeeks = 5, noise = REALISTIC_DAILY_NOISE) =>
  buildWeightIns('2026-01-05', buildDailyWeights(startWeight, -weeklyRateKg / 7, numWeeks * 7, noise));

describe('calculatePlanAdjustment - guard clauses', () => {
  test('returns null with no plan on userData', () => {
    expect(calculatePlanAdjustment({}, [])).toBeNull();
  });

  test('returns null for a maintenance plan', () => {
    const userData = { ...baseUserData, weightChangePlan: { type: 'maintenance', ratePerWeek: 0 } };
    expect(calculatePlanAdjustment(userData, [])).toBeNull();
  });

  test('returns null when ratePerWeek is zero', () => {
    const userData = { ...baseUserData, weightChangePlan: { ...baseUserData.weightChangePlan, ratePerWeek: 0 } };
    expect(calculatePlanAdjustment(userData, [])).toBeNull();
  });

  test('returns null when autoAdjustEnabled is explicitly false', () => {
    const userData = { ...baseUserData, autoAdjustEnabled: false, weightIns: weeksOfDecline(95, 0.5) };
    expect(calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]))).toBeNull();
  });

  test('returns null with no weight-in data', () => {
    const userData = { ...baseUserData, weightIns: [] };
    expect(calculatePlanAdjustment(userData, [])).toBeNull();
  });

  test('returns null when fewer than 2 logged weeks with 4+ days meet the minimum', () => {
    const userData = { ...baseUserData, weightIns: weeksOfDecline(95, 0.5) };
    const weeklyCalorieData = [{ daysLogged: 2, avgCalories: 2400 }];
    expect(calculatePlanAdjustment(userData, weeklyCalorieData)).toBeNull();
  });
});

describe('calculatePlanAdjustment - goal_reached', () => {
  test('fires once the trend weight is within tolerance of target regardless of rate data', () => {
    const userData = { ...baseUserData, targetWeight: '84.9', weightIns: weeksOfDecline(88, 0.5, 8) };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.suggestion).toBe('goal_reached');
  });
});

describe('calculatePlanAdjustment - goal_reached on a fast cut', () => {
  const fastCut = () => weeksOfDecline(95, 1, 8, [0]);

  test('fires from the recent average when the lagging trend weight has not caught up', () => {
    const weightIns = fastCut();
    const trend = getCurrentTrendWeight(weightIns);
    const recent = getRecentAverageWeight(weightIns);
    const target = recent + 0.2;
    expect(isGoalReached(trend, target)).toBe(false);
    const userData = { ...baseUserData, targetWeight: String(target), weightIns };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.suggestion).toBe('goal_reached');
  });

  test('fires when the recent average is already well below target on a cut', () => {
    const weightIns = fastCut();
    const recent = getRecentAverageWeight(weightIns);
    const userData = { ...baseUserData, targetWeight: String(recent + 3), weightIns };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.suggestion).toBe('goal_reached');
  });

  test('does not fire while the recent average is still outside tolerance', () => {
    const weightIns = fastCut();
    const recent = getRecentAverageWeight(weightIns);
    const userData = { ...baseUserData, targetWeight: String(recent - 3), weightIns };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.suggestion).not.toBe('goal_reached');
  });
});

describe('calculatePlanAdjustment - goal_reached has no tolerance', () => {
  const cutIns = () => weeksOfDecline(95, 1, 8, [0]);
  const run = (target) => calculatePlanAdjustment(
    { ...baseUserData, targetWeight: String(target), weightIns: cutIns() },
    buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }])
  );

  test('does not fire while the recent average is still above target by less than 0.5 kg', () => {
    const recent = getRecentAverageWeight(cutIns());
    expect(run(recent - 0.3)?.suggestion).not.toBe('goal_reached');
  });

  test('fires once the recent average equals the target', () => {
    const recent = getRecentAverageWeight(cutIns());
    expect(run(recent).suggestion).toBe('goal_reached');
  });
});

describe('calculatePlanAdjustment - measuredTDEE', () => {
  test('is returned on a too_fast adjustment and matches calculateRealTDEE', () => {
    const userData = { ...baseUserData, targetCalories: 2400, weightIns: weeksOfDecline(95, 1.2) };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.reason).toBe('too_fast');
    expect(result.measuredTDEE).toBeGreaterThan(2400);
  });
});

describe('calculatePlanAdjustment - cut pace safety ceiling', () => {
  const cal = buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]);

  test('a pace above the plan rate but under the ceiling does not trigger too_fast', () => {
    const userData = { ...baseUserData, targetWeight: '80', weightIns: weeksOfDecline(95, 0.8, 5) };
    const result = calculatePlanAdjustment(userData, cal);
    expect(result.suggestion).toBe('hold');
    expect(result.reason).toBeUndefined();
  });

  test('a pace above the ceiling still raises calories', () => {
    const userData = { ...baseUserData, targetWeight: '80', targetCalories: 2400, weightIns: weeksOfDecline(95, 1.2, 5) };
    const result = calculatePlanAdjustment(userData, cal);
    expect(result.reason).toBe('too_fast');
    expect(result.newTargetCalories).toBeGreaterThan(2400);
  });

  test('landing guard: pace above the ceiling with the goal under three weeks away holds', () => {
    const weightIns = weeksOfDecline(95, 1.2, 8, [0]);
    const recent = getRecentAverageWeight(weightIns);
    const userData = { ...baseUserData, targetWeight: String(recent - 1.5), weightIns };
    const result = calculatePlanAdjustment(userData, cal);
    expect(result.suggestion).toBe('hold');
    expect(result.syncedCalories).toBeUndefined();
  });

  test('gain plans still use the plan rate band for too_fast', () => {
    const userData = {
      ...baseUserData,
      weightChangePlan: { type: 'muscle_gain', ratePerWeek: 0.25, tdee: 2900 },
      targetWeight: '110',
      targetCalories: 3200,
      weightIns: weeksOfDecline(95, -0.8, 5),
    };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 3200 }, { avgCalories: 3200 }]));
    expect(result.reason).toBe('too_fast');
  });
});

describe('calculatePlanAdjustment - too_slow needs two consecutive evaluations', () => {
  const cal = buildWeeklyCalorieData([{ avgCalories: 2600 }, { avgCalories: 2600 }]);
  const slow = { ...baseUserData, targetCalories: 2600, weightIns: weeksOfDecline(95, 0.1) };

  test('first slow evaluation holds and flags a pending slow streak', () => {
    const result = calculatePlanAdjustment(slow, cal);
    expect(result.suggestion).toBe('hold');
    expect(result.slowEvalPending).toBe(true);
    expect(result.syncedCalories).toBeUndefined();
  });

  test('second consecutive slow evaluation applies the calorie decrease', () => {
    const result = calculatePlanAdjustment({ ...slow, slowEvalPending: true }, cal);
    expect(result.reason).toBe('too_slow');
    expect(result.newTargetCalories).toBeLessThan(2600);
    expect(result.slowEvalPending).toBeUndefined();
  });
});

describe('calculatePlanAdjustment - hold', () => {
  test('holds with no calorie sync when actual rate is within tolerance and logged calories track the target', () => {
    const userData = { ...baseUserData, targetCalories: 2400, weightIns: weeksOfDecline(95, 0.5) };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 2405 }, { avgCalories: 2395 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.suggestion).toBe('hold');
    expect(result.syncedCalories).toBeUndefined();
  });

  test('holds but syncs calories and macros when logged intake has drifted from the stored target', () => {
    const userData = { ...baseUserData, targetCalories: 2400, weightIns: weeksOfDecline(95, 0.5) };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 2500 }, { avgCalories: 2510 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.suggestion).toBe('hold');
    expect(result.syncedCalories).toBeGreaterThan(2400);
    expect(result.syncedMacros).toBeDefined();
  });
});

describe('calculatePlanAdjustment - too_slow / too_fast', () => {
  test('suggests a calorie decrease when actual loss rate is well below target', () => {
    const userData = { ...baseUserData, slowEvalPending: true, targetCalories: 2600, weightIns: weeksOfDecline(95, 0.1) };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 2600 }, { avgCalories: 2600 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.suggestion).toBe('calorie_adjustment');
    expect(result.reason).toBe('too_slow');
    expect(result.newTargetCalories).toBeLessThan(2600);
  });

  test('suggests a calorie increase when actual loss rate is well above target', () => {
    const userData = { ...baseUserData, targetCalories: 2400, weightIns: weeksOfDecline(95, 1.2) };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.suggestion).toBe('calorie_adjustment');
    expect(result.reason).toBe('too_fast');
    expect(result.newTargetCalories).toBeGreaterThan(2400);
  });

  test('newTargetCalories for too_slow is clamped by the min-calorie floor', () => {
    const userData = { ...baseUserData, slowEvalPending: true, targetCalories: 2600, weightIns: weeksOfDecline(95, 0.05) };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 2600 }, { avgCalories: 2600 }]);

    const series = buildWeightTrendSeries(userData.weightIns);
    const trendW = series[series.length - 1].trendWeight;
    const actualRate = calculateWeeklyRateOfChange(series);

    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.reason).toBe('too_slow');

    const realTDEE = calculateRealTDEE(2600, actualRate) || userData.weightChangePlan.tdee;
    const bmr = calculateBMR(userData.gender, trendW, parseFloat(userData.height), parseFloat(userData.age));
    const minCal = calculateMinCalories(bmr, realTDEE, trendW, userData.activityLevel);
    expect(result.newTargetCalories).toBeGreaterThanOrEqual(minCal);
  });
});

describe('calculatePlanAdjustment - plateau at the calorie floor', () => {
  test('suggests increase_steps when stuck at the floor with a genuine plateau', () => {
    const lowCalUserData = {
      ...baseUserData,
      targetWeight: '60',
      targetCalories: 1550,
      activityLevel: 'sedentary',
      weightIns: weeksOfDecline(70, 0.02, 5, [0.1, -0.1, 0.05, -0.05, 0.1, -0.1, 0.05]),
    };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 1550 }, { avgCalories: 1550 }]);
    const result = calculatePlanAdjustment(lowCalUserData, weeklyCalorieData);
    expect(result.suggestion).toBe('increase_steps');
    expect(result.suggestedStepsIncrease).toBe(1500);
  });
});

describe('calculatePlanAdjustment - fix: hold-resync now applies the min-calorie floor', () => {
  test('syncedCalories is clamped to the floor instead of leaking logged calories straight through', () => {
    const userData = {
      ...baseUserData,
      targetWeight: '60',
      weightChangePlan: { type: 'weight_loss', ratePerWeek: 0.3, tdee: 2000 },
      targetCalories: 1800,
      activityLevel: 'sedentary',
      height: '175',
      weightIns: weeksOfDecline(70, 0.3, 5, [0.05, -0.05, 0.03, -0.03, 0.05, -0.05, 0.03]),
    };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 1700 }, { avgCalories: 1700 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);

    expect(result.suggestion).toBe('hold');

    const series = buildWeightTrendSeries(userData.weightIns);
    const trendW = series[series.length - 1].trendWeight;
    const rate = calculateWeeklyRateOfChange(series);
    const realTDEE = calculateRealTDEE(1700, rate) || userData.weightChangePlan.tdee;
    const bmr = calculateBMR(userData.gender, trendW, parseFloat(userData.height), parseFloat(userData.age));
    const minCal = calculateMinCalories(bmr, realTDEE, trendW, userData.activityLevel);

    expect(result.syncedCalories).toBe(minCal);
    expect(result.syncedCalories).toBeGreaterThan(1700);

    const macroCalories = result.syncedMacros.protein * 4 + result.syncedMacros.carbs * 4 + result.syncedMacros.fats * 9;
    expect(Math.abs(macroCalories - result.syncedCalories)).toBeLessThanOrEqual(4);
  });

  test('muscle_gain hold-resync is unaffected by the floor (loss-only clamp)', () => {
    const userData = {
      ...baseUserData,
      targetWeight: '80',
      weightChangePlan: { type: 'muscle_gain', ratePerWeek: 0.2, tdee: 2900 },
      targetCalories: 3000,
      weightIns: buildWeightIns('2026-01-05', buildDailyWeights(70, 0.2 / 7, 35, REALISTIC_DAILY_NOISE)),
    };
    const weeklyCalorieData = buildWeeklyCalorieData([{ avgCalories: 3100 }, { avgCalories: 3110 }]);
    const result = calculatePlanAdjustment(userData, weeklyCalorieData);
    expect(result.suggestion).toBe('hold');
    expect(result.syncedCalories).toBe(3105);
  });

  test('regression: calculateMinCalories floor never falls below the protein + reduced-fat macro floor', () => {
    const weight = 128;
    const bmr = calculateBMR('female', weight, 175, 78);
    const tdee = calculateTDEE(bmr, 'sedentary');
    const minCal = calculateMinCalories(bmr, tdee, weight, 'sedentary');
    const macros = calculateMacros('weight_loss', minCal, weight);
    const actualCalories = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
    expect(actualCalories).toBeLessThanOrEqual(minCal);
 });
});

describe('calculatePlanAdjustment - calorie window alignment', () => {
  const slowThenFast = () => buildWeightIns('2026-01-05', [
    ...buildDailyWeights(95, -0.2 / 7, 28, [0]),
    ...buildDailyWeights(95 - 0.8, -1.0 / 7, 28, [0]),
  ]);
  const base = { ...baseUserData, targetWeight: '70', targetCalories: 2400, weightIns: slowThenFast() };
  const wk = (weekStart) => ({ weekStart, daysLogged: 7, avgCalories: 2400, avgSteps: 0 });

  test('measuredTDEE uses the weight change over the calorie weeks, not the latest rate', () => {
    const aligned = calculatePlanAdjustment(base, [wk('2026-01-19'), wk('2026-01-26')]);
    const unaligned = calculatePlanAdjustment(base, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(aligned.measuredTDEE).toBeCloseTo(2400 + 0.2 * 1100, -1);
    expect(unaligned.measuredTDEE).toBeGreaterThan(aligned.measuredTDEE + 300);
  });

  test('returns null when the calorie weeks are not consecutive', () => {
    expect(calculatePlanAdjustment(base, [wk('2026-01-19'), wk('2026-02-02')])).toBeNull();
  });

  test('reports the pace target it used for cuts', () => {
    const result = calculatePlanAdjustment(base, [wk('2026-01-19'), wk('2026-01-26')]);
    expect(result.targetRate).toBeGreaterThan(0);
  });
});

describe('estimateMaintenance', () => {
  const steady = () => ({ ...baseUserData, weightIns: weeksOfDecline(95, 0.5, 8, [0]) });
  const wk = (weekStart, extra = {}) => ({ weekStart, daysLogged: 7, avgCalories: 2400, avgSteps: 8000, ...extra });
  const four = ['2026-01-26', '2026-02-02', '2026-02-09', '2026-02-16'];

  test('uses up to four contiguous weeks and matches calories plus the weight change', () => {
    const result = estimateMaintenance(steady(), four.map(w => wk(w)));
    expect(result.weeksUsed).toBe(4);
    expect(result.windowed).toBe(true);
    expect(Math.abs(result.maintenance - 2950)).toBeLessThan(40);
  });

  test('falls back to the two latest weeks when weekly steps shifted sharply', () => {
    const weeks = four.map((w, i) => wk(w, { avgSteps: i === 3 ? 14000 : 8000 }));
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(2);
  });

  test('keeps the wide window when steps are stable', () => {
    const weeks = four.map((w, i) => wk(w, { avgSteps: [8000, 8100, 7900, 8000][i] }));
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(4);
  });

  test('does not trust a thin step sample for the shift check', () => {
    const weeks = four.map((w, i) => wk(w, { avgSteps: i === 3 ? 14000 : 8000, daysLoggedSteps: i === 3 ? 1 : 7 }));
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(4);
  });

  test('uses a well-sampled step shift to narrow the window', () => {
    const weeks = four.map((w, i) => wk(w, { avgSteps: i === 3 ? 14000 : 8000, daysLoggedSteps: 7 }));
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(2);
  });

  test('ignores weeks before a gap in the weekly history', () => {
    const weeks = ['2026-01-12', '2026-01-19', '2026-02-02', '2026-02-09'].map(w => wk(w));
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(2);
  });

  test('stops at a week with too few logged days', () => {
    const weeks = [wk('2026-02-02', { daysLogged: 2 }), wk('2026-02-09'), wk('2026-02-16')];
    expect(estimateMaintenance(steady(), weeks).weeksUsed).toBe(2);
  });

  test('returns null with fewer than two usable weeks', () => {
    expect(estimateMaintenance(steady(), [wk('2026-02-09', { daysLogged: 2 }), wk('2026-02-16')])).toBeNull();
    expect(estimateMaintenance(steady(), [])).toBeNull();
  });

  test('uses the fallback rate when weeks carry no dates', () => {
    const weeks = [{ daysLogged: 6, avgCalories: 2400 }, { daysLogged: 6, avgCalories: 2400 }];
    const result = estimateMaintenance(steady(), weeks, -0.5);
    expect(result.maintenance).toBe(2950);
    expect(result.windowed).toBe(false);
    expect(estimateMaintenance(steady(), weeks, null)).toBeNull();
  });

  test('uses the fallback rate when the weight weeks around the window are missing', () => {
    const weeks = [wk('2027-01-05'), wk('2027-01-12')];
    const result = estimateMaintenance(steady(), weeks, -0.5);
    expect(result.windowed).toBe(false);
    expect(result.maintenance).toBe(2950);
  });
});

describe('calculateMaintenanceEstimate', () => {
  test('derives the fallback rate from the weight trend', () => {
    const userData = { ...baseUserData, weightIns: weeksOfDecline(95, 0.5, 8, [0]) };
    const weeks = [{ daysLogged: 7, avgCalories: 2400 }, { daysLogged: 7, avgCalories: 2400 }];
    expect(Math.abs(calculateMaintenanceEstimate(userData, weeks).maintenance - 2950)).toBeLessThan(40);
  });

  test('returns null with no weight data', () => {
    expect(calculateMaintenanceEstimate({ ...baseUserData, weightIns: [] }, [{ daysLogged: 7, avgCalories: 2400 }, { daysLogged: 7, avgCalories: 2400 }])).toBeNull();
  });
});

describe('calculatePlanAdjustment - goal_reached carries measured maintenance', () => {
  test('returns measuredTDEE alongside the goal_reached suggestion', () => {
    const userData = { ...baseUserData, targetWeight: '84.9', weightIns: weeksOfDecline(88, 0.5, 8) };
    const result = calculatePlanAdjustment(userData, buildWeeklyCalorieData([{ avgCalories: 2400 }, { avgCalories: 2400 }]));
    expect(result.suggestion).toBe('goal_reached');
    expect(result.measuredTDEE).toBeGreaterThan(2400);
  });
});

describe('refreshWeightChangePlan', () => {
  const stalePlan = {
    type: 'weight_loss',
    ratePerWeek: 0.21,
    ratePerMonth: 0.9,
    goalCalories: 3381,
    weeksToGoal: 15,
    estimatedDate: '12/19/2026',
    tdee: 3609,
    bmr: 1900,
    macros: { protein: 1, carbs: 1, fats: 1 },
    isEstimate: true,
    legacyField: 'keep me',
  };
  const weightIns = weeksOfDecline(95, 0.5, 5, [0]);
  const userData = { ...baseUserData, targetWeight: '85', targetCalories: 3040, weightChangePlan: stalePlan, weightIns };

  test('rewrites the derived fields from current weight, target and calories', () => {
    const recent = getRecentAverageWeight(weightIns);
    const result = refreshWeightChangePlan(userData, { targetCalories: 3040, maintenance: 3800, ratePerWeek: 0.5 });
    expect(result.goalCalories).toBe(3040);
    expect(result.tdee).toBe(3800);
    expect(result.ratePerWeek).toBe(0.5);
    expect(result.ratePerMonth).toBeCloseTo(2.2, 1);
    expect(result.weeksToGoal).toBe(Math.ceil((recent - 85) / 0.5));
    expect(result.macros.carbs).toBeGreaterThan(1);
    expect(result.isEstimate).toBe(false);
    expect(result.legacyField).toBe('keep me');
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + result.weeksToGoal * 7);
    expect(result.estimatedDate).toBe(expectedDate.toLocaleDateString());
    expect(result.estimatedDate).not.toBe(new Date().toLocaleDateString());
  });

  test('keeps the stored rate and tdee when no new values are supplied', () => {
    const result = refreshWeightChangePlan(userData, {});
    expect(result.ratePerWeek).toBe(0.21);
    expect(result.tdee).toBe(3609);
    expect(result.goalCalories).toBe(3040);
    expect(result.isEstimate).toBe(true);
  });

  test('reports zero weeks once the goal is reached', () => {
    const reached = { ...userData, targetWeight: '120' };
    expect(refreshWeightChangePlan(reached, { ratePerWeek: 0.5 }).weeksToGoal).toBe(0);
  });

  test('reports zero weeks when the rate is not positive', () => {
    expect(refreshWeightChangePlan(userData, { ratePerWeek: 0 }).weeksToGoal).toBe(0);
  });

  test('refreshes only tdee on a maintenance plan', () => {
    const maintenance = { ...userData, weightChangePlan: { type: 'maintenance', ratePerWeek: 0, tdee: 2900, goalCalories: 2900 } };
    const result = refreshWeightChangePlan(maintenance, { targetCalories: 1000, maintenance: 2800 });
    expect(result.tdee).toBe(2800);
    expect(result.goalCalories).toBe(2900);
    expect(result.type).toBe('maintenance');
  });

  test('returns null with no plan', () => {
    expect(refreshWeightChangePlan({}, {})).toBeNull();
  });
});
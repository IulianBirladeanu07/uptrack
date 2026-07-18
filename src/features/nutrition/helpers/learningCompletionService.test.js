jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, id) => ({ db, collection, id })),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { setDoc, getDoc } from 'firebase/firestore';
import MealCache from '../context/cache/MealCache';
import {
  calculateDailyNutritionFromMeals,
  deriveStartWeight,
  getRollingWeekStats,
  snapshotPreviousWeek,
  getWeeklyCalorieStats,
  evaluateWeeklyProgress,
  checkAndRunWeeklyEval,
  initializeUserTargets,
  calculateLearningStats,
  checkAndBackfillStepsBonus,
  checkAndCompleteLearning,
} from './learningCompletionService';
import { buildWeightIns, buildDailyWeights, REALISTIC_DAILY_NOISE } from '../../profile/utils/testFixtures';

const weeksOfDecline = (startWeight, weeklyRateKg, numWeeks, noise = REALISTIC_DAILY_NOISE) =>
  buildWeightIns('2026-01-05', buildDailyWeights(startWeight, -weeklyRateKg / 7, numWeeks * 7, noise));

const putDay = (mealCache, date, { calories = 0, protein = 0, carbs = 0, fats = 0, steps = 0 } = {}) => {
  const dateKey = mealCache.formatDate(date);
  mealCache.set(dateKey, {
    breakfast: calories ? [{ calories, protein, carbohydrates: carbs, fats }] : [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  if (steps) mealCache.setSteps(dateKey, steps);
  return dateKey;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

describe('calculateDailyNutritionFromMeals', () => {
  test('sums calories/protein/carbs/fat across all meal slots', () => {
    const meals = {
      breakfast: [{ calories: 300, protein: 20, carbohydrates: 30, fats: 10 }],
      lunch: [{ calories: 500, protein: 40, carbohydrates: 50, fats: 15 }],
      dinner: [],
      snacks: [{ calories: 150, protein: 5, carbohydrates: 20, fats: 5 }],
    };
    expect(calculateDailyNutritionFromMeals(meals)).toEqual({
      calories: 950, protein: 65, carbs: 100, fat: 30,
    });
  });

  test('empty or missing meals returns all zeros', () => {
    expect(calculateDailyNutritionFromMeals({})).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(calculateDailyNutritionFromMeals(undefined)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  test('missing numeric fields on a food item are treated as zero', () => {
    const meals = { breakfast: [{ calories: 200 }], lunch: [], dinner: [], snacks: [] };
    expect(calculateDailyNutritionFromMeals(meals)).toEqual({ calories: 200, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('deriveStartWeight', () => {
  test('uses the stored average when present', () => {
    expect(deriveStartWeight([{ average: 82.4, days: { monday: 82 } }])).toBe(82.4);
  });

  test('falls back to the first logged day when there is no average', () => {
    expect(deriveStartWeight([{ days: { wednesday: 81.2 } }])).toBe(81.2);
  });

  test('returns null with no weight-in history', () => {
    expect(deriveStartWeight([])).toBeNull();
    expect(deriveStartWeight(null)).toBeNull();
  });
});

describe('getRollingWeekStats', () => {
  test('aggregates only the days with logged nutrition or steps inside the range', () => {
    const mealCache = new MealCache();
    const weekStart = new Date('2026-02-02');
    putDay(mealCache, weekStart, { calories: 2000, protein: 150, carbs: 200, fats: 60, steps: 9000 });
    putDay(mealCache, addDays(weekStart, 1), { calories: 2200, protein: 160, carbs: 220, fats: 65, steps: 11000 });
    putDay(mealCache, addDays(weekStart, 2));

    const stats = getRollingWeekStats(mealCache, weekStart, addDays(weekStart, 2));
    expect(stats.daysLoggedNutrition).toBe(2);
    expect(stats.avgCalories).toBe(2100);
    expect(stats.daysLoggedSteps).toBe(2);
    expect(stats.avgSteps).toBe(10000);
    expect(stats.totalSteps).toBe(20000);
  });

  test('empty range produces all zeros without throwing', () => {
    const mealCache = new MealCache();
    const stats = getRollingWeekStats(mealCache, new Date('2026-02-02'), new Date('2026-02-02'));
    expect(stats.daysLoggedNutrition).toBe(0);
    expect(stats.avgCalories).toBe(0);
  });
});

describe('getWeeklyCalorieStats', () => {
  test('maps stored weekly nutrition into the shape calculatePlanAdjustment expects', () => {
    const weeklyNutrition = [
      { daysLoggedNutrition: 6, avgCalories: 2200, avgSteps: 8000 },
      { daysLoggedNutrition: 7, avgCalories: 2300, avgSteps: 9000 },
    ];
    expect(getWeeklyCalorieStats(weeklyNutrition, 4)).toEqual([
      { daysLogged: 6, avgCalories: 2200, avgSteps: 8000 },
      { daysLogged: 7, avgCalories: 2300, avgSteps: 9000 },
    ]);
  });

  test('only keeps the most recent N weeks', () => {
    const weeklyNutrition = [1, 2, 3, 4, 5].map(n => ({ daysLoggedNutrition: 6, avgCalories: 2000 + n, avgSteps: 0 }));
    const result = getWeeklyCalorieStats(weeklyNutrition, 2);
    expect(result).toHaveLength(2);
    expect(result[1].avgCalories).toBe(2005);
  });

  test('empty input returns an empty array', () => {
    expect(getWeeklyCalorieStats([])).toEqual([]);
    expect(getWeeklyCalorieStats(null)).toEqual([]);
  });
});

describe('snapshotPreviousWeek', () => {
  test('returns null when the previous week entry has no weekStart', () => {
    expect(snapshotPreviousWeek('u1', null, new MealCache(), {})).resolves.toBeNull();
  });

  test('builds a snapshot from logged days, excluding today, and merges it into existing weeklyNutrition', async () => {
    getDoc.mockResolvedValueOnce({ data: () => ({ weeklyNutrition: [{ weekStart: '2026-01-19', avgCalories: 2100 }] }) });

    const mealCache = new MealCache();
    const weekStart = new Date('2026-01-26');
    for (let i = 0; i < 6; i++) {
      putDay(mealCache, addDays(weekStart, i), { calories: 2200, protein: 160, carbs: 220, fats: 65, steps: 9000 });
    }

    const previousWeekEntry = { weekStart: '2026-01-26', average: 88.2 };
    const userData = { weightChangePlan: { type: 'weight_loss' } };
    const result = await snapshotPreviousWeek('u1', previousWeekEntry, mealCache, userData);

    expect(result.daysLoggedNutrition).toBe(6);
    expect(result.avgCalories).toBe(2200);
    expect(result.daysLoggedSteps).toBe(6);
    expect(result.weightAverage).toBe(88.2);
    expect(result.weeksSinceCutStart).toBe(1);

    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload] = setDoc.mock.calls[0];
    expect(payload.weeklyNutrition).toHaveLength(2);
    expect(payload.weeklyNutrition.map(w => w.weekStart)).toEqual(['2026-01-19', '2026-01-26']);
    expect(payload.weeksSinceCutStart).toBe(1);
  });

  test('returns null when nothing was logged that week', async () => {
    const mealCache = new MealCache();
    const previousWeekEntry = { weekStart: '2026-01-26' };
    const result = await snapshotPreviousWeek('u1', previousWeekEntry, mealCache, {});
    expect(result).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
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
  weightIns: weeksOfDecline(95, 0.5, 5),
  weeklyNutrition: [
    { avgCalories: 2400, daysLoggedNutrition: 6 },
    { avgCalories: 2400, daysLoggedNutrition: 6 },
  ],
};

describe('evaluateWeeklyProgress', () => {
  test('returns null with no plan or no targetCalories set', () => {
    expect(evaluateWeeklyProgress('u1', {}, new MealCache(), new Date())).resolves.toBeNull();
    expect(evaluateWeeklyProgress('u1', { weightChangePlan: {} }, new MealCache(), new Date())).resolves.toBeNull();
  });

  test('returns null inside the 6-day cadence gate since the last adjustment', async () => {
    const userData = { ...baseUserData, lastAdjustmentDate: new Date().toISOString() };
    const result = await evaluateWeeklyProgress('u1', userData, new MealCache(), new Date());
    expect(result).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('returns null when there is no weekly nutrition history yet', async () => {
    const userData = { ...baseUserData, weeklyNutrition: [] };
    const result = await evaluateWeeklyProgress('u1', userData, new MealCache(), new Date());
    expect(result).toBeNull();
  });

  test('too_slow branch persists new targets, macros, and lastCalorieAdjustment', async () => {
    const userData = { ...baseUserData, weightIns: weeksOfDecline(95, 0.1, 5) };
    const result = await evaluateWeeklyProgress('u1', userData, new MealCache(), new Date());
    expect(result.suggestion).toBe('calorie_adjustment');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload] = setDoc.mock.calls[0];
    expect(payload.targetCalories).toBeLessThan(userData.targetCalories);
    expect(payload.lastCalorieAdjustment.reason).toBe('too_slow');
    expect(payload.planConfidence).toBeDefined();
  });

  test('hold branch with no drift persists only the adjustment date and confidence, not new targets', async () => {
    const result = await evaluateWeeklyProgress('u1', baseUserData, new MealCache(), new Date());
    expect(result.suggestion).toBe('hold');
    const [, payload] = setDoc.mock.calls[0];
    expect(payload.targetCalories).toBeUndefined();
    expect(payload.lastAdjustmentDate).toBeDefined();
  });

  test('goal_reached branch persists a terminal lastCalorieAdjustment', async () => {
    const userData = { ...baseUserData, targetWeight: '93.2' };
    const result = await evaluateWeeklyProgress('u1', userData, new MealCache(), new Date());
    expect(result.suggestion).toBe('goal_reached');
    const [, payload] = setDoc.mock.calls[0];
    expect(payload.lastCalorieAdjustment.reason).toBe('goal_reached');
  });
});

describe('checkAndRunWeeklyEval', () => {
  test('returns null with fewer than 2 weight-ins', async () => {
    const userData = { ...baseUserData, weightIns: [baseUserData.weightIns[0]] };
    expect(await checkAndRunWeeklyEval('u1', userData, new MealCache())).toBeNull();
  });

  test('returns null with no weekly nutrition recorded', async () => {
    const userData = { ...baseUserData, weeklyNutrition: [] };
    expect(await checkAndRunWeeklyEval('u1', userData, new MealCache())).toBeNull();
  });

  test('returns null inside the cadence gate', async () => {
    const userData = { ...baseUserData, lastAdjustmentDate: new Date().toISOString() };
    expect(await checkAndRunWeeklyEval('u1', userData, new MealCache())).toBeNull();
  });

  test('delegates to evaluateWeeklyProgress once the guards clear', async () => {
    const result = await checkAndRunWeeklyEval('u1', baseUserData, new MealCache());
    expect(result).not.toBeNull();
    expect(result.suggestion).toBeDefined();
  });
});

describe('initializeUserTargets', () => {
  test('throws on missing parameters', async () => {
    await expect(initializeUserTargets(null, {})).rejects.toThrow('Invalid parameters');
  });

  test('writes targets derived from the weight change plan', async () => {
    const plan = { goalCalories: 2200, macros: { protein: 180, carbs: 200, fats: 70 }, tdee: 2800 };
    const targets = await initializeUserTargets('u1', plan);
    expect(targets.targetCalories).toBe(2200);
    expect(targets.targetsSource).toBe('formula');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('calculateLearningStats', () => {
  test('isComplete is false with fewer than requiredDays of logged nutrition', () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 0; i < 5; i++) {
      putDay(mealCache, addDays(currentDate, -i), { calories: 2000, protein: 150, carbs: 200, fats: 60 });
    }
    const stats = calculateLearningStats(mealCache, currentDate, 7);
    expect(stats.isComplete).toBe(false);
    expect(stats.daysLogged).toBe(5);
  });

  test('isComplete becomes true once requiredDays are logged, and averages are computed only from logged days', () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 0; i < 7; i++) {
      putDay(mealCache, addDays(currentDate, -i), { calories: 2000, protein: 150, carbs: 200, fats: 60 });
    }
    const stats = calculateLearningStats(mealCache, currentDate, 7);
    expect(stats.isComplete).toBe(true);
    expect(stats.averages.calories).toBe(2000);
  });
});

describe('checkAndCompleteLearning', () => {
  test('returns null immediately if the user already has targets', async () => {
    expect(await checkAndCompleteLearning('u1', new MealCache(), new Date(), true)).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('returns null while learning is still incomplete', async () => {
    const mealCache = new MealCache();
    putDay(mealCache, new Date('2026-02-10'), { calories: 2000, protein: 150, carbs: 200, fats: 60 });
    expect(await checkAndCompleteLearning('u1', mealCache, new Date('2026-02-10'), false)).toBeNull();
  });

  test('writes learning-sourced targets once 7 days are logged', async () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 0; i < 7; i++) {
      putDay(mealCache, addDays(currentDate, -i), { calories: 2100, protein: 160, carbs: 210, fats: 65 });
    }
    const targets = await checkAndCompleteLearning('u1', mealCache, currentDate, false);
    expect(targets.targetCalories).toBe(2100);
    expect(targets.targetsSource).toBe('learning');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('checkAndBackfillStepsBonus', () => {
  const backfillUserData = {
    weightChangePlan: { type: 'weight_loss' },
    planConfidence: 'estimated',
    targetCalories: 2200,
    currentWeight: '90',
    targetWeight: '80',
    fitnessGoals: 'weight_loss',
    activityLevel: 'sedentary',
    gender: 'male',
    height: '180',
    age: '28',
    bfCategory: 'lean',
    stressLevel: 'moderate',
    experienceLevel: 'intermediate',
  };

  test('returns null when there is no weight change plan yet', async () => {
    expect(await checkAndBackfillStepsBonus('u1', {}, new MealCache(), new Date('2026-02-10'))).toBeNull();
  });

  test('returns null once the plan is already calibrated', async () => {
    const userData = { ...backfillUserData, planConfidence: 'calibrated' };
    expect(await checkAndBackfillStepsBonus('u1', userData, new MealCache(), new Date('2026-02-10'))).toBeNull();
  });

  test('returns null once a calorie adjustment has already happened', async () => {
    const userData = { ...backfillUserData, lastCalorieAdjustment: { reason: 'too_slow' } };
    expect(await checkAndBackfillStepsBonus('u1', userData, new MealCache(), new Date('2026-02-10'))).toBeNull();
  });

  test('returns null once the backfill has already been applied once', async () => {
    const userData = { ...backfillUserData, stepsBonusAppliedAt: '2026-01-01T00:00:00.000Z' };
    expect(await checkAndBackfillStepsBonus('u1', userData, new MealCache(), new Date('2026-02-10'))).toBeNull();
  });

  test('returns null with fewer than 7 real days of step history', async () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 1; i <= 5; i++) {
      putDay(mealCache, addDays(currentDate, -i), { steps: 14000 });
    }
    expect(await checkAndBackfillStepsBonus('u1', backfillUserData, mealCache, currentDate)).toBeNull();
  });

  test('excludes the current in-progress day from the step count and minimum', async () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 1; i <= 6; i++) {
      putDay(mealCache, addDays(currentDate, -i), { steps: 14000 });
    }
    putDay(mealCache, currentDate, { steps: 500 });
    expect(await checkAndBackfillStepsBonus('u1', backfillUserData, mealCache, currentDate)).toBeNull();
  });

  test('recalibrates the plan from real step history once 7+ days are available', async () => {
    const mealCache = new MealCache();
    const currentDate = new Date('2026-02-10');
    for (let i = 1; i <= 10; i++) {
      putDay(mealCache, addDays(currentDate, -i), { steps: 16000 });
    }
    const targets = await checkAndBackfillStepsBonus('u1', backfillUserData, mealCache, currentDate);

    expect(targets.avgDailySteps).toBe(16000);
    expect(targets.stepsBonusAppliedAt).toBeDefined();
    expect(targets.lastCalorieAdjustment.reason).toBe('steps_calibrated');
    expect(targets.targetCalories).not.toBe(backfillUserData.targetCalories);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});
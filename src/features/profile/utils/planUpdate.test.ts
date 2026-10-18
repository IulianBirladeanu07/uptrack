import { buildPlanUpdate, planView, changedFields, isTargetWeightOnlyChange } from './planUpdate';
import { calculateWeightChangePlan } from './nutritionPlanEngine';

const base = {
  age: 30,
  height: 180,
  gender: 'male',
  currentWeight: 82,
  targetWeight: 78,
  activityLevel: 'moderately_active',
  experienceLevel: 'intermediate',
  stressLevel: 'moderate',
  autoAdjustEnabled: true,
  fitnessGoals: 'weight_loss',
  targetCalories: 3416,
  targetProtein: 200,
  targetCarbs: 430,
  targetFats: 67,
};

const NOW = '2026-10-07T10:00:00.000Z';

const makeUser = (confidence, extra = {}) => {
  const plan = calculateWeightChangePlan({ ...base, avgDailySteps: 9000, fitnessGoals: 'weight_loss' });
  return {
    ...base,
    avgDailySteps: 9000,
    weightChangePlan: plan,
    targetCalories: 3416,
    targetProtein: 200,
    targetCarbs: 430,
    targetFats: 67,
    maintenanceCalories: 3877,
    planConfidence: confidence,
    lastCalorieAdjustment: { reason: 'x' },
    lastAdjustmentDate: '2026-10-01',
    stepsBonusAppliedAt: '2026-09-01',
    weightIns: [],
    ...extra,
  };
};

const form = (over = {}) => ({ ...base, ...over });

describe('changedFields', () => {
  test('returns only fields that differ', () => {
    expect(changedFields(form({ age: 31 }), base)).toEqual({ age: 31 });
  });

  test('identifies a target-weight-only edit', () => {
    expect(isTargetWeightOnlyChange(changedFields(form({ targetWeight: 79.5 }), base))).toBe(true);
    expect(isTargetWeightOnlyChange(changedFields(form({ targetWeight: 79.5, age: 31 }), base))).toBe(false);
  });
});

describe('buildPlanUpdate', () => {
  test('a calibrated plan keeps learned targets when a non-goal field changes', () => {
    const user = makeUser('calibrated');
    const p = buildPlanUpdate({ userData: user, form: form({ activityLevel: 'very_active' }), original: base, now: NOW });
    expect(p.activityLevel).toBe('very_active');
    ['targetCalories', 'targetProtein', 'targetCarbs', 'targetFats', 'maintenanceCalories', 'planConfidence',
      'lastCalorieAdjustment', 'lastAdjustmentDate', 'stepsBonusAppliedAt', 'goalSwitchDate', 'startWeight']
      .forEach(k => expect(p).not.toHaveProperty(k));
    expect(p.weightChangePlan).toBeTruthy();
  });

  test('an estimated plan recalculates from the formula and resets adaptive state', () => {
    const user = makeUser('estimated');
    const p = buildPlanUpdate({ userData: user, form: form({ activityLevel: 'very_active' }), original: base, now: NOW });
    const expected = calculateWeightChangePlan({ ...form({ activityLevel: 'very_active' }), avgDailySteps: 9000, fitnessGoals: 'weight_loss' });
    expect(p.targetCalories).toBe(expected.goalCalories);
    expect(p.planConfidence).toBe('estimated');
    expect(p.lastCalorieAdjustment).toBeNull();
    expect(p.stepsBonusAppliedAt).toBeNull();
    expect(p).not.toHaveProperty('goalSwitchDate');
  });

  test('a goal change replans even when the plan is calibrated and restarts the phase', () => {
    const user = makeUser('calibrated');
    const p = buildPlanUpdate({
      userData: user,
      form: form({ fitnessGoals: 'muscle_gain', age: 31 }),
      original: base,
      now: NOW,
    });
    expect(p.fitnessGoals).toBe('muscle_gain');
    expect(p.planConfidence).toBe('estimated');
    expect(p.goalSwitchDate).toBe(NOW);
    expect(p.weeksSinceCutStart).toBe(0);
    expect(p.startWeight).toBe(82);
  });

  test.each(['estimated', 'calibrated'])('a target-weight-only edit preserves an %s plan even if it crosses current weight', confidence => {
    const p = buildPlanUpdate({
      userData: makeUser(confidence),
      form: form({ targetWeight: 90 }),
      original: base,
      now: NOW,
    });
    expect(p).toEqual({ targetWeight: 90 });
  });

  test('untouched fields and avgDailySteps are never written', () => {
    const user = makeUser('calibrated');
    const p = buildPlanUpdate({ userData: user, form: form({ height: 181 }), original: base, now: NOW });
    expect(p.height).toBe(181);
    ['age', 'gender', 'currentWeight', 'targetWeight', 'avgDailySteps'].forEach(k => expect(p).not.toHaveProperty(k));
  });

  test('toggling auto-adjust on a calibrated plan writes only that field', () => {
    const p = buildPlanUpdate({ userData: makeUser('calibrated'), form: form({ autoAdjustEnabled: false }), original: base, now: NOW });
    expect(p).toEqual({ autoAdjustEnabled: false });
  });

  test('a calibrated plan without a stored weightChangePlan writes only the changed fields', () => {
    const user = makeUser('calibrated', { weightChangePlan: undefined });
    const p = buildPlanUpdate({ userData: user, form: form({ age: 31 }), original: base, now: NOW });
    expect(p).toEqual({ age: 31 });
  });
});

describe('planView', () => {
  test('shows the stored targets as the current plan', () => {
    const v = planView({ userData: makeUser('calibrated'), form: form(), original: base });
    expect(v.base.goalCalories).toBe(3416);
    expect(v.base.macros).toEqual({ protein: 200, carbs: 430, fats: 67 });
  });

  test('a calibrated plan shows no calorie change for non-goal edits', () => {
    const v = planView({ userData: makeUser('calibrated'), form: form({ activityLevel: 'very_active' }), original: base });
    expect(v.replan).toBe(false);
    expect(v.next.goalCalories).toBe(3416);
    expect(v.next.macros).toEqual(v.base.macros);
  });

  test('an estimated plan previews the formula result', () => {
    const user = makeUser('estimated');
    const v = planView({ userData: user, form: form({ activityLevel: 'very_active' }), original: base });
    const expected = calculateWeightChangePlan({ ...form({ activityLevel: 'very_active' }), avgDailySteps: 9000, fitnessGoals: 'weight_loss' });
    expect(v.replan).toBe(true);
    expect(v.next.goalCalories).toBe(expected.goalCalories);
  });

  test('a target-weight-only edit previews the current goal and nutrition targets', () => {
    const user = makeUser('estimated');
    const v = planView({
      userData: user,
      form: form({ targetWeight: 79.5 }),
      original: base,
    });

    expect(v.replan).toBe(false);
    expect(v.base.goalCalories).toBe(3416);
    expect(v.next.goalCalories).toBe(3416);
    expect(v.next.macros).toEqual(v.base.macros);
  });

  test('a target-weight-only edit keeps the existing goal when it crosses current weight', () => {
    const v = planView({
      userData: makeUser('estimated'),
      form: form({ targetWeight: 90 }),
      original: base,
    });

    expect(v.goal).toBe('weight_loss');
    expect(v.replan).toBe(false);
    expect(v.next.goalCalories).toBe(3416);
  });

  test('manual nutrition targets are saved with the plan', () => {
    const user = makeUser('calibrated');
    const formData = form({ targetCalories: 3500, targetProtein: 210, targetCarbs: 445, targetFats: 70 });
    const p = buildPlanUpdate({ userData: user, form: formData, original: base, now: NOW });

    expect(p).toMatchObject({
      targetCalories: 3500,
      targetProtein: 210,
      targetCarbs: 445,
      targetFats: 70,
      weightChangePlan: {
        goalCalories: 3500,
        macros: { protein: 210, carbs: 445, fats: 70 },
      },
    });
  });

  test('an explicit phase selection replans even when the target weight is unchanged', () => {
    const p = buildPlanUpdate({
      userData: makeUser('calibrated'),
      form: form({ fitnessGoals: 'muscle_gain' }),
      original: base,
      now: NOW,
    });

    expect(p.fitnessGoals).toBe('muscle_gain');
    expect(p.weightChangePlan).toMatchObject({ type: 'muscle_gain' });
    expect(p.goalSwitchDate).toBe(NOW);
  });
});

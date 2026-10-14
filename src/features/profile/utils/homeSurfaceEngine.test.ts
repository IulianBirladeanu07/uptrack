import { getCalorieAdjustmentNotice } from './homeSurfaceEngine';

const recent = () => new Date(Date.now() - 3600000).toISOString();

const cutUser = (over = {}) => ({
  weightChangePlan: { type: 'weight_loss' },
  lastCalorieAdjustment: {
    reason: 'too_fast',
    adjustment: 400,
    newTargetCalories: 3638,
    adjustedAt: recent(),
    ...over,
  },
});

describe('getCalorieAdjustmentNotice', () => {
  test('uses cut-specific copy when a weight-loss plan raises calories for too_fast', () => {
    const n = getCalorieAdjustmentNotice(cutUser());
    expect(n.title).toBe('Calories raised to 3638 to slow your cut');
    expect(n.body).toContain('slow the cut');
  });

  test('adds the gap to measured maintenance when it is known and higher than the target', () => {
    const n = getCalorieAdjustmentNotice(cutUser({ measuredTDEE: 3883 }));
    expect(n.body).toContain('245 kcal under your measured maintenance of 3883');
  });

  test('omits the maintenance gap when measured maintenance is not above the target', () => {
    const n = getCalorieAdjustmentNotice(cutUser({ measuredTDEE: 3600 }));
    expect(n.body).not.toContain('maintenance');
  });

  test('keeps the generic copy for a muscle-gain plan', () => {
    const u = cutUser();
    u.weightChangePlan = { type: 'muscle_gain' };
    expect(getCalorieAdjustmentNotice(u).title).toBe('Calories increased to 3638');
  });

  test('keeps the generic copy for a calorie decrease on a cut', () => {
    const n = getCalorieAdjustmentNotice(cutUser({ reason: 'too_slow', adjustment: -200 }));
    expect(n.title).toBe('Calories adjusted to 3638');
  });

  test('returns null for goal_reached, stale and dismissed adjustments', () => {
    expect(getCalorieAdjustmentNotice(cutUser({ reason: 'goal_reached' }))).toBeNull();
    expect(getCalorieAdjustmentNotice(cutUser({ adjustedAt: '2020-01-01T00:00:00.000Z' }))).toBeNull();
    const u = cutUser();
    expect(getCalorieAdjustmentNotice(u, [u.lastCalorieAdjustment.adjustedAt])).toBeNull();
  });
});

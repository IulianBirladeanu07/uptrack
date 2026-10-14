import {
  estimateMaintenanceRegression,
  maintenanceSeries,
  REGRESSION_MIN_WEEKS,
  REGRESSION_MAX_WEEKS,
} from './maintenanceEstimator';
import { shiftWeekStart } from './weightTrendEngine';
import { buildWeightIns, buildDailyWeights, REALISTIC_DAILY_NOISE } from './testFixtures';

const START = '2026-01-05';
const NOW = new Date(2026, 2, 16);
const TRUE_MAINT = 3000;
const INTAKE = 2500;
const DAILY_RATE = ((INTAKE - TRUE_MAINT) / 7700);

const weeksFrom = (count, extra = () => ({})) =>
  Array.from({ length: count }, (_, i) => ({
    weekStart: shiftWeekStart(START, i),
    daysLogged: 7,
    avgCalories: INTAKE,
    avgSteps: 10000,
    daysLoggedSteps: 7,
    ...extra(i),
  }));

const weightsFor = (count, noise = REALISTIC_DAILY_NOISE) =>
  buildWeightIns(START, buildDailyWeights(90, DAILY_RATE, count * 7, noise));

describe('estimateMaintenanceRegression', () => {
  test('recovers the true maintenance from noisy daily weights', () => {
    const r = estimateMaintenanceRegression(weightsFor(10), weeksFrom(10), NOW);
    expect(Math.abs(r.maintenance - TRUE_MAINT)).toBeLessThan(120);
    expect(r.windowed).toBe(true);
    expect(r.weeksUsed).toBe(REGRESSION_MAX_WEEKS);
    expect(r.rateKgPerWeek).toBeCloseTo(DAILY_RATE * 7, 1);
  });

  test('reports a standard error and a wider 95 percent margin', () => {
    const r = estimateMaintenanceRegression(weightsFor(10), weeksFrom(10), NOW);
    expect(r.se).toBeGreaterThan(0);
    expect(r.margin).toBeGreaterThan(r.se);
  });

  test('always uses exactly the newest four weeks', () => {
    const noisy = [1.2, -0.9, 0.6, -1.1, 0.8, 1.0, -0.6, -0.9, 1.1, -0.7];
    expect(estimateMaintenanceRegression(weightsFor(10, [0]), weeksFrom(10), NOW).weeksUsed).toBe(REGRESSION_MIN_WEEKS);
    expect(estimateMaintenanceRegression(weightsFor(10, noisy), weeksFrom(10), NOW).weeksUsed).toBe(REGRESSION_MAX_WEEKS);
  });

  test('ignores the week that is still in progress', () => {
    const weeks = weeksFrom(10, i => (i === 9 ? { avgCalories: 6000 } : {}));
    const midWeek = new Date(2026, 2, 12);
    const r = estimateMaintenanceRegression(weightsFor(10), weeks, midWeek);
    expect(r.avgCalories).toBeLessThan(3000);
  });

  test('returns null with fewer than four usable weeks', () => {
    expect(estimateMaintenanceRegression(weightsFor(3), weeksFrom(3), NOW)).toBeNull();
    expect(estimateMaintenanceRegression(weightsFor(10), [], NOW)).toBeNull();
    expect(estimateMaintenanceRegression([], weeksFrom(10), NOW)).toBeNull();
  });

  test('stops at a week with too few logged days', () => {
    const weeks = weeksFrom(10, i => (i === 7 ? { daysLogged: 2 } : {}));
    expect(estimateMaintenanceRegression(weightsFor(10), weeks, NOW)).toBeNull();
  });

  test('stops at a gap in the weekly history', () => {
    const weeks = weeksFrom(10).filter((_, i) => i !== 7);
    expect(estimateMaintenanceRegression(weightsFor(10), weeks, NOW)).toBeNull();
  });

  test('ignores the steps of weeks older than the window', () => {
    const r = estimateMaintenanceRegression(
      weightsFor(10),
      weeksFrom(10, i => (i < 5 ? { avgSteps: 20000 } : {})),
      NOW,
    );
    expect(r).not.toBeNull();
    expect(r.weeksUsed).toBe(REGRESSION_MIN_WEEKS);
  });

  test('returns null when steps moved sharply inside the newest four weeks', () => {
    const weeks = weeksFrom(10, i => (i === 9 ? { avgSteps: 20000 } : {}));
    expect(estimateMaintenanceRegression(weightsFor(10), weeks, NOW)).toBeNull();
  });

  test('does not trust a thin step sample for the shift check', () => {
    const weeks = weeksFrom(10, i => (i === 9 ? { avgSteps: 20000, daysLoggedSteps: 1 } : {}));
    expect(estimateMaintenanceRegression(weightsFor(10), weeks, NOW)).not.toBeNull();
  });

  test('weights intake by logged days', () => {
    const weeks = weeksFrom(6, i => (i === 5 ? { daysLogged: 4, avgCalories: 3500 } : {}));
    const r = estimateMaintenanceRegression(weightsFor(6), weeks, NOW);
    expect(r.weeksUsed).toBe(REGRESSION_MIN_WEEKS);
    expect(r.avgCalories).toBe(Math.round((2500 * 7 * 3 + 3500 * 4) / (7 * 3 + 4)));
  });

  test('needs enough weigh-ins inside the window', () => {
    const sparse = buildWeightIns(START, buildDailyWeights(90, DAILY_RATE, 70, [0]).map((w, i) => (i % 7 === 0 ? w : null)));
    expect(estimateMaintenanceRegression(sparse, weeksFrom(10), NOW)).toBeNull();
  });
});

describe('maintenanceSeries', () => {
  test('has one entry per week and stays null until four weeks exist', () => {
    const weeks = weeksFrom(10);
    const s = maintenanceSeries(weightsFor(10), weeks);
    expect(s).toHaveLength(10);
    expect(s.slice(0, 3).every(v => v == null)).toBe(true);
    expect(s[3]).not.toBeNull();
    expect(Math.abs(s[9] - TRUE_MAINT)).toBeLessThan(120);
  });

  test('is null for weeks without calorie data', () => {
    const weeks = weeksFrom(10, i => (i === 9 ? { avgCalories: null, daysLogged: 0 } : {}));
    const s = maintenanceSeries(weightsFor(10), weeks);
    expect(s[9]).toBeNull();
  });
});

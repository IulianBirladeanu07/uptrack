import {
  flattenWeightInsChronological,
  buildWeightTrendSeries,
  getCurrentTrendWeight,
  calculateWeeklyRateOfChange,
  detectPlateau,
  isGoalReached,
  isSuspiciousWeightEntry,
  getPlanConfidence,
} from './weightTrendEngine';
import { buildWeightIns, buildDailyWeights, REALISTIC_DAILY_NOISE } from './testFixtures';

describe('flattenWeightInsChronological', () => {
  test('empty or null input returns empty array', () => {
    expect(flattenWeightInsChronological(null)).toEqual([]);
    expect(flattenWeightInsChronological([])).toEqual([]);
  });

  test('skips weeks missing days or weekStart', () => {
    const weightIns = [{ weekStart: '2026-01-05', days: null }, { days: { monday: 80 } }];
    expect(flattenWeightInsChronological(weightIns)).toEqual([]);
  });

  test('flattens and sorts chronologically across weeks regardless of input order', () => {
    const week1 = { weekStart: '2026-01-05', days: { monday: 80, wednesday: 79.5 } };
    const week2 = { weekStart: '2026-01-12', days: { monday: 79 } };
    const entries = flattenWeightInsChronological([week2, week1]);
    expect(entries).toHaveLength(3);
    expect(entries.map(e => e.weight)).toEqual([80, 79.5, 79]);
    expect(entries[0].date.getTime()).toBeLessThan(entries[1].date.getTime());
    expect(entries[1].date.getTime()).toBeLessThan(entries[2].date.getTime());
  });

  test('ignores null and NaN day values', () => {
    const weightIns = [{ weekStart: '2026-01-05', days: { monday: 80, tuesday: null, wednesday: 'x' } }];
    expect(flattenWeightInsChronological(weightIns)).toHaveLength(1);
  });
});

describe('buildWeightTrendSeries', () => {
  test('EMA matches manual calculation for a known sequence', () => {
    const weightIns = buildWeightIns('2026-01-05', [80, 81, 79]);
    const series = buildWeightTrendSeries(weightIns);

    const t0 = 80;
    const t1 = t0 + 0.1 * (81 - t0);
    const t2 = t1 + 0.1 * (79 - t1);

    expect(series[0].trendWeight).toBeCloseTo(t0, 2);
    expect(series[1].trendWeight).toBeCloseTo(t1, 2);
    expect(series[2].trendWeight).toBeCloseTo(t2, 2);
  });

  test('empty input returns empty series', () => {
    expect(buildWeightTrendSeries([])).toEqual([]);
  });
});

describe('getCurrentTrendWeight', () => {
  test('returns last trend point', () => {
    const weightIns = buildWeightIns('2026-01-05', [80, 81, 79]);
    expect(getCurrentTrendWeight(weightIns)).toBe(buildWeightTrendSeries(weightIns).at(-1).trendWeight);
  });

  test('returns null for no data', () => {
    expect(getCurrentTrendWeight([])).toBeNull();
  });
});

describe('calculateWeeklyRateOfChange', () => {
  test('returns null with fewer than 4 points', () => {
    const weightIns = buildWeightIns('2026-01-05', [80, 79, 78]);
    const series = buildWeightTrendSeries(weightIns);
    expect(calculateWeeklyRateOfChange(series)).toBeNull();
  });

  test('returns null when fewer than 4 points fall inside the window', () => {
    const dailyWeights = buildDailyWeights(85, -0.05, 40);
    const weightIns = buildWeightIns('2026-01-05', dailyWeights);
    const series = buildWeightTrendSeries(weightIns);
    expect(calculateWeeklyRateOfChange(series, 1)).toBeNull();
  });

  test('recovers the true underlying weekly rate from a noisy 5-week weight-loss trend', () => {
    const dailyRateKg = -0.5 / 7;
    const dailyWeights = buildDailyWeights(92, dailyRateKg, 35, REALISTIC_DAILY_NOISE);
    const weightIns = buildWeightIns('2026-01-05', dailyWeights);
    const series = buildWeightTrendSeries(weightIns);

    const rate = calculateWeeklyRateOfChange(series);
    expect(rate).not.toBeNull();
    expect(rate).toBeCloseTo(-0.5, 0);
    expect(rate).toBeLessThan(-0.35);
    expect(rate).toBeGreaterThan(-0.65);
  });

  test('recovers a muscle-gain (positive) weekly rate from noisy data', () => {
    const dailyRateKg = 0.25 / 7;
    const dailyWeights = buildDailyWeights(75, dailyRateKg, 35, REALISTIC_DAILY_NOISE);
    const weightIns = buildWeightIns('2026-01-05', dailyWeights);
    const series = buildWeightTrendSeries(weightIns);

    const rate = calculateWeeklyRateOfChange(series);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeCloseTo(0.25, 0);
  });

  test('returns near-zero rate for a flat maintenance trend', () => {
    const dailyWeights = buildDailyWeights(80, 0, 35, REALISTIC_DAILY_NOISE);
    const weightIns = buildWeightIns('2026-01-05', dailyWeights);
    const series = buildWeightTrendSeries(weightIns);

    const rate = calculateWeeklyRateOfChange(series);
    expect(Math.abs(rate)).toBeLessThan(0.15);
  });
});

describe('detectPlateau', () => {
  test('flags a rate below the threshold as a plateau', () => {
    expect(detectPlateau(0.05, 90)).toBe(true);
  });

  test('does not flag a normal ongoing rate as a plateau', () => {
    expect(detectPlateau(-0.5, 90)).toBe(false);
  });

  test('returns false for null rate or missing weight', () => {
    expect(detectPlateau(null, 90)).toBe(false);
    expect(detectPlateau(-0.1, 0)).toBe(false);
  });
});

describe('isGoalReached', () => {
  test('true within default tolerance', () => {
    expect(isGoalReached(80.4, 80)).toBe(true);
    expect(isGoalReached(80.5, 80)).toBe(true);
  });

  test('false outside tolerance', () => {
    expect(isGoalReached(81, 80)).toBe(false);
  });

  test('false when either value is missing', () => {
    expect(isGoalReached(null, 80)).toBe(false);
    expect(isGoalReached(80, null)).toBe(false);
  });
});

describe('isSuspiciousWeightEntry', () => {
  test('flags an entry that deviates more than the default 5 percent', () => {
    expect(isSuspiciousWeightEntry(90, 80)).toBe(true);
  });

  test('does not flag normal day-to-day fluctuation', () => {
    expect(isSuspiciousWeightEntry(80.8, 80)).toBe(false);
  });

  test('returns false when there is no established trend yet', () => {
    expect(isSuspiciousWeightEntry(90, null)).toBe(false);
  });
});

describe('getPlanConfidence', () => {
  test('estimated when there is not enough recent weight or calorie logging', () => {
    const weightIns = buildWeightIns('2026-01-05', [80, 79.5]);
    const series = buildWeightTrendSeries(weightIns);
    expect(getPlanConfidence(series, [])).toBe('estimated');
  });

  test('calibrated once both weight and calorie logging clear the 10-day threshold within the last 14 days', () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 13);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

    const dailyWeights = buildDailyWeights(80, -0.05, 14);
    const weightIns = buildWeightIns(startStr, dailyWeights);
    const series = buildWeightTrendSeries(weightIns);

    const weeklyCalorieData = [{ daysLogged: 6 }, { daysLogged: 5 }];
    expect(getPlanConfidence(series, weeklyCalorieData)).toBe('calibrated');
  });

  test('estimated when weight logging is recent but calorie logging is not', () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 13);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

    const dailyWeights = buildDailyWeights(80, -0.05, 14);
    const weightIns = buildWeightIns(startStr, dailyWeights);
    const series = buildWeightTrendSeries(weightIns);

    expect(getPlanConfidence(series, [{ daysLogged: 2 }])).toBe('estimated');
  });
});
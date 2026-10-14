import { MIN_VALID_STEPS, weekDayKeys, weekStepStats, overlayWeekSteps, diffPastSteps } from './stepStats';

describe('weekDayKeys', () => {
  test('returns seven consecutive local dates across a month boundary', () => {
    expect(weekDayKeys('2026-08-31')).toEqual([
      '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06',
    ]);
  });
});

describe('weekStepStats', () => {
  const steps = { '2026-02-23': 9972, '2026-02-24': 9972, '2026-02-25': 29, '2026-02-26': 29, '2026-02-27': 29, '2026-02-28': 29, '2026-03-01': 8531 };

  test('ignores near-zero days instead of averaging them in', () => {
    const s = weekStepStats(steps, '2026-02-23');
    expect(s.days).toBe(3);
    expect(s.avg).toBe(Math.round((9972 + 9972 + 8531) / 3));
  });

  test('takes the larger of stored and cached value per day', () => {
    const s = weekStepStats({ '2026-10-01': 8000 }, '2026-09-28', k => (k === '2026-10-01' ? 12000 : 0));
    expect(s.total).toBe(12000);
  });

  test('skips the given key', () => {
    const s = weekStepStats({ '2026-10-01': 8000, '2026-10-02': 9000 }, '2026-09-28', null, '2026-10-02');
    expect(s.days).toBe(1);
  });

  test('empty when nothing valid', () => {
    expect(weekStepStats(undefined, '2026-09-28')).toEqual({ days: 0, total: 0, avg: 0 });
    expect(weekStepStats({ '2026-09-28': MIN_VALID_STEPS - 1 }, '2026-09-28').days).toBe(0);
  });
});

describe('overlayWeekSteps', () => {
  const days = Object.fromEntries(weekDayKeys('2026-08-03').map((k, i) => [k, 10000 + i * 1000]));

  test('replaces a thin snapshot when dailySteps covers more days', () => {
    const out = overlayWeekSteps({ weekStart: '2026-08-03', avgSteps: 19724, daysLoggedSteps: 1 }, days);
    expect(out.daysLoggedSteps).toBe(7);
    expect(out.avgSteps).toBe(13000);
    expect(out.totalSteps).toBe(91000);
  });

  test('keeps a snapshot that is already as complete', () => {
    const snap = { weekStart: '2026-08-03', avgSteps: 15000, daysLoggedSteps: 7 };
    expect(overlayWeekSteps(snap, days)).toBe(snap);
  });

  test('passes through without dailySteps or weekStart', () => {
    const snap = { weekStart: '2026-08-03', avgSteps: 1, daysLoggedSteps: 1 };
    expect(overlayWeekSteps(snap, null)).toBe(snap);
    expect(overlayWeekSteps({ avgSteps: 1 }, days)).toEqual({ avgSteps: 1 });
  });
});

describe('diffPastSteps', () => {
  test('never returns today or later', () => {
    expect(diffPastSteps({}, { '2026-10-03': 8000, '2026-10-04': 5000, '2026-10-05': 7000 }, '2026-10-04')).toEqual({ '2026-10-03': 8000 });
  });

  test('writes new days and strictly larger values only', () => {
    const out = diffPastSteps({ '2026-10-01': 8000, '2026-10-02': 9000, '2026-10-03': 7000 }, { '2026-10-01': 8000, '2026-10-02': 9500, '2026-10-03': 6000, '2026-09-30': 12000 }, '2026-10-04');
    expect(out).toEqual({ '2026-10-02': 9500, '2026-09-30': 12000 });
  });

  test('ignores implausible, non-numeric and fractional-equal values', () => {
    expect(diffPastSteps({}, { a: 0, b: 29, c: 'x', d: null, '2026-10-01': 999 }, '2026-10-04')).toEqual({});
    expect(diffPastSteps({ '2026-10-01': 5000 }, { '2026-10-01': 5000.4 }, '2026-10-04')).toEqual({});
  });

  test('handles missing stored and incoming', () => {
    expect(diffPastSteps(undefined, { '2026-10-01': 5000 }, '2026-10-04')).toEqual({ '2026-10-01': 5000 });
    expect(diffPastSteps({ a: 5 }, undefined, '2026-10-04')).toEqual({});
  });
});

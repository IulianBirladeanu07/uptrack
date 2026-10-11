import { bucketsToDailySteps, toDateKey } from './stepBuckets';

describe('toDateKey', () => {
  it('uses the date part of a local date time', () => {
    expect(toDateKey('2026-10-11T00:00')).toBe('2026-10-11');
    expect(toDateKey('2026-10-11T00:00:00')).toBe('2026-10-11');
  });

  it('converts an instant to the local date', () => {
    const local = new Date(2026, 9, 11, 0, 0, 0);
    expect(toDateKey(local.toISOString())).toBe('2026-10-11');
  });

  it('converts an offset time to the local date', () => {
    const local = new Date(2026, 0, 5, 12, 0, 0);
    expect(toDateKey(local.toISOString().replace('Z', '+00:00'))).toBe('2026-01-05');
  });
});

describe('bucketsToDailySteps', () => {
  it('maps each bucket to its day', () => {
    expect(
      bucketsToDailySteps([
        { startTime: '2026-10-10T00:00', result: { COUNT_TOTAL: 8123 } },
        { startTime: '2026-10-11T00:00', result: { COUNT_TOTAL: 4010 } },
      ]),
    ).toEqual({ '2026-10-10': 8123, '2026-10-11': 4010 });
  });

  it('keeps explicit zeros and skips days without data', () => {
    expect(
      bucketsToDailySteps([
        { startTime: '2026-10-09T00:00', result: { COUNT_TOTAL: 0 } },
        { startTime: '2026-10-10T00:00', result: {} },
      ]),
    ).toEqual({ '2026-10-09': 0 });
  });

  it('sums buckets that fall on the same day', () => {
    expect(
      bucketsToDailySteps([
        { startTime: '2026-10-11T00:00', result: { COUNT_TOTAL: 100 } },
        { startTime: '2026-10-11T00:00', result: { COUNT_TOTAL: 50 } },
      ]),
    ).toEqual({ '2026-10-11': 150 });
  });

  it('returns an empty object for no buckets', () => {
    expect(bucketsToDailySteps([])).toEqual({});
  });
});

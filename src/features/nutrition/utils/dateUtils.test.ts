import { differenceInLocalDays, formatDate, getLocalDateBucket, toLocalDate } from './dateUtils';

describe('nutrition date utilities', () => {
  it('preserves local calendar dates passed as date-only strings', () => {
    expect(formatDate('2026-10-15')).toBe('2026-10-15');
    expect(formatDate(toLocalDate('2026-10-15'))).toBe('2026-10-15');
  });

  it('rejects invalid date-only strings instead of normalizing them', () => {
    expect(() => toLocalDate('2026-02-30')).toThrow('Invalid local date: 2026-02-30');
  });

  it('preserves instants in timestamp strings', () => {
    expect(formatDate('2026-10-15T00:00:00.000Z')).toBe(formatDate(new Date('2026-10-15T00:00:00.000Z')));
  });

  it('calculates calendar-day differences across daylight-saving changes', () => {
    expect(differenceInLocalDays(new Date(2026, 2, 30), new Date(2026, 2, 28))).toBe(2);
    expect(differenceInLocalDays('2026-10-18', '2026-10-16')).toBe(2);
  });

  it('keeps date bucket boundaries at local midnight across daylight-saving changes', () => {
    const { start, end } = getLocalDateBucket('2026-03-02', 1, 7);

    expect(formatDate(start)).toBe('2026-03-09');
    expect(start.getHours()).toBe(0);
    expect(formatDate(end)).toBe('2026-03-15');
    expect(end.getHours()).toBe(23);
    expect(end.getMilliseconds()).toBe(999);
  });
});

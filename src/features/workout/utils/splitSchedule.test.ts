import {
  toDateKey,
  getCycleLength,
  getRotationDayNumber,
  getScheduledDay,
  getWeekSchedule,
  getWorkoutsPerWeek,
  isRotationSplit,
} from './splitSchedule';

const w = name => ({ templateName: name, exercises: [{ id: name }] });
const rest = { templateId: 'rest-day', templateName: 'Rest Day', exercises: [] };

const weekly = {
  type: 'weekly',
  schedule: { monday: w('Push'), wednesday: w('Pull'), friday: w('Legs'), sunday: rest },
};

const rotation = {
  type: 'rotation',
  schedule: { 1: w('Push'), 2: w('Pull'), 3: w('Legs'), 4: rest },
};

describe('toDateKey', () => {
  it('formats the local date', () => {
    expect(toDateKey(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
    expect(toDateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});

describe('getCycleLength', () => {
  it('uses the highest day number, not the key count', () => {
    expect(getCycleLength({ type: 'rotation', schedule: { 1: w('A'), 2: w('B'), 4: w('C') } })).toBe(4);
    expect(getCycleLength(rotation)).toBe(4);
  });

  it('ignores weekday keys and empty schedules', () => {
    expect(getCycleLength(weekly)).toBe(0);
    expect(getCycleLength({ type: 'rotation', schedule: {} })).toBe(0);
    expect(getCycleLength(null)).toBe(0);
  });
});

describe('getRotationDayNumber', () => {
  it('is day 1 on the start date and advances daily', () => {
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 5), '2026-10-05')).toBe(1);
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 6), '2026-10-05')).toBe(2);
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 8), '2026-10-05')).toBe(4);
  });

  it('wraps after a full cycle', () => {
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 9), '2026-10-05')).toBe(1);
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 31), '2026-10-05')).toBe(3);
  });

  it('wraps backwards for dates before the start', () => {
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 4), '2026-10-05')).toBe(4);
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 1), '2026-10-05')).toBe(1);
  });

  it('ignores the time of day', () => {
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 6, 23, 59, 59), '2026-10-05')).toBe(2);
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 6, 0, 0, 1), '2026-10-05')).toBe(2);
  });

  it('is stable across a daylight saving change', () => {
    const split = { type: 'rotation', schedule: { 1: w('A'), 2: w('B'), 3: w('C'), 4: w('D'), 5: w('E'), 6: w('F'), 7: w('G') } };
    expect(getRotationDayNumber(split, new Date(2026, 2, 29, 12), '2026-03-25')).toBe(5);
    expect(getRotationDayNumber(split, new Date(2026, 9, 25, 12), '2026-10-21')).toBe(5);
  });

  it('returns null without a valid start date or cycle', () => {
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 5), undefined)).toBeNull();
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 5), '')).toBeNull();
    expect(getRotationDayNumber(rotation, new Date(2026, 9, 5), '2026-13-40')).toBeNull();
    expect(getRotationDayNumber({ type: 'rotation', schedule: {} }, new Date(2026, 9, 5), '2026-10-05')).toBeNull();
  });
});

describe('getScheduledDay', () => {
  it('reads weekday keys for weekly splits', () => {
    expect(getScheduledDay(weekly, new Date(2026, 9, 5))).toBe(weekly.schedule.monday);
    expect(getScheduledDay(weekly, new Date(2026, 9, 6))).toBeNull();
    expect(getScheduledDay(weekly, new Date(2026, 9, 11))).toBe(weekly.schedule.sunday);
  });

  it('ignores the start date for weekly splits', () => {
    expect(getScheduledDay(weekly, new Date(2026, 9, 7), '2020-01-01')).toBe(weekly.schedule.wednesday);
  });

  it('treats a split without a type as weekly', () => {
    expect(getScheduledDay({ schedule: weekly.schedule }, new Date(2026, 9, 5))).toBe(weekly.schedule.monday);
  });

  it('reads the rotation day for rotation splits', () => {
    expect(getScheduledDay(rotation, new Date(2026, 9, 5), '2026-10-05')).toBe(rotation.schedule[1]);
    expect(getScheduledDay(rotation, new Date(2026, 9, 7), '2026-10-05')).toBe(rotation.schedule[3]);
    expect(getScheduledDay(rotation, new Date(2026, 9, 8), '2026-10-05')).toBe(rotation.schedule[4]);
  });

  it('returns null for a rotation split without a start date', () => {
    expect(getScheduledDay(rotation, new Date(2026, 9, 5))).toBeNull();
  });

  it('returns null for a gap in the cycle', () => {
    const gap = { type: 'rotation', schedule: { 1: w('A'), 3: w('C') } };
    expect(getScheduledDay(gap, new Date(2026, 9, 6), '2026-10-05')).toBeNull();
    expect(getScheduledDay(gap, new Date(2026, 9, 7), '2026-10-05')).toBe(gap.schedule[3]);
  });

  it('reads type and schedule from a nested data object', () => {
    const nested = { data: rotation };
    expect(getScheduledDay(nested, new Date(2026, 9, 6), '2026-10-05')).toBe(rotation.schedule[2]);
  });
});

describe('getWeekSchedule', () => {
  it('returns the schedule itself for weekly splits', () => {
    expect(getWeekSchedule(weekly, new Date(2026, 9, 7))).toBe(weekly.schedule);
  });

  it('maps the rotation onto Monday to Sunday of the current week', () => {
    const week = getWeekSchedule(rotation, new Date(2026, 9, 7), '2026-10-05');
    expect(week.monday).toBe(rotation.schedule[1]);
    expect(week.tuesday).toBe(rotation.schedule[2]);
    expect(week.wednesday).toBe(rotation.schedule[3]);
    expect(week.thursday).toBe(rotation.schedule[4]);
    expect(week.friday).toBe(rotation.schedule[1]);
    expect(week.saturday).toBe(rotation.schedule[2]);
    expect(week.sunday).toBe(rotation.schedule[3]);
  });

  it('uses the week that contains today when today is Sunday', () => {
    const week = getWeekSchedule(rotation, new Date(2026, 9, 11), '2026-10-05');
    expect(week.monday).toBe(rotation.schedule[1]);
    expect(week.sunday).toBe(rotation.schedule[3]);
  });

  it('is empty for every day without a start date', () => {
    const week = getWeekSchedule(rotation, new Date(2026, 9, 7));
    expect(Object.values(week).every(d => d === null)).toBe(true);
  });
});

describe('getWorkoutsPerWeek', () => {
  it('counts days with exercises for weekly splits', () => {
    expect(getWorkoutsPerWeek(weekly)).toBe(3);
  });

  it('scales a rotation to a seven day week', () => {
    expect(getWorkoutsPerWeek(rotation)).toBe(5);
    expect(getWorkoutsPerWeek({ type: 'rotation', schedule: { 1: w('A'), 2: rest, 3: w('B'), 4: rest, 5: w('C'), 6: rest, 7: rest } })).toBe(3);
  });

  it('is zero for an empty split', () => {
    expect(getWorkoutsPerWeek({ type: 'rotation', schedule: {} })).toBe(0);
    expect(getWorkoutsPerWeek(null)).toBe(0);
  });
});

describe('isRotationSplit', () => {
  it('detects the type at either level', () => {
    expect(isRotationSplit(rotation)).toBe(true);
    expect(isRotationSplit({ data: rotation })).toBe(true);
    expect(isRotationSplit(weekly)).toBe(false);
    expect(isRotationSplit(undefined)).toBe(false);
  });
});

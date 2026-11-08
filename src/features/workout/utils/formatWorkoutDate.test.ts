import { formatWorkoutDate } from './formatWorkoutDate';

describe('formatWorkoutDate', () => {
    it('formats timestamps using local weekday and full date', () => {
        const date = new Date(2026, 10, 8, 12);

        expect(formatWorkoutDate(date)).toBe('Sun, Nov 8, 2026');
        expect(formatWorkoutDate({ seconds: date.getTime() / 1000 })).toBe('Sun, Nov 8, 2026');
        expect(formatWorkoutDate({ _seconds: date.getTime() / 1000 })).toBe('Sun, Nov 8, 2026');
        expect(formatWorkoutDate({ toDate: () => date })).toBe('Sun, Nov 8, 2026');
    });

    it('uses the supplied fallback for missing or invalid values', () => {
        expect(formatWorkoutDate(undefined)).toBe('Recent');
        expect(formatWorkoutDate(undefined, 'N/A')).toBe('N/A');
        expect(formatWorkoutDate('invalid')).toBe('Recent');
    });

    it('parses date-only strings as local dates', () => {
        expect(formatWorkoutDate('2026-11-08')).toBe('Sun, Nov 8, 2026');
        expect(formatWorkoutDate('2026-02-31')).toBe('Recent');
    });
});

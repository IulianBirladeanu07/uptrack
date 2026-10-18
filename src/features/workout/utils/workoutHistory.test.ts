import { countWorkoutEntriesThisWeek, isWorkoutTimestampWithinClockSkew } from './workoutHistory';

describe('countWorkoutEntriesThisWeek', () => {
    test('counts completed workouts from Monday through now in the local week', () => {
        const now = new Date(2026, 9, 14, 15, 0);
        const at = (day: number, hour = 12) => ({
            timestamp: { toDate: () => new Date(2026, 9, day, hour) },
        });

        expect(countWorkoutEntriesThisWeek([
            at(12),
            at(13),
            at(14),
            at(14, 16),
            at(18),
            at(11),
            at(19),
        ], now)).toBe(3);
    });

    test('counts the current week on Sunday and excludes the following Monday', () => {
        const now = new Date(2026, 9, 18, 15, 0);
        const at = (day: number) => ({
            timestamp: { toDate: () => new Date(2026, 9, day, 12) },
        });

        expect(countWorkoutEntriesThisWeek([
            at(18),
            at(19),
            at(25),
        ], now)).toBe(1);
    });

    test('does not count a next-week timestamp within clock-skew tolerance', () => {
        const now = new Date(2026, 9, 18, 23, 59);
        expect(countWorkoutEntriesThisWeek([
            { timestamp: { toDate: () => new Date(2026, 9, 19, 0, 2) } },
        ], now)).toBe(0);
    });

    test('ignores missing and invalid timestamps', () => {
        expect(countWorkoutEntriesThisWeek([
            {},
            { timestamp: { toDate: () => new Date(Number.NaN) } },
        ], new Date(2026, 9, 14))).toBe(0);
    });

    test('allows a small server timestamp offset when the device clock lags', () => {
        const now = new Date(2026, 9, 14, 15, 0);
        expect(isWorkoutTimestampWithinClockSkew(new Date(now.getTime() + 4 * 60_000), now)).toBe(true);
        expect(isWorkoutTimestampWithinClockSkew(new Date(now.getTime() + 6 * 60_000), now)).toBe(false);
    });
});

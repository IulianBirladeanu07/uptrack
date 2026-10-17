import { countWorkoutEntriesThisWeek } from './workoutHistory';

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

    test('ignores missing and invalid timestamps', () => {
        expect(countWorkoutEntriesThisWeek([
            {},
            { timestamp: { toDate: () => new Date(Number.NaN) } },
        ], new Date(2026, 9, 14))).toBe(0);
    });
});

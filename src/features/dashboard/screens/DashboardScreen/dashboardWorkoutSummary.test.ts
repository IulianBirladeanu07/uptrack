import {
    countWeeklyWorkouts,
    getCompletedToday,
    type DashboardWorkoutHistoryEntry,
} from './dashboardWorkoutSummary';

const at = (value: string): DashboardWorkoutHistoryEntry => ({
    timestamp: { toDate: () => new Date(value) },
});

describe('countWeeklyWorkouts', () => {
    const now = new Date(2026, 4, 13, 10, 15);

    it('counts records from Monday onward using the local week boundary', () => {
        const history = [
            at('2026-05-10T20:00:00'),
            at('2026-05-11T00:00:00'),
            at('2026-05-13T08:00:00'),
            at('2026-05-17T23:59:00'),
        ];

        expect(countWeeklyWorkouts(history, now)).toBe(2);
    });

    it('counts small server-clock offsets but ignores substantially future timestamps', () => {
        expect(countWeeklyWorkouts([at('2026-05-13T10:18:00')], now)).toBe(1);
        expect(countWeeklyWorkouts([at('2026-05-13T10:21:00')], now)).toBe(0);
    });

    it('returns zero for an empty or missing history', () => {
        expect(countWeeklyWorkouts([], now)).toBe(0);
        expect(countWeeklyWorkouts(undefined, now)).toBe(0);
    });
});

describe('getCompletedToday', () => {
    const now = new Date(2026, 4, 13, 10, 15);

    it('uses the latest workout today and returns its duration and exercise count', () => {
        const early = {
            ...at('2026-05-13T08:00:00'),
            duration: '45:00',
            exercises: [{}],
        };
        const late = {
            ...at('2026-05-13T09:30:00'),
            duration: '30:00',
            exercises: [{}, {}],
        };
        const futureToday = {
            ...at('2026-05-13T11:00:00'),
            duration: '90:00',
            exercises: [{}, {}, {}],
        };

        expect(getCompletedToday([
            late,
            futureToday,
            at('2026-05-12T23:59:00'),
            early,
        ], now)).toEqual({
            durationLabel: '30 mins',
            exerciseCount: 2,
        });
    });

    it('returns null when no workout was completed today or history is missing', () => {
        expect(getCompletedToday([at('2026-05-12T23:59:00')], now)).toBeNull();
        expect(getCompletedToday([at('2026-05-13T10:21:00')], now)).toBeNull();
        expect(getCompletedToday([], now)).toBeNull();
        expect(getCompletedToday(undefined, now)).toBeNull();
    });

    it('preserves null duration and zero exercises when the latest entry has no details', () => {
        expect(getCompletedToday([
            { ...at('2026-05-13T09:30:00') },
        ], now)).toEqual({
            durationLabel: null,
            exerciseCount: 0,
        });
    });
});

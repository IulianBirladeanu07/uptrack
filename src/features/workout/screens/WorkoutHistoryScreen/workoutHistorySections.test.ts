import {
    getWorkoutMonthYear,
    groupWorkoutHistoryByMonth,
} from './workoutHistorySections';

describe('Workout history sections', () => {
    it('formats month headings from timestamp seconds', () => {
        const date = new Date(2025, 0, 15, 12);

        expect(getWorkoutMonthYear({ seconds: date.getTime() / 1000 })).toBe('January 2025');
    });

    it('uses the Recent heading when the timestamp is missing or zero', () => {
        expect(getWorkoutMonthYear(undefined)).toBe('Recent');
        expect(getWorkoutMonthYear(null)).toBe('Recent');
        expect(getWorkoutMonthYear({ seconds: 0 })).toBe('Recent');
    });

    it('groups workouts by month while preserving first-seen section and row order', () => {
        const januaryFirst = { id: 'jan-first', timestamp: { seconds: new Date(2025, 0, 2).getTime() / 1000 } };
        const february = { id: 'feb', timestamp: { seconds: new Date(2025, 1, 2).getTime() / 1000 } };
        const januarySecond = { id: 'jan-second', timestamp: { seconds: new Date(2025, 0, 20).getTime() / 1000 } };
        const recent: { id: string; timestamp?: { seconds: number } } = { id: 'recent' };
        const workouts = [januaryFirst, february, januarySecond, recent];

        expect(groupWorkoutHistoryByMonth(workouts, workout => workout.timestamp)).toEqual([
            { title: 'January 2025', data: [januaryFirst, januarySecond] },
            { title: 'February 2025', data: [february] },
            { title: 'Recent', data: [recent] },
        ]);
    });
});

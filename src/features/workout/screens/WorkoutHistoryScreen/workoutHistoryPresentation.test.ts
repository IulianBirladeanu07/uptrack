import {
    formatWorkoutHistoryDate,
    getWorkoutHistoryLabel,
} from './workoutHistoryPresentation';

const toTimestamp = (date: Date) => ({ seconds: date.getTime() / 1000 });

describe('Workout history presentation', () => {
    it('formats relative dates and short local dates', () => {
        expect(formatWorkoutHistoryDate(undefined)).toBe('Recent');
        const now = new Date(2025, 5, 15, 12);
        expect(formatWorkoutHistoryDate(toTimestamp(now), now)).toBe('Today');
        expect(formatWorkoutHistoryDate(toTimestamp(new Date(2025, 5, 14, 12)), now)).toBe('Yesterday');
        expect(formatWorkoutHistoryDate(toTimestamp(new Date(2025, 5, 13, 12)), now)).toBe('Jun 13');
    });

    it('labels workouts by local hour and prefers a non-default template name', () => {
        const labelAt = (hour: number) => getWorkoutHistoryLabel(
            toTimestamp(new Date(2025, 0, 1, hour)),
            'Workout',
        );

        expect(labelAt(4)).toBe('Night Workout');
        expect(labelAt(5)).toBe('Morning Workout');
        expect(labelAt(11)).toBe('Morning Workout');
        expect(labelAt(12)).toBe('Afternoon Workout');
        expect(labelAt(16)).toBe('Afternoon Workout');
        expect(labelAt(17)).toBe('Evening Workout');
        expect(labelAt(20)).toBe('Evening Workout');
        expect(labelAt(21)).toBe('Night Workout');
        expect(getWorkoutHistoryLabel(undefined)).toBe('Recent Workout');
        expect(getWorkoutHistoryLabel(undefined, 'Upper A')).toBe('Upper A');
    });
});

import { getWorkoutHistorySummary, summarizeWorkoutEntry } from './workoutHistorySummary';

const workout = (
    date: string,
    fields: Record<string, unknown> = {},
) => ({
    timestamp: { toDate: () => new Date(date) },
    ...fields,
});

describe('summarizeWorkoutEntry', () => {
    it('summarizes exercises, set counts, and the best set', () => {
        expect(summarizeWorkoutEntry({
            workoutName: 'Upper A',
            duration: '35:00',
            exercises: [
                {
                    exerciseName: 'Bench Press',
                    sets: [
                        { weight: '60', reps: '8', id: '1', isValidated: true, repsModified: false },
                        { weight: '70', reps: '5', id: '2', isValidated: true, repsModified: false },
                    ],
                },
                { name: 'Row', sets: [] },
            ],
        })).toEqual({
            name: 'Upper A',
            duration: '35:00',
            totalSets: 2,
            exerciseCount: 2,
            exercises: [
                { name: 'Bench Press', sets: 2, bestSet: '70kg × 5' },
                { name: 'Row', sets: 0, bestSet: null },
            ],
        });
    });

    it('uses template or time-of-day fallback names and a default duration', () => {
        expect(summarizeWorkoutEntry({
            templateName: 'Leg Day',
            timestamp: { toDate: () => new Date(2026, 9, 17, 6) },
        })).toMatchObject({ name: 'Leg Day', duration: '0:00' });
        expect(summarizeWorkoutEntry({
            timestamp: { toDate: () => new Date(2026, 9, 17, 20) },
        }).name).toBe('Evening Workout');
        expect(summarizeWorkoutEntry({}).name).toBe('Workout');
    });
});

describe('getWorkoutHistorySummary', () => {
    const now = new Date(2026, 9, 17, 12);

    it('returns unique completed weekdays, latest workout, and today’s latest workout without mutating input', () => {
        const history = [
            workout('2026-10-12T09:00:00', { workoutName: 'Monday' }),
            workout('2026-10-17T08:00:00', { workoutName: 'Today Earlier' }),
            workout('2026-10-17T10:00:00', { workoutName: 'Today Latest' }),
            workout('2026-10-11T10:00:00', { workoutName: 'Previous Sunday' }),
        ];
        const originalOrder = [...history];

        expect(getWorkoutHistorySummary(history, now)).toEqual({
            completedDaysThisWeek: [6, 1],
            lastWorkoutStats: expect.objectContaining({ name: 'Today Latest' }),
            todayCompletedStats: expect.objectContaining({ name: 'Today Latest' }),
        });
        expect(history).toEqual(originalOrder);
    });

    it('returns empty history stats when no workouts exist', () => {
        expect(getWorkoutHistorySummary([], now)).toEqual({
            completedDaysThisWeek: [],
            lastWorkoutStats: null,
            todayCompletedStats: null,
        });
    });

    it('uses Monday as the week boundary when today is Sunday', () => {
        const sunday = new Date(2026, 9, 18, 12);
        const history = [
            workout('2026-10-12T09:00:00', { workoutName: 'Monday' }),
            workout('2026-10-11T09:00:00', { workoutName: 'Prior Sunday' }),
        ];
        expect(getWorkoutHistorySummary(history, sunday).completedDaysThisWeek).toEqual([1]);
    });
});

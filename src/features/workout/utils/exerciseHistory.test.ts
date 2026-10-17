import {
    getExerciseHistorySets,
    getPreviousWorkoutExerciseSets,
    toExerciseHistorySession,
} from './exerciseHistory';

describe('getExerciseHistorySets', () => {
    test('combines sets for same-named exercises in a workout', () => {
        const chestSet = { weight: 80, reps: 8 };
        const shoulderSet = { weight: 40, reps: 12 };

        expect(getExerciseHistorySets([
            { exerciseName: 'Press', sets: [chestSet] },
            { exerciseName: 'Row', sets: [{ weight: 60, reps: 10 }] },
            { exerciseName: 'Press', sets: [shoulderSet] },
        ], 'Press')).toEqual([chestSet, shoulderSet]);
    });

    describe('toExerciseHistorySession', () => {
        it('filters invalid sets and computes the best set and total volume', () => {
            const timestamp = { seconds: 123 };

            expect(toExerciseHistorySession('workout-1', {
                timestamp,
                workoutName: 'Upper A',
                exercises: [{
                    exerciseName: 'Bench Press',
                    muscleGroup: 'Chest',
                    sets: [
                        { weight: '80', reps: '8' },
                        { weight: '90', reps: '5', isPR: true },
                        { weight: '-1', reps: '8' },
                        { weight: '60', reps: '0' },
                        { weight: 'invalid', reps: '8' },
                    ],
                }],
            }, 'Bench Press', 'Chest')).toEqual({
                id: 'workout-1',
                timestamp,
                workoutName: 'Upper A',
                sets: [
                    { weight: '80', reps: '8' },
                    { weight: '90', reps: '5', isPR: true },
                ],
                best: expect.objectContaining({
                    weight: 90,
                    reps: 5,
                    estimated1RM: expect.any(Number),
                    e1rm: expect.any(Number),
                }),
                totalVolume: 1090,
            });
        });

        it('returns null when no matching valid sets exist and defaults the workout name', () => {
            expect(toExerciseHistorySession('workout-2', {
                exercises: [{ exerciseName: 'Bench Press', sets: [{ weight: 50, reps: 0 }] }],
            }, 'Bench Press')).toBeNull();

            expect(toExerciseHistorySession('workout-3', {
                exercises: [{ exerciseName: 'Bench Press', sets: [{ weight: 50, reps: 5 }] }],
            }, 'Bench Press')).toMatchObject({ workoutName: 'Workout' });
        });
    });

    describe('getPreviousWorkoutExerciseSets', () => {
        test('prefers matching muscle groups over older entries without group metadata', () => {
            const legacySet = { weight: 120, reps: 5 };
            const chestSet = { weight: 90, reps: 8 };
            const duplicateChestSet = { weight: 85, reps: 10 };

            expect(getPreviousWorkoutExerciseSets([
                { exerciseName: 'Press', sets: [legacySet] },
                { exerciseName: 'Press', muscleGroup: 'Shoulders', sets: [{ weight: 40, reps: 12 }] },
                { exerciseName: 'Press', muscleGroup: 'Chest', sets: [chestSet] },
                { exerciseName: 'Press', muscleGroup: 'Chest', sets: [duplicateChestSet] },
            ], 'Press', 'Chest')).toEqual([chestSet, duplicateChestSet]);
        });

        test('falls back to legacy history when there is no exact group match', () => {
            const legacySet = { weight: 70, reps: 10 };

            expect(getPreviousWorkoutExerciseSets([
                { exerciseName: 'Press', sets: [legacySet] },
                { exerciseName: 'Press', muscleGroup: 'Shoulders', sets: [{ weight: 40, reps: 12 }] },
            ], 'Press', 'Chest')).toEqual([legacySet]);
        });
    });

    test('returns an empty list when the exercise is absent', () => {
        expect(getExerciseHistorySets([{ exerciseName: 'Row', sets: [] }], 'Press')).toEqual([]);
    });

    test('keeps same-named exercises from other muscle groups out of history', () => {
        const chestSet = { weight: 80, reps: 8 };
        const shoulderSet = { weight: 40, reps: 12 };

        expect(getExerciseHistorySets([
            { exerciseName: 'Press', muscleGroup: 'Chest', sets: [chestSet] },
            { exerciseName: 'Press', muscleGroup: 'Shoulders', sets: [shoulderSet] },
        ], 'Press', 'Chest')).toEqual([chestSet]);
    });

    test('includes legacy entries without muscle-group metadata', () => {
        const legacySet = { weight: 70, reps: 10 };

        expect(getExerciseHistorySets([
            { exerciseName: 'Press', sets: [legacySet] },
            { exerciseName: 'Press', muscleGroup: 'Shoulders', sets: [{ weight: 40, reps: 12 }] },
        ], 'Press', 'Chest')).toEqual([legacySet]);
    });
});

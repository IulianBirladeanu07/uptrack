import { getExerciseHistorySets, getPreviousWorkoutExerciseSets } from './exerciseHistory';

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

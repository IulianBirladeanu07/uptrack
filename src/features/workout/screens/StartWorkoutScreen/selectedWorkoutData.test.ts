import { toSelectedExercises, toSelectedWorkout, toWorkoutExercise } from './selectedWorkoutData';

describe('toWorkoutExercise', () => {
    it('normalizes names, optional metadata, and workout sets', () => {
        expect(toWorkoutExercise({
            name: 'Bench Press',
            muscleGroup: 'Chest',
            numSets: 3,
            sets: [
                { id: 'set-1', weight: 60, reps: 8, extra: true },
                { weight: '65', reps: 6 },
                null,
            ],
        })).toEqual({
            exerciseName: 'Bench Press',
            name: 'Bench Press',
            muscleGroup: 'Chest',
            numSets: 3,
            sets: [
                { id: 'set-1', weight: '60', reps: '8', isValidated: false, repsModified: false },
                { id: 'template-set-1', weight: '65', reps: '6', isValidated: false, repsModified: false },
            ],
        });
    });

    it('rejects invalid exercises and uses exerciseName as the preferred name', () => {
        expect(toWorkoutExercise({ name: 'Fallback', exerciseName: 'Preferred' })).toEqual({
            exerciseName: 'Preferred',
            name: 'Fallback',
            sets: [],
        });
        expect(toWorkoutExercise({ sets: [] })).toBeNull();
        expect(toWorkoutExercise(null)).toBeNull();
    });
});

describe('toSelectedWorkout', () => {
    it('normalizes valid exercises and optional workout metadata', () => {
        expect(toSelectedWorkout({
            note: 'Keep form strict',
            templateName: 'Upper A',
            exercises: [{ exerciseName: 'Row' }, {}, null],
        })).toEqual({
            note: 'Keep form strict',
            templateName: 'Upper A',
            exercises: [{ exerciseName: 'Row', sets: [] }],
        });
    });

    it('rejects values without an exercises array', () => {
        expect(toSelectedWorkout({ exercises: 'invalid' })).toBeNull();
        expect(toSelectedWorkout(undefined)).toBeNull();
    });
});

describe('toSelectedExercises', () => {
    it('filters malformed values and retains supported catalog metadata', () => {
        expect(toSelectedExercises([
            { name: 'Squat', muscleGroup: 'Legs', category: 'Strength', imageURL: 'squat.png', repRange: '5-8' },
            { exerciseName: 'Deadlift', note: 'not retained' },
            { name: '' },
            null,
        ])).toEqual([
            { exerciseName: 'Squat', name: 'Squat', muscleGroup: 'Legs', category: 'Strength', imageURL: 'squat.png', repRange: '5-8' },
            { exerciseName: 'Deadlift' },
        ]);
        expect(toSelectedExercises({})).toEqual([]);
    });
});

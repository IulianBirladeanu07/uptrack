import { exerciseIdentityKey, isSameExercise } from './exerciseIdentity';

describe('exerciseIdentityKey', () => {
    test('uses only the exercise name and muscle group, not its list position', () => {
        expect(exerciseIdentityKey('Press', 'Chest')).toBe('["Chest","Press"]');
    });

    test('keeps same-named exercises in different groups distinct', () => {
        expect(exerciseIdentityKey('Press', 'Chest')).not.toBe(exerciseIdentityKey('Press', 'Shoulders'));
    });
});

describe('isSameExercise', () => {
    test('matches exercises with the same name and muscle group', () => {
        expect(isSameExercise(
            { exerciseName: 'Press', muscleGroup: 'Chest' },
            { name: 'Press', muscleGroup: 'Chest' },
        )).toBe(true);
    });

    test('keeps same-named exercises distinct when both groups are known and different', () => {
        expect(isSameExercise(
            { exerciseName: 'Press', muscleGroup: 'Chest' },
            { exerciseName: 'Press', muscleGroup: 'Shoulders' },
        )).toBe(false);
    });

    test('treats a missing muscle group as ambiguous and prevents duplicates', () => {
        expect(isSameExercise(
            { exerciseName: 'Press' },
            { exerciseName: 'Press', muscleGroup: 'Chest' },
        )).toBe(true);
    });

    test('does not match different names', () => {
        expect(isSameExercise(
            { exerciseName: 'Press', muscleGroup: 'Chest' },
            { exerciseName: 'Row', muscleGroup: 'Chest' },
        )).toBe(false);
    });
});

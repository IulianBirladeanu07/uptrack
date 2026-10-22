import { buildExerciseRowKeys, exerciseIdentityKey, isSameExercise } from './exerciseIdentity';

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

describe('buildExerciseRowKeys', () => {
    const press = { exerciseName: 'Press', muscleGroup: 'Chest' };
    const curl = { exerciseName: 'Curl', muscleGroup: 'Biceps' };
    const row = { exerciseName: 'Row', muscleGroup: 'Back' };

    test('keeps an exercise key when the exercises around it are moved or removed', () => {
        const before = buildExerciseRowKeys([press, curl, row]);
        const moved = buildExerciseRowKeys([curl, press, row]);
        const removed = buildExerciseRowKeys([curl, row]);

        expect(moved[1]).toBe(before[0]);
        expect(moved[2]).toBe(before[2]);
        expect(removed[0]).toBe(before[1]);
        expect(removed[1]).toBe(before[2]);
    });

    test('gives repeated exercises distinct keys instead of colliding', () => {
        const keys = buildExerciseRowKeys([press, curl, press]);

        expect(new Set(keys).size).toBe(3);
        expect(keys[0]).toBe(exerciseIdentityKey('Press', 'Chest'));
    });
});

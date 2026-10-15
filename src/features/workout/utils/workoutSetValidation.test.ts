import { isValidWorkoutSetInput } from './workoutSetValidation';

describe('isValidWorkoutSetInput', () => {
    test.each([
        ['50', '8', true],
        ['50.25', '8', true],
        ['0', '1', true],
        ['500', '100', true],
        ['500.01', '8', false],
        ['50.123', '8', false],
        ['50', '8.5', false],
        ['50', '101', false],
        ['50', '0', false],
        ['.', '8', false],
        ['50', '', false],
        ['', '8', false],
        [-1, '8', false],
        ['50', -1, false],
    ])('validates weight %p and reps %p as %p', (weight, reps, expected) => {
        expect(isValidWorkoutSetInput(weight, reps)).toBe(expected);
    });
});

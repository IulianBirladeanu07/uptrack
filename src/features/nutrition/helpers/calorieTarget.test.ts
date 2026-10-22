import { learningProgressLabel, resolveCalorieTarget } from './calorieTarget';

describe('resolveCalorieTarget', () => {
    test('returns the rounded target when targets exist', () => {
        expect(resolveCalorieTarget(true, 2487.6)).toBe(2488);
    });

    test('returns null while the plan is still learning', () => {
        expect(resolveCalorieTarget(false, 0)).toBeNull();
        expect(resolveCalorieTarget(false, 2200)).toBeNull();
    });

    test('returns null for a missing or non-positive target', () => {
        expect(resolveCalorieTarget(true, 0)).toBeNull();
        expect(resolveCalorieTarget(true, undefined)).toBeNull();
        expect(resolveCalorieTarget(true, null)).toBeNull();
    });
});

describe('learningProgressLabel', () => {
    test('shows how many days are logged', () => {
        expect(learningProgressLabel(0, 7)).toBe('Learning · 0 of 7 days logged');
        expect(learningProgressLabel(3, 7)).toBe('Learning · 3 of 7 days logged');
    });

    test('clamps to the required range and announces target setup when complete', () => {
        expect(learningProgressLabel(-2, 7)).toBe('Learning · 0 of 7 days logged');
        expect(learningProgressLabel(7, 7)).toBe('Setting your targets');
        expect(learningProgressLabel(9, 7)).toBe('Setting your targets');
    });
});

import { getWorkoutStorySize } from './workoutStoryLayout';

describe('getWorkoutStorySize', () => {
    it('returns a 9:16 canvas that fits the available screen width and height', () => {
        const size = getWorkoutStorySize(393, 852, 40, 24);

        expect(size.height / size.width).toBeCloseTo(16 / 9);
        expect(size.width).toBeLessThanOrEqual(393 - 32);
        expect(size.height).toBeLessThanOrEqual(852 - 40 - 24 - 196);
    });

    it('uses the screen width limit on narrow screens', () => {
        const size = getWorkoutStorySize(320, 900, 24, 24);

        expect(size.width).toBe(320 - 32);
        expect(size.height / size.width).toBeCloseTo(16 / 9);
    });
});

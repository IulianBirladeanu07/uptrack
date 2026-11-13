import { getWorkoutPhotoFrame, getWorkoutStorySize } from './workoutStoryLayout';

describe('getWorkoutStorySize', () => {
    it('uses the full measured screen area for an edge-to-edge story canvas', () => {
        expect(getWorkoutStorySize(393, 850)).toEqual({ width: 393, height: 850 });
    });

    it('guards against zero-size layouts before measurement', () => {
        expect(getWorkoutStorySize(0, 0)).toEqual({ width: 1, height: 1 });
    });

    it('contains portrait, landscape, and square photos without changing their aspect ratios', () => {
        expect(getWorkoutPhotoFrame(1080, 1920, 360, 640)).toEqual({ width: 360, height: 640 });
        const landscapeFrame = getWorkoutPhotoFrame(1920, 1080, 360, 640);
        expect(landscapeFrame.width).toBe(360);
        expect(landscapeFrame.height).toBe(202.5);
        expect(getWorkoutPhotoFrame(1000, 1000, 360, 640)).toEqual({ width: 360, height: 360 });
    });
});

import {
    clampWorkoutStoryScale,
    clampWorkoutStoryTranslation,
    clampWorkoutPhotoScale,
    clampWorkoutPhotoTranslation,
    getWorkoutStoryFitScale,
    getWorkoutStoryCenterAlignment,
    getNextWorkoutStoryStyleMode,
    isWorkoutStoryCardAtPoint,
    MAX_WORKOUT_STORY_SCALE,
    MIN_WORKOUT_PHOTO_SCALE,
    MIN_WORKOUT_STORY_SCALE,
} from './workoutStoryTransform';

describe('workout story transforms', () => {
    it('cycles through clear, glass, and solid overlay styles', () => {
        expect(getNextWorkoutStoryStyleMode('clear')).toBe('glass');
        expect(getNextWorkoutStoryStyleMode('glass')).toBe('solid');
        expect(getNextWorkoutStoryStyleMode('solid')).toBe('clear');
    });

    it('keeps the recap within a readable scale range', () => {
        expect(clampWorkoutStoryScale(0.1)).toBe(MIN_WORKOUT_STORY_SCALE);
        expect(clampWorkoutStoryScale(1)).toBe(1);
        expect(clampWorkoutStoryScale(2)).toBe(MAX_WORKOUT_STORY_SCALE);
    });

    it('allows the photo to shrink and enlarge over the full-screen background', () => {
        expect(clampWorkoutPhotoScale(0.1)).toBe(MIN_WORKOUT_PHOTO_SCALE);
        expect(clampWorkoutPhotoScale(0.5)).toBe(0.5);
        expect(clampWorkoutPhotoScale(2)).toBe(2);
        expect(clampWorkoutPhotoScale(8)).toBe(4);
        expect(clampWorkoutPhotoTranslation(1000, 600, 400, 2)).toBe(700);
        expect(clampWorkoutPhotoTranslation(-1000, 600, 400, 2)).toBe(-700);
    });

    it('fits all exercise rows in the story while keeping ordinary workouts full size', () => {
        expect(getWorkoutStoryFitScale(9, 600, true)).toBe(1);
        expect(getWorkoutStoryFitScale(20, 600, true)).toBeLessThan(1);
        expect(getWorkoutStoryFitScale(50, 600, true)).toBeGreaterThanOrEqual(MIN_WORKOUT_STORY_SCALE);
    });

    it('lets the recap move across the full canvas', () => {
        expect(clampWorkoutStoryTranslation(300, 400)).toBe(200);
        expect(clampWorkoutStoryTranslation(-300, 400)).toBe(-200);
        expect(clampWorkoutStoryTranslation(80, 400)).toBe(80);
    });

    it('snaps the dragged layer to center axes within a small threshold', () => {
        expect(getWorkoutStoryCenterAlignment(59, 150, 400)).toEqual({
            translation: 50,
            isAligned: true,
        });
        expect(getWorkoutStoryCenterAlignment(70, 150, 400)).toEqual({
            translation: 70,
            isAligned: false,
        });
    });

    it('targets the recap when a gesture starts over its current position', () => {
        expect(isWorkoutStoryCardAtPoint(200, 300, 400, 800, 360, 200, 0, 0, 1)).toBe(true);
        expect(isWorkoutStoryCardAtPoint(200, 50, 400, 800, 360, 200, 0, 0, 1)).toBe(false);
        expect(isWorkoutStoryCardAtPoint(300, 300, 400, 800, 360, 200, 100, 0, 1)).toBe(true);
        expect(isWorkoutStoryCardAtPoint(250, 370, 400, 800, 360, 200, 50, -30, 0.5)).toBe(true);
        expect(isWorkoutStoryCardAtPoint(100, 370, 400, 800, 360, 200, 50, -30, 0.5)).toBe(false);
    });
});

export const MIN_WORKOUT_STORY_SCALE = 0.2;
export const MAX_WORKOUT_STORY_SCALE = 1.15;
export const MAX_WORKOUT_PHOTO_SCALE = 4;
export const MIN_WORKOUT_PHOTO_SCALE = 0.35;

export const clampWorkoutPhotoScale = (scale: number): number => {
    'worklet';
    return Math.max(MIN_WORKOUT_PHOTO_SCALE, Math.min(MAX_WORKOUT_PHOTO_SCALE, scale));
};

export const clampWorkoutPhotoTranslation = (
    translation: number,
    imageDimension: number,
    canvasDimension: number,
    scale: number,
): number => {
    'worklet';
    const scaledImageDimension = imageDimension * scale;
    const minVisible = Math.min(scaledImageDimension, canvasDimension) * 0.25;
    const limit = Math.max(0, (scaledImageDimension + canvasDimension) / 2 - minVisible);
    return Math.max(-limit, Math.min(limit, translation));
};

export const getWorkoutStoryFitScale = (
    exerciseCount: number,
    canvasHeight: number,
    hasPhoto: boolean,
): number => {
    const estimatedContentHeight = (hasPhoto ? 190 : 270) + exerciseCount * 28;
    const fitScale = Math.min(1, (canvasHeight - 24) / estimatedContentHeight);
    return clampWorkoutStoryScale(fitScale);
};

export type WorkoutStoryStyleMode = 'clear' | 'glass' | 'solid';

const WORKOUT_STORY_STYLE_MODES: WorkoutStoryStyleMode[] = ['clear', 'glass', 'solid'];

export const getNextWorkoutStoryStyleMode = (
    mode: WorkoutStoryStyleMode,
): WorkoutStoryStyleMode => {
    const index = WORKOUT_STORY_STYLE_MODES.indexOf(mode);
    return WORKOUT_STORY_STYLE_MODES[(index + 1) % WORKOUT_STORY_STYLE_MODES.length];
};

export const clampWorkoutStoryScale = (scale: number): number => {
    'worklet';
    return Math.max(MIN_WORKOUT_STORY_SCALE, Math.min(MAX_WORKOUT_STORY_SCALE, scale));
};

export const clampWorkoutStoryTranslation = (
    translation: number,
    canvasDimension: number,
): number => {
    'worklet';
    const limit = canvasDimension / 2;
    return Math.max(-limit, Math.min(limit, translation));
};

export const getWorkoutStoryCenterAlignment = (
    translation: number,
    contentCenter: number,
    canvasDimension: number,
    threshold = 12,
): { translation: number; isAligned: boolean } => {
    'worklet';
    const centerTranslation = canvasDimension / 2 - contentCenter;
    const isAligned = Math.abs(translation - centerTranslation) <= threshold;
    return {
        translation: isAligned ? centerTranslation : translation,
        isAligned,
    };
};

export const isWorkoutStoryCardAtPoint = (
    pointX: number,
    pointY: number,
    canvasWidth: number,
    canvasHeight: number,
    contentWidth: number,
    contentHeight: number,
    translateX: number,
    translateY: number,
    scale: number,
): boolean => {
    'worklet';
    const centerX = canvasWidth / 2 + translateX;
    const contentTop = Math.max(0, (canvasHeight - contentHeight) / 2);
    const centerY = contentTop + contentHeight / 2 + translateY;

    return Math.abs(pointX - centerX) <= contentWidth * scale / 2
        && Math.abs(pointY - centerY) <= contentHeight * scale / 2;
};

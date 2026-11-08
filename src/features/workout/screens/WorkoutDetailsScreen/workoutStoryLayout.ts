import { spacing } from '../../../../shared/theme';

const STORY_ASPECT_RATIO = 9 / 16;
const RESERVED_SCREEN_HEIGHT = spacing[45] + spacing[4];

export const getWorkoutStorySize = (
    windowWidth: number,
    windowHeight: number,
    topInset: number,
    bottomInset: number,
) => {
    const availableHeight = Math.max(
        0,
        windowHeight - topInset - bottomInset - RESERVED_SCREEN_HEIGHT,
    );
    const width = Math.max(1, Math.min(windowWidth - spacing[8], availableHeight * STORY_ASPECT_RATIO));

    return { width, height: width / STORY_ASPECT_RATIO };
};

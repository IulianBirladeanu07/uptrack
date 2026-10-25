import { spacing } from '../../../../shared/theme';

const SCREEN_HORIZONTAL_PADDING = spacing[4] * 2;
const CARD_HORIZONTAL_PADDING = spacing[4] * 2;
const CARD_BORDER_WIDTH = 1;

export const getProgressChartWidth = (screenWidth: number): number =>
    Math.max(0, screenWidth - SCREEN_HORIZONTAL_PADDING - CARD_HORIZONTAL_PADDING - CARD_BORDER_WIDTH * 2);

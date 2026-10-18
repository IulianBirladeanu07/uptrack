import * as Haptics from 'expo-haptics';

const runFeedback = async (feedback: () => Promise<void>): Promise<void> => {
    try {
        await feedback();
    } catch (error) {
        console.error('Haptic feedback failed:', error);
    }
};

export const triggerImpactFeedback = (style: Haptics.ImpactFeedbackStyle): Promise<void> =>
    runFeedback(() => Haptics.impactAsync(style));

export const triggerSelectionFeedback = (): Promise<void> =>
    runFeedback(() => Haptics.selectionAsync());

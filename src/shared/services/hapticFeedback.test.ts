import * as Haptics from 'expo-haptics';
import { triggerImpactFeedback, triggerSelectionFeedback } from './hapticFeedback';

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light' },
}));

describe('haptic feedback helpers', () => {
    it('logs native feedback failures instead of leaving rejections unhandled', async () => {
        const error = new Error('native haptics unavailable');
        const impact = jest.mocked(Haptics.impactAsync);
        const selection = jest.mocked(Haptics.selectionAsync);
        const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        impact.mockRejectedValueOnce(error);
        selection.mockRejectedValueOnce(error);

        await triggerImpactFeedback(Haptics.ImpactFeedbackStyle.Light);
        await triggerSelectionFeedback();

        expect(logError).toHaveBeenCalledTimes(2);
        expect(logError).toHaveBeenCalledWith('Haptic feedback failed:', error);
        logError.mockRestore();
    });
});

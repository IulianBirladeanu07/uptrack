import { getProgressChartWidth } from './progressChartWidth';

describe('getProgressChartWidth', () => {
    it('subtracts the screen and card insets from the measured screen width', () => {
        expect(getProgressChartWidth(360)).toBe(294);
    });

    it('keeps chart width non-negative for an unmeasured or narrow screen', () => {
        expect(getProgressChartWidth(0)).toBe(0);
        expect(getProgressChartWidth(40)).toBe(0);
    });
});

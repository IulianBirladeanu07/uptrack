import {
    formatExerciseHistoryDate,
    getExerciseHistoryLabelAnchor,
} from './exerciseHistoryPresentation';

describe('exercise history presentation', () => {
    it('uses the shared full local date format', () => {
        expect(formatExerciseHistoryDate(undefined)).toEqual({ label: 'Recent' });
        expect(formatExerciseHistoryDate({ seconds: new Date(2025, 5, 15, 9).getTime() / 1000 }))
            .toEqual({ label: 'Sun, Jun 15, 2025' });
        expect(formatExerciseHistoryDate({ seconds: new Date(2024, 11, 31, 9).getTime() / 1000 }))
            .toEqual({ label: 'Tue, Dec 31, 2024' });
    });

    it('anchors first, last and interior chart labels appropriately', () => {
        expect(getExerciseHistoryLabelAnchor(0, 3)).toBe('start');
        expect(getExerciseHistoryLabelAnchor(1, 3)).toBe('middle');
        expect(getExerciseHistoryLabelAnchor(2, 3)).toBe('end');
        expect(getExerciseHistoryLabelAnchor(0, 1)).toBe('start');
    });
});

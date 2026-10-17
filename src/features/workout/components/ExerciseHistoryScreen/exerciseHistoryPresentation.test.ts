import {
    formatExerciseHistoryDate,
    getExerciseHistoryLabelAnchor,
} from './exerciseHistoryPresentation';

describe('exercise history presentation', () => {
    it('formats recent, today, yesterday and older dates using local calendar days', () => {
        const now = new Date(2025, 5, 15, 12);

        expect(formatExerciseHistoryDate(undefined, now)).toEqual({ label: 'Recent' });
        expect(formatExerciseHistoryDate({ seconds: new Date(2025, 5, 15, 9).getTime() / 1000 }, now))
            .toEqual({ label: 'Today' });
        expect(formatExerciseHistoryDate({ seconds: new Date(2025, 5, 14, 9).getTime() / 1000 }, now))
            .toEqual({ label: 'Yesterday' });
        expect(formatExerciseHistoryDate({ seconds: new Date(2024, 11, 31, 9).getTime() / 1000 }, now))
            .toEqual({ label: 'Dec 31, 2024' });
    });

    it('anchors first, last and interior chart labels appropriately', () => {
        expect(getExerciseHistoryLabelAnchor(0, 3)).toBe('start');
        expect(getExerciseHistoryLabelAnchor(1, 3)).toBe('middle');
        expect(getExerciseHistoryLabelAnchor(2, 3)).toBe('end');
        expect(getExerciseHistoryLabelAnchor(0, 1)).toBe('start');
    });
});

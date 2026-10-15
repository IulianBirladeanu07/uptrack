import { calculate1RM, findBestSet, formatBestSet, getPersonalRecordSetIndexes } from './workoutMetrics';

describe('workout metrics', () => {
    test('finds the best set by estimated one-rep max', () => {
        expect(findBestSet([
            { weight: '100', reps: '5' },
            { weight: '80', reps: '8' },
        ])).toEqual({
            weight: 100,
            reps: 5,
            estimated1RM: calculate1RM(100, 5),
        });
    });

    test('preserves repetitions for a zero-weight set', () => {
        expect(findBestSet([{ weight: '0', reps: '8' }, { weight: '0', reps: '12' }])).toEqual({
            weight: 0,
            reps: 12,
            estimated1RM: 0,
        });
    });

    test('returns an empty result when there are no sets', () => {
        expect(findBestSet([])).toEqual({ weight: 0, reps: 0, estimated1RM: 0 });
    });

    test('formats zero-weight sets as reps and loaded sets with weight', () => {
        expect(formatBestSet({ weight: 0, reps: 12 })).toBe('12 reps');
        expect(formatBestSet({ weight: '42.5', reps: '8' })).toBe('42.5kg × 8');
        expect(formatBestSet({ weight: 50, reps: 0 })).toBeNull();
    });

    test('identifies bodyweight rep records and ignores ties', () => {
        expect(getPersonalRecordSetIndexes(
            [{ weight: '0', reps: '12' }, { weight: '0', reps: '15' }],
            [{ weight: 0, reps: 12 }],
        )).toEqual([1]);
        expect(getPersonalRecordSetIndexes(
            [{ weight: '0', reps: '12' }],
            [{ weight: 0, reps: 12 }],
        )).toEqual([]);
    });

    test('identifies loaded records by estimated one-rep max', () => {
        expect(getPersonalRecordSetIndexes(
            [{ weight: '100', reps: '5' }, { weight: '80', reps: '8' }],
            [{ weight: '90', reps: '5' }],
        )).toEqual([0]);
    });

    test('does not treat switching from loaded to zero weight as a rep-based PR', () => {
        expect(getPersonalRecordSetIndexes(
            [{ weight: '0', reps: '20' }],
            [{ weight: '40', reps: '8' }],
        )).toEqual([]);
    });
});

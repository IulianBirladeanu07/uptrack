import type { WorkoutSplit } from '../../types';
import { selectActiveWorkoutSplit } from './activeWorkoutSplit';

describe('selectActiveWorkoutSplit', () => {
    it('selects the split matching the active id', () => {
        const splits: WorkoutSplit[] = [
            { id: 'first', type: 'weekly', schedule: { monday: {} } },
            { id: 'active', type: 'rotation', schedule: { '1': {} } },
        ];

        expect(selectActiveWorkoutSplit(splits, 'active')).toEqual({
            type: 'rotation',
            schedule: { '1': {} },
        });
    });

    it('falls back to the first split when the active id is missing or unmatched', () => {
        const splits: WorkoutSplit[] = [
            { id: 'first', type: 'weekly', schedule: { monday: {} } },
            { id: 'second', type: 'rotation', schedule: { '1': {} } },
        ];

        expect(selectActiveWorkoutSplit(splits, null)).toEqual({
            type: 'weekly',
            schedule: { monday: {} },
        });
        expect(selectActiveWorkoutSplit(splits, 'missing')).toEqual({
            type: 'weekly',
            schedule: { monday: {} },
        });
    });

    it('normalizes legacy data and prefers top-level split fields', () => {
        expect(selectActiveWorkoutSplit([{
            type: 'weekly',
            schedule: { monday: { templateName: 'Current' } },
            data: {
                type: 'rotation',
                schedule: { '1': { templateName: 'Legacy' } },
            },
        }])).toEqual({
            type: 'weekly',
            schedule: { monday: { templateName: 'Current' } },
        });

        expect(selectActiveWorkoutSplit([{
            data: {
                type: 'rotation',
                schedule: { '1': { templateName: 'Legacy' } },
            },
        }])).toEqual({
            type: 'rotation',
            schedule: { '1': { templateName: 'Legacy' } },
        });
    });

    it('returns null when there are no saved splits', () => {
        expect(selectActiveWorkoutSplit([])).toBeNull();
    });
});

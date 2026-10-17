import { getWorkoutCardSummary } from './workoutCardSummary';

describe('workout card summary', () => {
    it('counts all sets and personal-record sets across exercises', () => {
        expect(getWorkoutCardSummary([
            { sets: [{ isPR: true }, {}, { isPR: false }] },
            { sets: [{}, { isPR: true }] },
        ])).toEqual({ totalSets: 5, totalPRs: 2 });
    });

    it('returns zero counts for workouts without exercises or sets', () => {
        expect(getWorkoutCardSummary([])).toEqual({ totalSets: 0, totalPRs: 0 });
        expect(getWorkoutCardSummary([{ sets: [] }, { sets: [] }])).toEqual({
            totalSets: 0,
            totalPRs: 0,
        });
    });
});

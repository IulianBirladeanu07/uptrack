import { getWorkoutCardSummary, getWorkoutPRs } from './workoutCardSummary';

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

    it('names each exercise that set a record with its best record set', () => {
        expect(getWorkoutPRs([
            { exerciseName: 'Bench Press', sets: [{ weight: 90, reps: 5 }, { weight: 100, reps: 5, isPR: true }, { weight: 95, reps: 5, isPR: true }] },
            { exerciseName: 'Squat', sets: [{ weight: 120, reps: 5 }] },
            { exerciseName: 'Pull-up', sets: [{ weight: 0, reps: 12, isPR: true }] },
        ])).toEqual([
            { name: 'Bench Press', label: '100kg × 5' },
            { name: 'Pull-up', label: '12 reps' },
        ]);
    });

    it('returns no records when no set is flagged', () => {
        expect(getWorkoutPRs([{ exerciseName: 'Squat', sets: [{ weight: 120, reps: 5 }] }])).toEqual([]);
        expect(getWorkoutPRs([])).toEqual([]);
    });
});

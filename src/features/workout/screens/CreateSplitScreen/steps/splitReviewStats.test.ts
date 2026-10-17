import {
    getSplitDayMuscleGroups,
    getSplitDaySetCount,
    getSplitReviewStats,
} from './splitReviewStats';

describe('split review stats', () => {
    it('aggregates scheduled workout duration, sets and muscle group sets', () => {
        expect(getSplitReviewStats({
            monday: {
                templateId: 'upper',
                duration: '45',
                exercises: [
                    { numSets: 3, sets: 2, muscleGroup: 'Chest' },
                    { numSets: '2', muscleGroup: 'Back' },
                    { numSets: 'invalid', sets: '4', muscleGroup: 'Chest' },
                ],
            },
            tuesday: { templateId: 'rest-day', duration: 20, exercises: [{ numSets: 5 }] },
            wednesday: {
                templateName: 'Workout',
                duration: 'invalid',
                exercises: [{ sets: 3, muscleGroup: 'Back' }],
            },
        })).toEqual({
            workoutDays: 2,
            totalDuration: 45,
            totalSets: 12,
            muscleGroupSets: [
                { muscle: 'Chest', sets: 7 },
                { muscle: 'Back', sets: 5 },
            ],
        });
    });

    it('keeps the existing primary set-count fallback and empty-schedule defaults', () => {
        expect(getSplitReviewStats({})).toEqual({
            workoutDays: 0,
            totalDuration: 0,
            totalSets: 0,
            muscleGroupSets: [],
        });
        expect(getSplitDaySetCount({
            exercises: [
                { numSets: '3', sets: 6 },
                { numSets: 'invalid', sets: 4 },
                { sets: 2 },
            ],
        })).toBe(3);
    });

    it('returns unique preview muscle groups in first-seen order', () => {
        expect(getSplitDayMuscleGroups({
            exercises: [
                { muscleGroup: 'Chest' },
                { muscleGroup: 'Back' },
                { muscleGroup: 'Chest' },
                {},
            ],
        })).toEqual(['Chest', 'Back', undefined]);
        expect(getSplitDayMuscleGroups(null)).toEqual([]);
    });
});

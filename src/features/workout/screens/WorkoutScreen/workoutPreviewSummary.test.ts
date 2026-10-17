import {
    getWorkoutMuscleGroupLabel,
    getWorkoutPreviewStats,
} from './workoutPreviewSummary';

describe('workout preview summary', () => {
    it('preserves preview duration formatting and counts declared sets and exercises', () => {
        expect(getWorkoutPreviewStats({
            name: 'Upper A',
            duration: '45 min',
            exercises: [
                { exerciseName: 'Bench Press', numSets: 4 },
                { exerciseName: 'Row', numSets: '3' },
                { exerciseName: 'Fly', numSets: 'invalid' },
            ],
        })).toEqual({
            durationLabel: '45m',
            totalSets: 7,
            exerciseCount: 3,
        });
    });

    it('provides existing defaults when no workout is selected', () => {
        expect(getWorkoutPreviewStats(null)).toEqual({
            durationLabel: '0m',
            totalSets: 0,
            exerciseCount: 0,
        });
    });

    it('joins unique non-empty muscle groups in their first-seen order', () => {
        expect(getWorkoutMuscleGroupLabel([
            { muscleGroup: 'Chest' },
            { muscleGroup: 'Back' },
            { muscleGroup: 'Chest' },
            {},
        ])).toBe('Chest · Back');
        expect(getWorkoutMuscleGroupLabel([])).toBe('');
    });
});

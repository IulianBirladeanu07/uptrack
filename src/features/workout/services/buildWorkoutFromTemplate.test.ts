import type { WorkoutExercise, WorkoutSet } from '../types';
import { buildWorkoutFromTemplate } from './buildWorkoutFromTemplate';

const createSetId = (() => {
    let nextId = 0;
    return () => `new-set-${++nextId}`;
})();

const previousSets: WorkoutSet[] = [
    { id: 'previous-1', weight: '80', reps: '8', isValidated: true, repsModified: true },
    { id: 'previous-2', weight: '75', reps: '10', isValidated: false, repsModified: false },
];

describe('buildWorkoutFromTemplate', () => {
    it('builds rep-range defaults and prefers logged values from the previous workout', () => {
        const exercises: WorkoutExercise[] = [{
            exerciseName: 'Bench Press',
            muscleGroup: 'Chest',
            numSets: 3,
            repRange: '6-10',
            sets: [],
        }];

        const result = buildWorkoutFromTemplate(exercises, [previousSets], createSetId);

        expect(result[0]).toMatchObject({
            exerciseName: 'Bench Press',
            lastWorkoutSets: previousSets,
            repRange: '6-10',
            sets: [
                { weight: '80', reps: '8', isValidated: false, repsModified: false },
                { weight: '75', reps: '10', isValidated: false, repsModified: false },
                { weight: '', reps: '6', isValidated: false, repsModified: false },
            ],
        });
        expect(result[0].sets.map(set => set.id)).toEqual(['new-set-1', 'new-set-2', 'new-set-3']);
    });

    it('recreates explicit template sets with fresh ids and reset validation flags', () => {
        const exercises: WorkoutExercise[] = [{
            exerciseName: 'Squat',
            numSets: 1,
            repRange: '',
            sets: [
                { id: 'template-1', weight: '100', reps: '5', isValidated: true, repsModified: true },
                { id: 'template-2', weight: '', reps: '8', isValidated: true, repsModified: false },
            ],
        }];

        const result = buildWorkoutFromTemplate(exercises, [previousSets], createSetId);

        expect(result[0].sets).toEqual([
            { id: expect.any(String), weight: '100', reps: '5', isValidated: false, repsModified: false },
            { id: expect.any(String), weight: '', reps: '8', isValidated: false, repsModified: false },
        ]);
        expect(result[0].sets.map(set => set.id)).not.toContain('template-1');
        expect(result[0].lastWorkoutSets).toBe(previousSets);
        expect(result[0].repRange).toBe('');
    });

    it('uses one blank set for invalid or missing set counts and no rep range', () => {
        const exercises: WorkoutExercise[] = [
            { exerciseName: 'Row', numSets: 'invalid', sets: [] },
            { exerciseName: 'Curl', sets: [] },
        ];

        const result = buildWorkoutFromTemplate(exercises, [[], []], createSetId);

        expect(result.map(exercise => exercise.sets.map(({ weight, reps }) => ({ weight, reps })))).toEqual([
            [{ weight: '', reps: '' }],
            [{ weight: '', reps: '' }],
        ]);
    });

    it('does not mutate the source template exercises or their set definitions', () => {
        const sourceSet = {
            id: 'template-set',
            weight: '60',
            reps: '8',
            isValidated: true,
            repsModified: false,
        };
        const exercises: WorkoutExercise[] = [{
            exerciseName: 'Overhead Press',
            numSets: 1,
            sets: [sourceSet],
        }];

        const result = buildWorkoutFromTemplate(exercises, [[]], createSetId);

        expect(exercises[0].sets[0]).toBe(sourceSet);
        expect(exercises[0].sets[0].isValidated).toBe(true);
        expect(result[0].sets[0]).not.toBe(sourceSet);
        expect(result[0].sets[0].isValidated).toBe(false);
    });
});

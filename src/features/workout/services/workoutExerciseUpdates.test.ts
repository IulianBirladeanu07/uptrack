import type { WorkoutExercise, WorkoutSet } from '../types';
import {
    addWorkoutExercises,
    addWorkoutSet,
    areAllWorkoutSetsValidated,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    moveWorkoutExercise,
    replaceWorkoutExercise,
    toggleWorkoutSetValidation,
    updateWorkoutExerciseNote,
    updateWorkoutReps,
    updateWorkoutWeight,
} from './workoutExerciseUpdates';

const set = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
    id: 'set-1',
    weight: '60',
    reps: '8',
    isValidated: false,
    repsModified: false,
    ...overrides,
});

const exercise = (name: string, overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
    exerciseName: name,
    sets: [set()],
    ...overrides,
});

describe('workoutExerciseUpdates', () => {
    it('updates valid set values immutably and invalidates validation only when values change', () => {
        const original = [exercise('Squat', { sets: [set({ isValidated: true })] })];
        const sameWeight = updateWorkoutWeight(original, 0, 0, '60');
        const changedReps = updateWorkoutReps(original, 0, 0, '9');

        expect(sameWeight?.[0].sets[0]).toMatchObject({
            weight: '60',
            weightModified: true,
            isValidated: true,
        });
        expect(changedReps?.[0].sets[0]).toMatchObject({
            reps: '9',
            repsModified: true,
            isValidated: false,
        });
        expect(original[0].sets[0]).toMatchObject({ weight: '60', reps: '8', isValidated: true });
        expect(changedReps?.[0].sets).not.toBe(original[0].sets);
    });

    it.each([
        ['weight syntax', updateWorkoutWeight, '50.123'],
        ['weight limit', updateWorkoutWeight, '501'],
        ['rep syntax', updateWorkoutReps, '8.5'],
        ['rep lower bound', updateWorkoutReps, '0'],
        ['rep upper bound', updateWorkoutReps, '101'],
    ])('rejects invalid %s without producing an update', (_name, update, value) => {
        expect(update([exercise('Deadlift')], 0, 0, value)).toBeNull();
    });

    it('toggles valid sets both ways and leaves malformed sets unchanged', () => {
        const original = [exercise('Press')];
        const validated = toggleWorkoutSetValidation(original, 0, 0);
        const unvalidated = validated && toggleWorkoutSetValidation(validated, 0, 0);
        const malformed = [exercise('Press', { sets: [set({ weight: '501' })] })];

        expect(validated?.[0].sets[0].isValidated).toBe(true);
        expect(unvalidated?.[0].sets[0].isValidated).toBe(false);
        expect(toggleWorkoutSetValidation(malformed, 0, 0)).toBeNull();
        expect(original[0].sets[0].isValidated).toBe(false);
    });

    it('updates notes and creates a set using the previous set values', () => {
        const original = [exercise('Row', { sets: [set({ weight: '75', reps: '10' })] })];
        const noted = updateWorkoutExerciseNote(original, 0, 'Pause at the top');
        const added = addWorkoutSet(original, 0, () => set({ id: 'set-2', weight: '', reps: '' }));

        expect(noted?.[0].note).toBe('Pause at the top');
        expect(added?.[0].sets).toEqual([
            set({ weight: '75', reps: '10' }),
            set({ id: 'set-2', weight: '75', reps: '10' }),
        ]);
        expect(original[0].sets).toHaveLength(1);
    });

    it('deletes a set or its exercise when it was the last set', () => {
        const original = [
            exercise('Squat', { sets: [set(), set({ id: 'set-2' })] }),
            exercise('Row'),
        ];

        expect(deleteWorkoutSet(original, 0, 0)?.[0].sets).toEqual([set({ id: 'set-2' })]);
        expect(deleteWorkoutSet(original, 1, 0)?.map(item => item.exerciseName)).toEqual(['Squat']);
        expect(deleteWorkoutSet(original, 0, 8)).toBeNull();
    });

    it('deletes, moves, and replaces exercises immutably with boundary guards', () => {
        const original = [exercise('Squat'), exercise('Row'), exercise('Press')];

        expect(deleteWorkoutExercise(original, 1).map(item => item.exerciseName)).toEqual(['Squat', 'Press']);
        expect(moveWorkoutExercise(original, 1, -1)?.map(item => item.exerciseName)).toEqual(['Row', 'Squat', 'Press']);
        expect(moveWorkoutExercise(original, 0, -1)).toBeNull();
        expect(moveWorkoutExercise(original, 2, 1)).toBeNull();
        expect(replaceWorkoutExercise(original, 1, exercise('Cable Row'))?.map(item => item.exerciseName))
            .toEqual(['Squat', 'Cable Row', 'Press']);
        expect(replaceWorkoutExercise(original, 4, exercise('Cable Row'))).toBeNull();
        expect(original.map(item => item.exerciseName)).toEqual(['Squat', 'Row', 'Press']);
    });

    it('adds only named exercises that are not duplicates by identity', () => {
        const current = [exercise('Bench Press', { muscleGroup: 'Chest' })];
        const result = addWorkoutExercises(current, [
            exercise('Bench Press', { muscleGroup: 'Chest' }),
            exercise('Bench Press', { muscleGroup: 'Shoulders' }),
            exercise('', { muscleGroup: 'Back' }),
            exercise('Squat', { muscleGroup: 'Legs' }),
            exercise('Squat', { muscleGroup: 'Legs' }),
        ]);

        expect(result?.map(item => [item.exerciseName, item.muscleGroup])).toEqual([
            ['Bench Press', 'Chest'],
            ['Bench Press', 'Shoulders'],
            ['Squat', 'Legs'],
        ]);
        expect(addWorkoutExercises(current, [exercise('Bench Press', { muscleGroup: 'Chest' })])).toBeNull();
        expect(addWorkoutExercises(current, null)).toBeNull();
        expect(current).toHaveLength(1);
    });

    it('requires at least one exercise and every set to be validated', () => {
        expect(areAllWorkoutSetsValidated([])).toBe(false);
        expect(areAllWorkoutSetsValidated([exercise('Empty', { sets: [] })])).toBe(true);
        expect(areAllWorkoutSetsValidated([exercise('One', { sets: [set({ isValidated: true })] })])).toBe(true);
        expect(areAllWorkoutSetsValidated([
            exercise('One', { sets: [set({ isValidated: true })] }),
            exercise('Two', { sets: [set({ isValidated: false })] }),
        ])).toBe(false);
    });
});

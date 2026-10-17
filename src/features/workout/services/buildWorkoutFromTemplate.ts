import type { WorkoutExercise, WorkoutSet } from '../types';

export const buildWorkoutFromTemplate = (
    templateExercises: WorkoutExercise[],
    lastSetsByExercise: WorkoutSet[][],
    createSetId: () => string,
): WorkoutExercise[] => templateExercises.map((exercise, index) => {
    const lastSets = lastSetsByExercise[index];

    if (exercise.sets && exercise.sets.length > 0 && exercise.sets[0].weight !== undefined) {
        return {
            ...exercise,
            lastWorkoutSets: lastSets,
            sets: exercise.sets.map(set => ({
                id: createSetId(),
                weight: set.weight ?? '',
                reps: set.reps ?? '',
                isValidated: false,
                repsModified: false,
            })),
            repRange: exercise.repRange || '',
        };
    }

    const numSets = parseInt(String(exercise.numSets), 10) || 1;
    const repRangeMatch = exercise.repRange?.match(/(\d+)-(\d+)/);
    let defaultReps: string[];

    if (repRangeMatch) {
        const minReps = parseInt(repRangeMatch[1], 10);
        const maxReps = parseInt(repRangeMatch[2], 10);
        defaultReps = Array.from({ length: numSets }, (_, setIndex) =>
            setIndex === 0 ? maxReps.toString() : minReps.toString()
        );
    } else {
        defaultReps = Array(numSets).fill('');
    }

    const sets = Array.from({ length: numSets }, (_, setIndex) => {
        const previousSet = lastSets[setIndex];
        return {
            id: createSetId(),
            weight: previousSet?.weight || '',
            reps: previousSet?.reps || defaultReps[setIndex] || '',
            isValidated: false,
            repsModified: false,
        };
    });

    return {
        ...exercise,
        lastWorkoutSets: lastSets,
        sets,
        repRange: exercise.repRange || '',
    };
});

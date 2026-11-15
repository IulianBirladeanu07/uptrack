import { findBestSet, formatBestSet } from '../../utils/workoutMetrics';

type WorkoutCardSet = {
    isPR?: boolean;
    weight?: number | string;
    reps?: number | string;
};

type WorkoutCardExercise = {
    exerciseName?: string;
    sets: WorkoutCardSet[];
};

export type WorkoutPR = {
    name: string;
    label: string;
};

export type WorkoutCardSummary = {
    totalSets: number;
    totalPRs: number;
};

export const getWorkoutCardSummary = (
    exercises: WorkoutCardExercise[],
): WorkoutCardSummary => exercises.reduce(
    (summary, exercise) => ({
        totalSets: summary.totalSets + exercise.sets.length,
        totalPRs: summary.totalPRs + exercise.sets.filter(set => set.isPR).length,
    }),
    { totalSets: 0, totalPRs: 0 },
);

export const getWorkoutPRs = (exercises: WorkoutCardExercise[]): WorkoutPR[] =>
    exercises.flatMap(exercise => {
        const records = exercise.sets.filter(set => set.isPR);
        const label = records.length ? formatBestSet(findBestSet(records)) : null;
        return label ? [{ name: exercise.exerciseName || 'Exercise', label }] : [];
    });

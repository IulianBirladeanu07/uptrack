type WorkoutCardExercise = {
    sets: { isPR?: boolean }[];
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

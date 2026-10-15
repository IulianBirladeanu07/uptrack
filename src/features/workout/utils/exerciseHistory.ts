export type ExerciseHistorySet = {
    weight?: string | number;
    reps?: string | number;
    isPR?: boolean;
};

type ExerciseHistoryEntry = {
    exerciseName?: string;
    muscleGroup?: string;
    sets?: ExerciseHistorySet[];
};

export const getExerciseHistorySets = (
    exercises: ExerciseHistoryEntry[],
    exerciseName: string,
    muscleGroup?: string,
): ExerciseHistorySet[] =>
    exercises
        .filter(exercise =>
            exercise.exerciseName === exerciseName &&
            (!muscleGroup || !exercise.muscleGroup || exercise.muscleGroup === muscleGroup)
        )
        .flatMap(exercise => exercise.sets || []);

export const getPreviousWorkoutExerciseSets = (
    exercises: ExerciseHistoryEntry[],
    exerciseName: string,
    muscleGroup?: string,
): ExerciseHistorySet[] => {
    const matching = exercises.filter(exercise => exercise.exerciseName === exerciseName);
    if (!muscleGroup) return matching[0]?.sets || [];

    const exact = matching.filter(exercise => exercise.muscleGroup === muscleGroup);
    const relevant = exact.length > 0
        ? exact
        : matching.filter(exercise => !exercise.muscleGroup);
    return relevant.flatMap(exercise => exercise.sets || []);
};

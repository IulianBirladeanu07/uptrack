type ExerciseIdentity = {
    exerciseName?: string;
    name?: string;
    muscleGroup?: string;
};

export const exerciseIdentityKey = (exerciseName: string, muscleGroup: string): string =>
    JSON.stringify([muscleGroup, exerciseName]);

export const isSameExercise = (first: ExerciseIdentity, second: ExerciseIdentity): boolean => {
    const firstName = first.exerciseName || first.name;
    const secondName = second.exerciseName || second.name;
    if (!firstName || firstName !== secondName) return false;

    return !first.muscleGroup || !second.muscleGroup || first.muscleGroup === second.muscleGroup;
};

type WorkoutHistorySet = {
    weight?: number | string | null;
    reps?: number | string | null;
};

type WorkoutHistoryExercise = {
    exerciseName: string;
    imageURL?: string | null;
    muscleGroup?: string | null;
    category?: string | null;
    numSets?: number | string | null;
    repRange?: string | null;
    note?: string | null;
    restBetweenSets?: number | string | null;
    lastWorkoutSets?: unknown;
    sets: WorkoutHistorySet[];
};

export type WorkoutHistoryForSelection = {
    note?: string | null;
    workoutName?: string | null;
    exercises: WorkoutHistoryExercise[];
};

export const toHistorySelectedWorkout = (workout: WorkoutHistoryForSelection) => ({
    note: workout.note || '',
    templateName: workout.workoutName || '',
    exercises: workout.exercises.map(exercise => ({
        exerciseName: exercise.exerciseName,
        imageURL: exercise.imageURL || '',
        muscleGroup: exercise.muscleGroup || '',
        category: exercise.category || '',
        numSets: exercise.numSets || exercise.sets.length.toString(),
        repRange: exercise.repRange || '',
        note: exercise.note || '',
        restBetweenSets: exercise.restBetweenSets || '',
        lastWorkoutSets: exercise.lastWorkoutSets || [],
        sets: exercise.sets.map(set => ({
            weight: String(set.weight ?? ''),
            reps: String(set.reps || ''),
            isValidated: false,
            repsModified: false,
        })),
    })),
});

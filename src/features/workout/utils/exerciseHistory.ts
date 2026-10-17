import { findBestSet } from './workoutMetrics';

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

export type ExerciseHistoryWorkout = {
    exercises?: ExerciseHistoryEntry[];
    timestamp?: unknown;
    workoutName?: string;
};

export type ExerciseHistorySession = {
    id: string;
    timestamp?: unknown;
    workoutName: string;
    sets: ExerciseHistorySet[];
    best: { weight: number; reps: number; estimated1RM: number; e1rm: number };
    totalVolume: number;
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

export const toExerciseHistorySession = (
    id: string,
    workout: ExerciseHistoryWorkout,
    exerciseName: string,
    muscleGroup?: string,
): ExerciseHistorySession | null => {
    const sets = getExerciseHistorySets(workout.exercises || [], exerciseName, muscleGroup);
    const validSets = sets.filter(set => {
        const weight = parseFloat(String(set.weight));
        const reps = parseInt(String(set.reps), 10);
        return Number.isFinite(weight) && weight >= 0 && Number.isFinite(reps) && reps > 0;
    });
    if (validSets.length === 0) return null;

    const bestSet = findBestSet(validSets);
    return {
        id,
        timestamp: workout.timestamp,
        workoutName: workout.workoutName || 'Workout',
        sets: validSets,
        best: { ...bestSet, e1rm: bestSet.estimated1RM },
        totalVolume: validSets.reduce((sum, set) =>
            sum + (parseFloat(String(set.weight)) || 0) * (parseInt(String(set.reps), 10) || 0), 0),
    };
};

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

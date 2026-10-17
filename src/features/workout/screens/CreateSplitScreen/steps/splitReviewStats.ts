import { hasScheduledWorkout } from '../../../utils/splitSchedule';

export type SplitReviewExercise = {
    exerciseName?: string;
    numSets?: number | string;
    sets?: number | string;
    muscleGroup?: string;
    repRange?: string;
};

export type SplitReviewWorkout = {
    id?: string;
    name?: string;
    templateName?: string;
    duration?: number | string;
    exercises?: SplitReviewExercise[];
    [key: string]: unknown;
};

export type SplitReviewSchedule = Record<string, SplitReviewWorkout | null | undefined>;

export type SplitReviewStats = {
    workoutDays: number;
    totalDuration: number;
    totalSets: number;
    muscleGroupSets: { muscle: string; sets: number }[];
};

export const getSplitReviewStats = (schedule: SplitReviewSchedule): SplitReviewStats => {
    const workouts = Object.values(schedule).filter(
        (workout): workout is SplitReviewWorkout => hasScheduledWorkout(workout),
    );
    const workoutDays = workouts.length;

    let totalDuration = 0;
    let totalSets = 0;
    const muscleGroupSets: Record<string, number> = {};

    workouts.forEach(workout => {
        totalDuration += Number(workout.duration) || 0;

        workout.exercises?.forEach(exercise => {
            const sets = parseInt(String(exercise.numSets ?? 0), 10) ||
                parseInt(String(exercise.sets ?? 0), 10) ||
                0;
            totalSets += sets;

            if (exercise.muscleGroup) {
                muscleGroupSets[exercise.muscleGroup] =
                    (muscleGroupSets[exercise.muscleGroup] || 0) + sets;
            }
        });
    });

    const sortedMuscleGroups = Object.entries(muscleGroupSets)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .map(([muscle, sets]) => ({ muscle, sets }));

    return {
        workoutDays,
        totalDuration,
        totalSets,
        muscleGroupSets: sortedMuscleGroups,
    };
};

export const getSplitDayMuscleGroups = (workout: SplitReviewWorkout | null) =>
    workout?.exercises
        ? [...new Set(workout.exercises.map(exercise => exercise.muscleGroup))]
        : [];

export const getSplitDaySetCount = (workout: SplitReviewWorkout): number =>
    workout.exercises?.reduce(
        (total, exercise) =>
            total + (parseInt(String(exercise.numSets ?? 0), 10) || 0),
        0,
    ) || 0;

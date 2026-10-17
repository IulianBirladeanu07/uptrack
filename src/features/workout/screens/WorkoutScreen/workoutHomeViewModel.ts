import type { UpcomingWorkout } from './ComingUpCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';

export type PrimaryWorkout = {
    workout: WorkoutDisplayData | null;
    isRestDay: boolean;
    isToday: boolean;
};

export type WorkoutHomeViewModel = {
    primaryWorkout: PrimaryWorkout;
    allExercises: string[];
    comingUpWorkouts: UpcomingWorkout[];
};

export const buildWorkoutHomeViewModel = (
    todayWorkout: WorkoutDisplayData | null,
    upcomingWorkouts: UpcomingWorkout[],
): WorkoutHomeViewModel => {
    const isRestDay = !todayWorkout?.exercises?.length;
    const nextWorkout = upcomingWorkouts.find(workout => !workout.isRest);

    const primaryWorkout: PrimaryWorkout = !isRestDay && todayWorkout
        ? { workout: todayWorkout, isRestDay: false, isToday: true }
        : nextWorkout
            ? {
                workout: {
                    name: nextWorkout.name,
                    duration: nextWorkout.duration,
                    exercises: nextWorkout.exercises,
                    day: nextWorkout.day,
                },
                isRestDay: false,
                isToday: false,
            }
            : { workout: null, isRestDay: true, isToday: false };

    return {
        primaryWorkout,
        allExercises: primaryWorkout.workout?.exercises
            .map(exercise => exercise.exerciseName ?? exercise.name ?? 'Exercise') ?? [],
        comingUpWorkouts: primaryWorkout.isToday
            ? upcomingWorkouts.slice(0, 3)
            : upcomingWorkouts.slice(1, 4),
    };
};

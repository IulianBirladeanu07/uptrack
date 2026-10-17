import { findBestSet, formatBestSet } from '../../utils/workoutMetrics';
import type { WorkoutSet } from '../../types';

export type WorkoutSummaryExercise = {
    name: string;
    sets: number;
    bestSet: string | null;
};

export type WorkoutSummary = {
    name: string;
    duration: string;
    totalSets: number;
    exerciseCount: number;
    exercises: WorkoutSummaryExercise[];
};

type WorkoutHistorySet = Pick<WorkoutSet, 'weight' | 'reps'>;
type WorkoutHistoryExercise = {
    exerciseName?: string;
    name?: string;
    sets?: WorkoutHistorySet[];
};

export type WorkoutHistoryEntry = {
    timestamp?: { toDate?: () => Date };
    workoutName?: string;
    templateName?: string;
    duration?: string;
    exercises?: WorkoutHistoryExercise[];
};

export type WorkoutHistorySummary = {
    completedDaysThisWeek: number[];
    lastWorkoutStats: WorkoutSummary | null;
    todayCompletedStats: WorkoutSummary | null;
};

const getFallbackWorkoutName = (entry: WorkoutHistoryEntry): string => {
    const hour = entry.timestamp?.toDate?.()?.getHours();
    if (hour === undefined) return 'Workout';
    if (hour >= 5 && hour < 12) return 'Morning Workout';
    if (hour >= 12 && hour < 17) return 'Afternoon Workout';
    if (hour >= 17 && hour < 21) return 'Evening Workout';
    return 'Night Workout';
};

export const summarizeWorkoutEntry = (entry: WorkoutHistoryEntry): WorkoutSummary => {
    const exercises = entry.exercises ?? [];
    return {
        name: entry.workoutName || entry.templateName || getFallbackWorkoutName(entry),
        duration: entry.duration ?? '0:00',
        totalSets: exercises.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0),
        exerciseCount: exercises.length,
        exercises: exercises.map(exercise => {
            const sets = exercise.sets ?? [];
            const bestSet = findBestSet(sets);
            return {
                name: exercise.exerciseName ?? exercise.name ?? '',
                sets: sets.length,
                bestSet: formatBestSet(bestSet),
            };
        }),
    };
};

export const getWorkoutHistorySummary = (
    workoutHistory: WorkoutHistoryEntry[],
    now = new Date(),
): WorkoutHistorySummary => {
    const completedDaysThisWeek: number[] = [];
    const weekStart = new Date(now);
    const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const sorted = workoutHistory.filter(workout => {
        const date = workout.timestamp?.toDate?.();
        return !date || date <= now;
    }).sort((a, b) => {
        const aTime = a.timestamp?.toDate?.()?.getTime() ?? 0;
        const bTime = b.timestamp?.toDate?.()?.getTime() ?? 0;
        return bTime - aTime;
    });

    sorted.forEach(workout => {
        const date = workout.timestamp?.toDate?.();
        if (!date || date < weekStart || date > now) return;
        const day = date.getDay();
        if (!completedDaysThisWeek.includes(day)) completedDaysThisWeek.push(day);
    });

    const todayString = now.toDateString();
    const todayWorkout = sorted.find(
        workout => workout.timestamp?.toDate?.()?.toDateString() === todayString,
    );

    return {
        completedDaysThisWeek,
        lastWorkoutStats: sorted[0] ? summarizeWorkoutEntry(sorted[0]) : null,
        todayCompletedStats: todayWorkout ? summarizeWorkoutEntry(todayWorkout) : null,
    };
};

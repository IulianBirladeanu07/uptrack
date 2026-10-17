import { durationLabel } from '../../../workout/utils/durationUtils';

export type DashboardWorkoutHistoryEntry = {
    timestamp?: { toDate?: () => Date };
    duration?: unknown;
    exercises?: unknown[];
};

export type CompletedToday = {
    durationLabel: string | null;
    exerciseCount: number;
};

const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const countWeeklyWorkouts = (
    workoutHistory: DashboardWorkoutHistoryEntry[] | null | undefined,
    now = new Date(),
): number => {
    if (!workoutHistory?.length) return 0;
    const weekStart = getMonday(now);
    return workoutHistory.filter(workout => {
        const date = workout.timestamp?.toDate?.();
        return date && date >= weekStart && date <= now;
    }).length;
};

export const getCompletedToday = (
    workoutHistory: DashboardWorkoutHistoryEntry[] | null | undefined,
    now = new Date(),
): CompletedToday | null => {
    if (!workoutHistory?.length) return null;
    const todayString = now.toDateString();
    const entries = workoutHistory.filter(workout => {
        const date = workout.timestamp?.toDate?.();
        return date?.toDateString() === todayString && date <= now;
    });
    if (!entries.length) return null;
    const latest = entries.reduce((first, second) =>
        second.timestamp!.toDate!() > first.timestamp!.toDate!() ? second : first,
    );
    return {
        durationLabel: durationLabel(latest.duration),
        exerciseCount: (latest.exercises ?? []).length,
    };
};

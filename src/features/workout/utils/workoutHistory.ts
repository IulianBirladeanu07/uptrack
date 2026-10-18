type WorkoutHistoryEntry = {
    timestamp?: { toDate?: () => Date } | null;
};

const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

export const isWorkoutTimestampWithinClockSkew = (timestamp: Date, now: Date): boolean =>
    timestamp instanceof Date &&
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.getTime() <= now.getTime() + CLOCK_SKEW_TOLERANCE_MS;

export const countWorkoutEntriesThisWeek = (
    workouts: WorkoutHistoryEntry[],
    now: Date = new Date(),
): number => {
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
    weekStart.setHours(0, 0, 0, 0);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    return workouts.filter(workout => {
        const timestamp = workout.timestamp?.toDate?.();
        return timestamp instanceof Date &&
            isWorkoutTimestampWithinClockSkew(timestamp, now) &&
            timestamp >= weekStart &&
            timestamp < nextWeekStart;
    }).length;
};

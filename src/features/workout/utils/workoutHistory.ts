type WorkoutHistoryEntry = {
    timestamp?: { toDate?: () => Date } | null;
};

const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

export const getWorkoutWeekRange = (now: Date = new Date()) => {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
};

export const isWorkoutTimestampWithinClockSkew = (timestamp: Date, now: Date): boolean =>
    timestamp instanceof Date &&
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.getTime() <= now.getTime() + CLOCK_SKEW_TOLERANCE_MS;

export const countWorkoutEntriesThisWeek = (
    workouts: WorkoutHistoryEntry[],
    now: Date = new Date(),
): number => {
    const { start: weekStart, end: nextWeekStart } = getWorkoutWeekRange(now);

    return workouts.filter(workout => {
        const timestamp = workout.timestamp?.toDate?.();
        return timestamp instanceof Date &&
            isWorkoutTimestampWithinClockSkew(timestamp, now) &&
            timestamp >= weekStart &&
            timestamp < nextWeekStart;
    }).length;
};

export type WorkoutHistoryTimestamp = { seconds?: number } | null | undefined;

export const getWorkoutMonthYear = (timestamp: WorkoutHistoryTimestamp): string => {
    if (!timestamp?.seconds) return 'Recent';
    const date = new Date(timestamp.seconds * 1000);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const groupWorkoutHistoryByMonth = <T>(
    workouts: T[],
    getTimestamp: (workout: T) => WorkoutHistoryTimestamp,
): { title: string; data: T[] }[] => {
    const grouped: Record<string, T[]> = {};
    workouts.forEach(workout => {
        const title = getWorkoutMonthYear(getTimestamp(workout));
        if (!grouped[title]) grouped[title] = [];
        grouped[title].push(workout);
    });
    return Object.keys(grouped).map(title => ({ title, data: grouped[title] }));
};

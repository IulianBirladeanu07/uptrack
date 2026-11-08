import type { WorkoutHistoryTimestamp } from './workoutHistorySections';

export const formatWorkoutHistoryDate = (
    timestamp: WorkoutHistoryTimestamp,
    now = new Date(),
): string => {
    if (timestamp?.seconds == null || !Number.isFinite(timestamp.seconds)) return 'Recent';

    const date = new Date(timestamp.seconds * 1000);
    if (Number.isNaN(date.getTime())) return 'Recent';

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const workoutDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (workoutDay.getTime() === today.getTime()) return 'Today';
    if (workoutDay.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

export const getWorkoutHistoryLabel = (
    timestamp: WorkoutHistoryTimestamp,
    templateName?: string | null,
): string => {
    if (templateName && templateName !== 'Workout') return templateName;
    if (!timestamp?.seconds) return 'Recent Workout';
    const hour = new Date(timestamp.seconds * 1000).getHours();
    if (hour >= 5 && hour < 12) return 'Morning Workout';
    if (hour >= 12 && hour < 17) return 'Afternoon Workout';
    if (hour >= 17 && hour < 21) return 'Evening Workout';
    return 'Night Workout';
};

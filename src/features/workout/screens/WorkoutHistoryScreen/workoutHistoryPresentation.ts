import type { WorkoutHistoryTimestamp } from './workoutHistorySections';

export const formatWorkoutHistoryDate = (
    timestamp: WorkoutHistoryTimestamp,
    now: Date = new Date(),
): string => {
    if (!timestamp?.seconds) return 'RECENT';
    const date = new Date(timestamp.seconds * 1000);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
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

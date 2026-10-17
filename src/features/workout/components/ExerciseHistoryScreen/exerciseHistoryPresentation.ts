export type ExerciseHistoryTimestamp = { seconds?: number } | null | undefined;

export const formatExerciseHistoryDate = (
    timestamp: ExerciseHistoryTimestamp,
    now: Date = new Date(),
): { label: string } => {
    if (!timestamp?.seconds) return { label: 'Recent' };
    const date = new Date(timestamp.seconds * 1000);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (date.toDateString() === now.toDateString()) return { label: 'Today' };
    if (date.toDateString() === yesterday.toDateString()) return { label: 'Yesterday' };
    return { label: `${monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` };
};

export const getExerciseHistoryLabelAnchor = (
    index: number,
    total: number,
): 'start' | 'middle' | 'end' =>
    index === 0 ? 'start' : index === total - 1 ? 'end' : 'middle';

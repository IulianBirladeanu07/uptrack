import { formatWorkoutDate } from '../../utils/formatWorkoutDate';

export type ExerciseHistoryTimestamp = { seconds?: number } | null | undefined;

export const formatExerciseHistoryDate = (
    timestamp: ExerciseHistoryTimestamp,
): { label: string } => {
    return { label: formatWorkoutDate(timestamp) };
};

export const getExerciseHistoryLabelAnchor = (
    index: number,
    total: number,
): 'start' | 'middle' | 'end' =>
    index === 0 ? 'start' : index === total - 1 ? 'end' : 'middle';

import { durationToMinutes } from '../../utils/durationUtils';
import { findBestSet, formatBestSet } from '../../utils/workoutMetrics';
import {
    formatWorkoutHistoryDate,
    getWorkoutHistoryLabel,
} from './workoutHistoryPresentation';
import type { WorkoutHistoryTimestamp } from './workoutHistorySections';

type WorkoutHistoryCardSet = {
    weight?: number | string;
    reps?: number | string;
    estimated1RM?: number | string;
    isPR?: boolean;
};

type WorkoutHistoryCardExercise = {
    exerciseName?: string;
    sets: WorkoutHistoryCardSet[];
};

export type WorkoutHistoryCardItem = {
    timestamp: WorkoutHistoryTimestamp;
    workoutName?: string | null;
    duration?: unknown;
    totalPRs?: number;
    exercises?: WorkoutHistoryCardExercise[];
};

export const getWorkoutHistoryCardData = (item: WorkoutHistoryCardItem) => {
    const exercises = item.exercises || [];
    const dateLabel = formatWorkoutHistoryDate(item.timestamp);

    return {
        exercises: exercises.map(exercise => ({
            exerciseName: exercise.exerciseName,
            setCount: exercise.sets.length,
            bestSetLabel: formatBestSet(findBestSet(exercise.sets)) || '-',
            hasPR: exercise.sets.some(set => set.isPR),
        })),
        totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
        durationMinutes: durationToMinutes(item.duration) ?? 0,
        workoutTitle: getWorkoutHistoryLabel(item.timestamp, item.workoutName),
        dateLabel,
        isToday: dateLabel === 'TODAY',
        totalPRs: item.totalPRs,
        hasPRs: item.totalPRs !== undefined && item.totalPRs > 0,
    };
};

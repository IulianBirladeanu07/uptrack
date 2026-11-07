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
    exercises?: WorkoutHistoryCardExercise[];
};

const MISSING_LABEL = '-';
const PREVIEW_LIMIT = 3;

const splitLabel = (label: string) => {
    const i = label.indexOf(' × ');
    return i < 0
        ? { weight: '', reps: label }
        : { weight: label.slice(0, i), reps: label.slice(i + 3) };
};

export const getPreviewExercises = <T extends { hasPR: boolean }>(exercises: T[], limit: number = PREVIEW_LIMIT): T[] => {
    const picked = new Set<number>();
    exercises.forEach((exercise, i) => {
        if (exercise.hasPR && picked.size < limit) picked.add(i);
    });
    exercises.forEach((_, i) => {
        if (picked.size < limit) picked.add(i);
    });
    return exercises.filter((_, i) => picked.has(i));
};

export const getWorkoutHistoryCardData = (item: WorkoutHistoryCardItem) => {
    const exercises = item.exercises || [];
    const dateLabel = formatWorkoutHistoryDate(item.timestamp);
    const totalPRs = exercises.reduce(
        (total, exercise) => total + exercise.sets.filter(set => set.isPR).length,
        0,
    );

    return {
        exercises: exercises.map(exercise => {
            const bestSetLabel = formatBestSet(findBestSet(exercise.sets)) || MISSING_LABEL;
            return {
                exerciseName: exercise.exerciseName,
                setCount: exercise.sets.length,
                sets: exercise.sets.map((set, index) => {
                    const label = formatBestSet(set) || MISSING_LABEL;
                    return { number: index + 1, label, ...splitLabel(label), isPR: !!set.isPR };
                }),
                bestSetLabel,
                best: splitLabel(bestSetLabel),
                hasPR: exercise.sets.some(set => set.isPR),
            };
        }),
        totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
        durationMinutes: durationToMinutes(item.duration) ?? 0,
        workoutTitle: getWorkoutHistoryLabel(item.timestamp, item.workoutName),
        dateLabel,
        isToday: dateLabel === 'TODAY',
        totalPRs,
        hasPRs: totalPRs > 0,
    };
};

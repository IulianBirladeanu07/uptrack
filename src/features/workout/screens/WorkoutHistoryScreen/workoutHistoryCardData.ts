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
export const PREVIEW_EXERCISE_COUNT = 3;

const splitLabel = (label: string) => {
    const i = label.indexOf(' × ');
    return i < 0
        ? { weight: '', reps: label }
        : { weight: label.slice(0, i), reps: label.slice(i + 3) };
};

type SetParts = { weight: string; reps: string; isPR: boolean };

const joinReps = (reps: string[]) => {
    if (reps.every(r => r.endsWith(' reps'))) return `${reps.map(r => r.slice(0, -5)).join(', ')} reps`;
    return reps.join(', ');
};

const groupSets = (sets: SetParts[]): { label: string; isPR: boolean }[] => {
    const groups: { weight: string; reps: string[]; isPR: boolean }[] = [];
    sets.forEach(set => {
        const last = groups[groups.length - 1];
        if (last && last.weight === set.weight) {
            last.reps.push(set.reps);
            last.isPR = last.isPR || set.isPR;
        } else {
            groups.push({ weight: set.weight, reps: [set.reps], isPR: set.isPR });
        }
    });
    return groups.map(group => ({
        label: group.weight ? `${group.weight} × ${joinReps(group.reps)}` : joinReps(group.reps),
        isPR: group.isPR,
    }));
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
                setGroups: groupSets(exercise.sets.map(set => ({
                    ...splitLabel(formatBestSet(set) || MISSING_LABEL),
                    isPR: !!set.isPR,
                }))),
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

import type { TemplateExercise } from '../../types';

export type WorkoutPreviewStats = {
    durationLabel: string;
    totalSets: number;
    exerciseCount: number;
};

type WorkoutPreviewSummaryInput = {
    duration: string;
    exercises: TemplateExercise[];
};

export const getWorkoutPreviewStats = (
    workout: WorkoutPreviewSummaryInput | null,
): WorkoutPreviewStats => ({
    durationLabel: workout?.duration.replace(' min', 'm') ?? '0m',
    totalSets: workout?.exercises.reduce(
        (total, exercise) =>
            total + (parseInt(String(exercise.numSets ?? 0), 10) || 0),
        0,
    ) ?? 0,
    exerciseCount: workout?.exercises.length ?? 0,
});

export const getWorkoutMuscleGroupLabel = (exercises: TemplateExercise[]): string =>
    [...new Set(
        exercises
            .map(exercise => exercise.muscleGroup)
            .filter((group): group is string => Boolean(group)),
    )].join(' · ');

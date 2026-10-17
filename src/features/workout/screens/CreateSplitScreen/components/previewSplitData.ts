import { hasScheduledWorkout } from '../../../utils/splitSchedule';

export type PreviewExercise = {
  numSets?: number | string;
  sets?: number | string;
  exerciseName?: string;
  muscleGroup?: string;
  repRange?: string;
  [key: string]: unknown;
};

export type PreviewDayWorkout = {
  id?: string;
  templateId?: string;
  name?: string;
  templateName?: string;
  duration?: number | string;
  exercises?: PreviewExercise[];
  [key: string]: unknown;
};

export type PreviewSplitSchedule = Record<string, PreviewDayWorkout | null | undefined>;

export type PreviewSplitStats = {
  selectedDayStats: {
    duration: number | string;
    exerciseCount: number;
    totalSets: number;
  } | null;
  compositionStats: {
    workoutDays: number;
    totalSets: number;
    totalDuration: number;
  };
  muscleGroupSets: { muscle: string; sets: number }[];
  uncoveredMuscles: string[];
};

const MAJOR_MUSCLE_GROUPS = ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'];

export const getPreviewSplitStats = (
  schedule: PreviewSplitSchedule,
  selectedDayWorkout: PreviewDayWorkout | null,
): PreviewSplitStats => {
  const workouts = Object.values(schedule).filter(
    (workout): workout is PreviewDayWorkout => hasScheduledWorkout(workout),
  );

  let totalSets = 0;
  let totalDuration = 0;
  const setsByMuscle: Record<string, number> = {};

  workouts.forEach(workout => {
    totalDuration += Number(workout.duration) || 0;
    workout.exercises?.forEach(exercise => {
      const count = Number(exercise.numSets) || Number(exercise.sets) || 0;
      totalSets += count;
      if (exercise.muscleGroup) {
        setsByMuscle[exercise.muscleGroup] = (setsByMuscle[exercise.muscleGroup] || 0) + count;
      }
    });
  });

  const muscleGroupSets = Object.entries(setsByMuscle)
    .sort(([, a], [, b]) => b - a)
    .map(([muscle, count]) => ({ muscle, sets: count }));

  const selectedDayStats = selectedDayWorkout
    ? {
      duration: selectedDayWorkout.duration || 45,
      exerciseCount: selectedDayWorkout.exercises?.length || 0,
      totalSets: selectedDayWorkout.exercises?.reduce(
        (acc, exercise) => acc + (
          parseInt(String(exercise.numSets ?? 0), 10)
          || parseInt(String(exercise.sets ?? 0), 10)
          || 0
        ),
        0,
      ) || 0,
    }
    : null;

  return {
    selectedDayStats,
    compositionStats: { workoutDays: workouts.length, totalSets, totalDuration },
    muscleGroupSets,
    uncoveredMuscles: MAJOR_MUSCLE_GROUPS.filter(
      muscle => !muscleGroupSets.some(item => item.muscle === muscle),
    ),
  };
};

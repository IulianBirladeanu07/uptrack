import { calculate1RM, getPersonalRecordSetIndexes } from '../utils/workoutMetrics';
import type { WorkoutExercise } from '../types';

type BuildWorkoutCompletionDataParams = {
  exerciseData: WorkoutExercise[];
  uid: string;
  timestamp: unknown;
  note: string;
  duration: string;
  workoutName: string | null;
};

export const buildWorkoutCompletionData = ({
  exerciseData,
  uid,
  timestamp,
  note,
  duration,
  workoutName,
}: BuildWorkoutCompletionDataParams) => {
  const exercisesWithPR = exerciseData.map(exercise => {
    const prSetIndexes = new Set(
      getPersonalRecordSetIndexes(exercise.sets, exercise.lastWorkoutSets || []),
    );
    return {
      ...exercise,
      sets: exercise.sets.map((set, index) => ({ ...set, isPR: prSetIndexes.has(index) })),
    };
  });

  const workoutDataToSend = {
    uid,
    timestamp,
    note,
    duration,
    workoutName,
    exercises: exercisesWithPR.map(({ lastWorkoutSets, ...exercise }) => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        weight: parseFloat(String(set.weight ?? 0)),
        reps: parseInt(String(set.reps ?? 0), 10),
        isValidated: set.isValidated,
        isPR: set.isPR || false,
        estimated1RM: Number(set.reps) > 0
          ? calculate1RM(
            parseFloat(String(set.weight)),
            parseInt(String(set.reps), 10),
          ).toFixed(2)
          : 'N/A',
      })),
    })),
  };

  return { exercisesWithPR, workoutDataToSend };
};

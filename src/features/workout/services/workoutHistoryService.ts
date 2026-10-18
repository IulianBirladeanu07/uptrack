import { getAuth } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import type { WorkoutSet } from '../types';
import { getPreviousWorkoutExerciseSets } from '../utils/exerciseHistory';
import { countWorkoutEntriesThisWeek, getWorkoutWeekRange } from '../utils/workoutHistory';
import { fetchUserWorkoutHistory, fetchUserWorkoutHistoryInRange } from './workoutHistoryQuery';

export const getSetsFromLastWorkout = async (
  exerciseName: string,
  muscleGroup?: string,
): Promise<WorkoutSet[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const workoutHistory = await fetchUserWorkoutHistory(user.uid, 50);
    for (const workout of workoutHistory) {
      const previousWorkout = workout.data as {
        exercises?: Array<{
          exerciseName?: string;
          muscleGroup?: string;
          sets?: Array<{ weight?: string | number; reps?: string | number }>;
        }>;
      };
      const previousSets = getPreviousWorkoutExerciseSets(
        previousWorkout.exercises || [],
        exerciseName,
        muscleGroup,
      );

      if (previousSets.length > 0) {
        return previousSets.map((set, index) => ({
          id: `${exerciseName}-${index}`,
          weight: set.weight !== undefined ? String(set.weight) : '',
          reps: set.reps !== undefined ? String(set.reps) : '',
          isValidated: false,
          repsModified: false,
        }));
      }
    }

    return [];
  } catch (error) {
    console.error('Error retrieving sets from last workout:', (error as Error).message);
    return [];
  }
};

export const countWorkoutsThisWeek = async (): Promise<number> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const now = new Date();
    const { start, end } = getWorkoutWeekRange(now);
    const workouts = await fetchUserWorkoutHistoryInRange(user.uid, start, end);
    return countWorkoutEntriesThisWeek(workouts.map(workout => workout.data) as {
      timestamp?: { toDate?: () => Date } | null
    }[], now);
  } catch (error) {
    console.error('Error counting workouts for this week:', (error as Error).message);
    throw error;
  }
};

export const getLastWorkout = async (): Promise<DocumentData | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const workouts = await fetchUserWorkoutHistory(user.uid, 1);
    return workouts[0]?.data ?? null;
  } catch (error) {
    console.error('Error fetching last workout:', (error as Error).message);
    throw error;
  }
};

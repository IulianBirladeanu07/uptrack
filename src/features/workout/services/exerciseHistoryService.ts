import { getAuth } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';
import { toExerciseHistorySession } from '../utils/exerciseHistory';
import { fetchUserWorkoutHistory } from './workoutHistoryQuery';

export const getExerciseHistory = async (
  exerciseName: string,
  muscleGroup?: string,
): Promise<DocumentData[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const workoutHistory = await fetchUserWorkoutHistory(user.uid, 100);
    const sessions: DocumentData[] = [];

    for (const workout of workoutHistory) {
      const typedData = workout.data as {
        exercises?: Array<{
          exerciseName?: string;
          muscleGroup?: string;
          sets?: Array<{ weight?: string | number; reps?: string | number }>;
        }>;
        timestamp?: unknown;
        workoutName?: string;
      };
      const session = toExerciseHistorySession(workout.id, typedData, exerciseName, muscleGroup);
      if (session) sessions.push(session);
    }

    return sessions;
  } catch (error) {
    console.error('Error fetching exercise history:', (error as Error).message);
    throw error;
  }
};

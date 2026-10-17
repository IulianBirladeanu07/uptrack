import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { toExerciseHistorySession } from '../utils/exerciseHistory';

export const getExerciseHistory = async (
  exerciseName: string,
  muscleGroup?: string,
): Promise<DocumentData[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutQuery = query(
      workoutsRef,
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(100),
    );
    const querySnapshot = await getDocs(workoutQuery);
    const sessions: DocumentData[] = [];

    for (const snap of querySnapshot.docs) {
      const data = snap.data() as {
        exercises?: Array<{
          exerciseName?: string;
          muscleGroup?: string;
          sets?: Array<{ weight?: string | number; reps?: string | number }>;
        }>;
        timestamp?: unknown;
        workoutName?: string;
      };
      const session = toExerciseHistorySession(snap.id, data, exerciseName, muscleGroup);
      if (session) sessions.push(session);
    }

    return sessions;
  } catch (error) {
    console.error('Error fetching exercise history:', (error as Error).message);
    throw error;
  }
};

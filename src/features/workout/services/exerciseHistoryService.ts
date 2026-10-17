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
import { getExerciseHistorySets } from '../utils/exerciseHistory';
import { findBestSet } from '../utils/workoutMetrics';

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
      const exerciseSets = getExerciseHistorySets(data.exercises || [], exerciseName, muscleGroup);
      if (exerciseSets.length === 0) continue;

      const validSets = exerciseSets.filter(set => {
        const weight = parseFloat(String(set.weight));
        const reps = parseInt(String(set.reps), 10);
        return Number.isFinite(weight) && weight >= 0 && Number.isFinite(reps) && reps > 0;
      });
      if (validSets.length === 0) continue;

      const bestSet = findBestSet(validSets);
      const best = { ...bestSet, e1rm: bestSet.estimated1RM };

      sessions.push({
        id: snap.id,
        timestamp: data.timestamp,
        workoutName: data.workoutName || 'Workout',
        sets: validSets,
        best,
        totalVolume: validSets.reduce((sum, set) =>
          sum + (parseFloat(String(set.weight)) || 0) * (parseInt(String(set.reps), 10) || 0), 0),
      });
    }

    return sessions;
  } catch (error) {
    console.error('Error fetching exercise history:', (error as Error).message);
    throw error;
  }
};

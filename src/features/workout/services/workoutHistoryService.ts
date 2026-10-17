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
import type { WorkoutSet } from '../types';
import { getPreviousWorkoutExerciseSets } from '../utils/exerciseHistory';
import { countWorkoutEntriesThisWeek } from '../utils/workoutHistory';

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

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutQuery = query(
      workoutsRef,
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50),
    );
    const querySnapshot = await getDocs(workoutQuery);

    for (const snap of querySnapshot.docs) {
      const workoutData = snap.data() as {
        exercises?: Array<{
          exerciseName?: string;
          muscleGroup?: string;
          sets?: Array<{ weight?: string | number; reps?: string | number }>;
        }>;
      };
      const previousSets = getPreviousWorkoutExerciseSets(
        workoutData.exercises || [],
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

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(workoutsRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(workoutsQuery);
    return countWorkoutEntriesThisWeek(querySnapshot.docs.map(workout =>
      workout.data() as { timestamp?: { toDate?: () => Date } | null }
    ));
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

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(
      workoutsRef,
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1),
    );
    const querySnapshot = await getDocs(workoutsQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DocumentData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching last workout:', (error as Error).message);
    throw error;
  }
};

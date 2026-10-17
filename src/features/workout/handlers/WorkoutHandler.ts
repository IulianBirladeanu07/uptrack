import { getAuth } from 'firebase/auth';
import {
  collection,
  setDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import type {
  BodyMeasurements,
  WorkoutExercise,
  WorkoutSet,
} from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthenticatedStackParamList } from '../../../shared/navigation';
export { sendWorkoutDataToFirestore } from '../services/workoutSessionService';
export { clearSplitsCache, SPLITS_CACHE_KEY } from '../services/splitCache';
export {
  addSplitToFirestore,
  deleteSplitFromFirestore,
  fetchSplitsFromFirestore,
  updateSplitDay,
  updateSplitInFirestore,
  updateSplitProgress,
} from '../services/workoutSplitService';
export { getExerciseHistory } from '../services/exerciseHistoryService';
export {
  clearExercisesCache,
  createCustomExercise,
  fetchExercises,
  getCacheStatus,
  prefetchExercises,
} from '../services/exerciseCatalogService';
export {
  countWorkoutsThisWeek,
  getLastWorkout,
  getSetsFromLastWorkout,
} from '../services/workoutHistoryService';
export {
  addTemplateToFirestore,
  deleteTemplateFromFirestore,
  fetchTemplatesFromFirestore,
  TemplateNameAlreadyExistsError,
  updateTemplateInFirestore,
} from '../services/workoutTemplateService';
export { calculate1RM, findBestSet, formatBestSet } from '../utils/workoutMetrics';

type AppNav = NativeStackNavigationProp<AuthenticatedStackParamList>;
export const countTotalPRs = (lastWorkoutData: { exercises?: { sets?: { isPR?: boolean }[] }[] } | null | undefined): number => {
  return (lastWorkoutData?.exercises || []).reduce(
    (total, exercise) => total + (exercise.sets || []).filter(set => set.isPR).length,
    0
  );
};

export const handleAddExercises = (navigation: AppNav): void => {
  navigation.navigate('ExerciseSelection', { previousScreen: 'StartWorkout' });
};

export const handleValidation = (exerciseIndex: number, setIndex: number, exerciseData: WorkoutExercise[]): WorkoutExercise[] => {
  const updatedData = [...exerciseData];
  const currentSet = updatedData[exerciseIndex].sets[setIndex];
  currentSet.isValidated = !currentSet.isValidated;
  return updatedData;
};

export const handleInputChange = (text: string, setInputText: (t: string) => void): void => {
  setInputText(text);
};

export const handleAddSet = (exerciseIndex: number, exerciseData: WorkoutExercise[], setExerciseData: (d: WorkoutExercise[]) => void): void => {
  const updatedData = [...exerciseData];
  const newSet: WorkoutSet = { id: `${Date.now()}`, weight: '', reps: '', isValidated: false, repsModified: false };
  updatedData[exerciseIndex].sets.push(newSet);
  setExerciseData(updatedData);
};

export const handleWeightChange = (text: string, exerciseIndex: number, setIndex: number, exerciseData: WorkoutExercise[]): WorkoutExercise[] | undefined => {
  if (text === '' || /^\d*\.?\d*$/.test(text)) {
    const updatedData = [...exerciseData];
    updatedData[exerciseIndex].sets[setIndex].weight = text;
    return updatedData;
  } else {
    return exerciseData;
  }
};

export const handleRepsChange = (text: string, exerciseIndex: number, setIndex: number, exerciseData: WorkoutExercise[]): WorkoutExercise[] | undefined => {
  if (text === '' || /^\d+$/.test(text)) {
    const updatedData = [...exerciseData];
    updatedData[exerciseIndex].sets[setIndex].reps = text;
    return updatedData;
  } else {
    return exerciseData;
  }
};

export const sendMeasurementsToFirestore = async (measurements: BodyMeasurements): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const uid = user.uid;
    const timestamp = new Date();

    const measurementsDataToSend = {...measurements, uid, timestamp};

    const userMeasurementsRef = collection(db, 'measurements');
    const measurementDocRef = doc(userMeasurementsRef);

    await setDoc(measurementDocRef, measurementsDataToSend);
  } catch (error) {
    console.error('Error saving measurements:', (error as Error).message);
    throw error;
  }
};

export const fetchLastMeasurements = async (): Promise<BodyMeasurements | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const uid = user.uid;

    const measurementsRef = collection(db, 'measurements');
    const measurementsQuery = query(measurementsRef, where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(measurementsQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DocumentData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching last measurements:', (error as Error).message);
    throw error;
  }
};

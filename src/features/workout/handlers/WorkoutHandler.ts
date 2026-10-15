import { getAuth } from 'firebase/auth';
import {
  collection,
  setDoc,
  getDocs,
  runTransaction,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { Alert } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customDocToExercise, mergeCustomExercises } from '../utils/exerciseCatalog';
import type {
  BodyMeasurements,
  CacheStatus,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSplit,
  WorkoutTemplate,
  TemplateInput,
} from '../types';
import type { CatalogExercise, ExerciseGroup } from '../../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthenticatedStackParamList } from '../../../shared/navigation';
import { isValidWorkoutSetInput } from '../utils/workoutSetValidation';
import { getExerciseHistorySets, getPreviousWorkoutExerciseSets } from '../utils/exerciseHistory';
import { calculate1RM, findBestSet, getPersonalRecordSetIndexes } from '../utils/workoutMetrics';
import { countWorkoutEntriesThisWeek } from '../utils/workoutHistory';
export { calculate1RM, findBestSet, formatBestSet } from '../utils/workoutMetrics';

type AppNav = NativeStackNavigationProp<AuthenticatedStackParamList>;
type MessageFn = (message: string) => void;
type FormatTimeFn = (seconds: number) => string;

export class TemplateNameAlreadyExistsError extends Error {
  constructor() {
    super('A workout template with this name already exists.');
    this.name = 'TemplateNameAlreadyExistsError';
  }
}

const assertTemplateNameAvailable = (
  templates: readonly { id: string; data: () => DocumentData }[],
  templateName: string,
  currentTemplateId?: string,
): void => {
  const normalizedName = templateName.trim().toLowerCase();
  const duplicate = templates.some(template => {
    if (template.id === currentTemplateId) return false;
    const existingName = template.data()['templateName'];
    return typeof existingName === 'string' &&
      existingName.trim().toLowerCase() === normalizedName;
  });

  if (duplicate) throw new TemplateNameAlreadyExistsError();
};

export const SPLITS_CACHE_KEY = 'cached_splits';

export const clearSplitsCache = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SPLITS_CACHE_KEY);
    } catch {}
};

export const sendWorkoutDataToFirestore = async (
    exerciseData: WorkoutExercise[],
    inputText: string,
    isValidationPressed: boolean,
    navigation: Pick<AppNav, 'navigate'>,
    openAnimatedMessage: MessageFn,
    formatTime: FormatTimeFn,
    elapsedTime: number,
    expectedUid: string,
    templateName = '',
): Promise<boolean> => {
    try {
        const hasEmptyOrInvalidInputs = exerciseData.some(exercise =>
            exercise.sets.some(set => !isValidWorkoutSetInput(set.weight, set.reps))
        );

        if (hasEmptyOrInvalidInputs) {
            openAnimatedMessage('Note: Some sets have empty or invalid weight/reps.');
            return false;
        }

        if (!isValidationPressed) {
            return new Promise((resolve) => {
                Alert.alert(
                    'Unvalidated Sets',
                    'Some sets are not validated. Do you wish to proceed anyway?',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        {
                            text: 'Proceed',
                            onPress: async () => {
                                const saved = await finishWorkout(exerciseData, inputText, navigation, openAnimatedMessage, formatTime, elapsedTime, expectedUid, templateName);
                                resolve(saved);
                            },
                        },
                    ]
                );
            });
        } else {
            return await finishWorkout(exerciseData, inputText, navigation, openAnimatedMessage, formatTime, elapsedTime, expectedUid, templateName);
        }
    } catch (error) {
        console.error('Error adding workout data:', (error as Error).message);
        openAnimatedMessage(`Error: ${(error as Error).message}`);
        return false;
    }
};

async function finishWorkout(
    exerciseData: WorkoutExercise[],
    inputText: string,
    navigation: Pick<AppNav, 'navigate'>,
    openAnimatedMessage: MessageFn,
    formatTime: FormatTimeFn,
    elapsedTime: number,
    expectedUid: string,
    templateName = '',
): Promise<boolean> {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || user.uid !== expectedUid) {
            throw new Error('The signed-in user changed before the workout could be saved.');
        }

        const uid = user.uid;
        const timestamp = new Date();

        const exercisesWithPR = exerciseData.map(exercise => {
            const prSetIndexes = new Set(getPersonalRecordSetIndexes(exercise.sets, exercise.lastWorkoutSets || []));

            return {
                ...exercise,
                sets: exercise.sets.map((set, index) => ({ ...set, isPR: prSetIndexes.has(index) })),
            };
        });

        const workoutDataToSend = {
            uid,
            timestamp: serverTimestamp(),
            note: inputText,
            duration: formatTime(elapsedTime),
            workoutName: templateName || null,
            exercises: exercisesWithPR.map(exercise => ({
                ...exercise,
                sets: exercise.sets.map(set => ({
                    weight: parseFloat(String(set.weight ?? 0)),
                    reps: parseInt(String(set.reps ?? 0), 10),
                    isValidated: set.isValidated,
                    isPR: set.isPR || false,
                    estimated1RM: Number(set.reps) > 0 ? calculate1RM(parseFloat(String(set.weight)), parseInt(String(set.reps), 10)).toFixed(2) : 'N/A',
                })),
            })),
        };

        const workoutDocRef = doc(collection(db, 'workoutHistory'));
        await setDoc(workoutDocRef, workoutDataToSend);

        if (getAuth().currentUser?.uid !== expectedUid) {
            console.error('Workout saved, but the signed-in user changed before workout details could open.');
            return true;
        }

        try {
            navigation.navigate('WorkoutDetails', {
                duration: formatTime(elapsedTime),
                notes: inputText,
                exercises: exercisesWithPR,
                timestamp: timestamp.toDateString() + ' ' + timestamp.toLocaleTimeString(),
                workoutName: templateName || null,
            });
        } catch (error) {
            console.error('Workout saved but failed to open workout details:', (error as Error).message);
            openAnimatedMessage('Workout saved, but workout details could not be opened.');
        }
        return true;
    } catch (error) {
        console.error('Error finishing workout:', (error as Error).message);
        openAnimatedMessage(`Error: ${(error as Error).message}`);
        return false;
    }
}

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

export const getSetsFromLastWorkout = async (exerciseName: string, muscleGroup?: string): Promise<WorkoutSet[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutQuery = query(
      workoutsRef,
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(50)
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
      const exercises = workoutData.exercises || [];
      const previousSets = getPreviousWorkoutExerciseSets(exercises, exerciseName, muscleGroup);

      if (previousSets.length > 0) {
        return previousSets.map((set, i) => ({
          id: `${exerciseName}-${i}`,
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

    
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(workoutsRef, where('uid', '==', uid));
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

    
    const uid = user.uid;

    const workoutsRef = collection(db, 'workoutHistory');
    const workoutsQuery = query(workoutsRef, where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(workoutsQuery);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as DocumentData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching last workout:', (error as Error).message);
    throw error;
  }
};

export const addTemplateToFirestore = async (templateData: TemplateInput, templateName: string): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const normalizedTemplateName = templateName.trim();
    const formattedTemplateName = `${encodeURIComponent(normalizedTemplateName.toLowerCase())}_${user.uid}`;

    const fullTemplateData = {
      ...templateData,
      templateName: normalizedTemplateName,
      uid: user.uid
    };

    const templateDocRef = doc(db, 'workoutTemplates', formattedTemplateName);
    const templatesQuery = query(
      collection(db, 'workoutTemplates'),
      where('uid', '==', user.uid),
    );
    const templatesSnapshot = await getDocs(templatesQuery);
    assertTemplateNameAvailable(templatesSnapshot.docs, normalizedTemplateName);
    await runTransaction(db, async transaction => {
      const existingTemplate = await transaction.get(templateDocRef);
      if (existingTemplate.exists()) throw new TemplateNameAlreadyExistsError();
      transaction.set(templateDocRef, fullTemplateData);
    });
    return formattedTemplateName;
  } catch (error) {
    console.error('Error adding template data to Firestore:', (error as Error).message);
    throw error;
  }
};

export const fetchTemplatesFromFirestore = async (): Promise<WorkoutTemplate[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const templatesCollectionRef = collection(db, 'workoutTemplates');
    const templatesQuery = query(templatesCollectionRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(templatesQuery);

    if (querySnapshot.empty) {
      console.log('No templates found');
      return [];
    }

    const templates: WorkoutTemplate[] = querySnapshot.docs.map(docSnap => ({
      ...(docSnap.data() as WorkoutTemplate),
      id: docSnap.id,
    }));

    return templates;
  } catch (error) {
    console.error('Error retrieving user templates from Firestore:', (error as Error).message);
    throw error;
  }
};

export const deleteTemplateFromFirestore = async (templateId: string): Promise<boolean> => {
  try {
    if (!templateId) throw new Error('No template ID provided');
    
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    
    const templateRef = doc(db, 'workoutTemplates', templateId);
    
    await deleteDoc(templateRef);
    return true;
  } catch (error) {
    console.error('Error deleting template from Firestore:', (error as Error).message);
    throw error;
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

const CACHE_KEY = 'exercises_cache_v3';
const CACHE_DURATION = 12 * 60 * 60 * 1000;
const IMAGE_CACHE_KEY = 'exercise_images_cache';

type MemoryCache = {
  data: ExerciseGroup[] | null;
  timestamp: number;
  isLoading: boolean;
  loadPromise: Promise<ExerciseGroup[]> | null;
};

let memoryCache: MemoryCache = {
  data: null,
  timestamp: 0,
  isLoading: false,
  loadPromise: null,
};

const imagePrefetchStatus = new Map<string, boolean>();

let customCache: { uid: string | null; data: CatalogExercise[] | null } = { uid: null, data: null };

const fetchCustomExercises = async (uid: string, forceRefresh = false): Promise<CatalogExercise[]> => {
  if (!forceRefresh && customCache.uid === uid && customCache.data) return customCache.data;
  const customQuery = query(collection(db, 'customExercises'), where('uid', '==', uid));
  const snap = await getDocs(customQuery);
  const data = snap.docs.map(d => customDocToExercise(d.data())).filter((x): x is CatalogExercise => x != null);
  customCache = { uid, data };
  return data;
};

export const fetchExercises = async (forceRefresh = false): Promise<ExerciseGroup[]> => {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const [catalog, custom] = await Promise.all([
    loadCatalog(forceRefresh),
    fetchCustomExercises(user.uid, forceRefresh).catch(error => {
      console.warn('Failed to load custom exercises:', (error as Error).message);
      return [];
    }),
  ]);
  return mergeCustomExercises(catalog, custom);
};

const loadCatalog = async (forceRefresh = false): Promise<ExerciseGroup[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    if (
      !forceRefresh &&
      memoryCache.data &&
      memoryCache.data.length > 0 &&
      (Date.now() - memoryCache.timestamp < CACHE_DURATION)
    ) {
      setTimeout(() => prefetchExerciseImages(memoryCache.data), 0);
      return memoryCache.data;
    }

    if (memoryCache.isLoading && memoryCache.loadPromise && !forceRefresh) {
      return await memoryCache.loadPromise;
    }

    if (!forceRefresh) {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp, version = 1 } = JSON.parse(cachedData);
          if (
            version === 3 &&
            Date.now() - timestamp < CACHE_DURATION && 
            data && 
            data.length > 0
          ) {
            memoryCache.data = data;
            memoryCache.timestamp = timestamp;
            
            setTimeout(() => prefetchExerciseImages(data), 0);
            return data;
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error, continuing with fresh fetch:', cacheError);
      }
    }

    memoryCache.isLoading = true;
    memoryCache.loadPromise = fetchExercisesFromFirestore();

    try {
      const exercisesArray = await memoryCache.loadPromise;

      if (exercisesArray && exercisesArray.length > 0) {
        const timestamp = Date.now();
        memoryCache.data = exercisesArray;
        memoryCache.timestamp = timestamp;

        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data: exercisesArray,
            timestamp,
            version: 3
          }));
        } catch (storageError) {
          console.warn('Failed to save cache to storage:', storageError);
        }

        setTimeout(() => prefetchExerciseImages(exercisesArray), 0);

        return exercisesArray;
      }

      throw new Error('No exercises data received');

    } finally {
      memoryCache.isLoading = false;
      memoryCache.loadPromise = null;
    }

  } catch (error) {
    console.error('Error retrieving exercises:', (error as Error).message);
    memoryCache.isLoading = false;
    memoryCache.loadPromise = null;
    throw error;
  }
};

const fetchExercisesFromFirestore = async (): Promise<ExerciseGroup[]> => {
  
  const exercisesCollectionRef = collection(db, 'exercises');
  
  try {
    const querySnapshot = await getDocs(exercisesCollectionRef);
    const exercisesArray: ExerciseGroup[] = [];

    if (!querySnapshot.empty) {
      querySnapshot.forEach(doc => {
        const muscleGroup = doc.id;
        const exercises = (doc.data() as { exercises?: CatalogExercise[] }).exercises || [];

        if (exercises.length > 0) {
          const validExercises = (exercises as CatalogExercise[])
            .filter((exercise: CatalogExercise & { isCustom?: boolean }) => exercise && exercise.name && !exercise.isCustom)
            .sort((a: CatalogExercise, b: CatalogExercise) => a.name.localeCompare(b.name))
            .map((exercise: CatalogExercise) => ({
              name: exercise.name,
              muscleGroup: exercise.muscleGroup || muscleGroup,
              category: exercise.category || 'General',
              imageURL: exercise.imageURL || '',
              equipment: exercise.equipment || 'Bodyweight',
              difficulty: exercise.difficulty || 'Intermediate'
            }));

          if (validExercises.length > 0) {
            exercisesArray.push({
              muscleGroup,
              exercises: validExercises
            });
          }
        }
      });
    }

    exercisesArray.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
    return exercisesArray;

  } catch (firestoreError) {
    console.error('Firestore fetch error:', firestoreError);
    throw new Error(`Failed to fetch exercises: ${(firestoreError as Error).message}`);
  }
};

const prefetchExerciseImages = async (exercisesArray: ExerciseGroup[] | null | undefined): Promise<void> => {
  if (!exercisesArray || !Array.isArray(exercisesArray)) return;

  const imageUrls: string[] = [];
  
  exercisesArray.forEach(group => {
    if (group.exercises && Array.isArray(group.exercises)) {
      group.exercises.forEach(exercise => {
        if (exercise.imageURL && 
            exercise.imageURL.startsWith('http') &&
            !imagePrefetchStatus.has(exercise.imageURL)) {
          imageUrls.push(exercise.imageURL);
        }
      });
    }
  });

  const batchSize = 3;
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    
    setTimeout(() => {
      batch.forEach(async (url) => {
        try {
          imagePrefetchStatus.set(url, true);
          await Image.prefetch(url);
          imagePrefetchStatus.set(url, true);
        } catch (error) {
          imagePrefetchStatus.set(url, false);
          console.warn('Failed to prefetch image:', url);
        }
      });
    }, i * 100);
  }
};

export const clearExercisesCache = async (clearImages = false): Promise<void> => {
  memoryCache.data = null;
  memoryCache.timestamp = 0;
  memoryCache.isLoading = false;
  memoryCache.loadPromise = null;
  
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    
    if (clearImages) {
      imagePrefetchStatus.clear();
      await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

export const prefetchExercises = async (priority: 'low' | 'medium' | 'high' = 'low'): Promise<ExerciseGroup[] | void> => {
  try {
    if (memoryCache.data && 
        (Date.now() - memoryCache.timestamp < CACHE_DURATION)) {
      return memoryCache.data;
    }

    if (priority === 'high') {
      return await fetchExercises(false);
    } else {
      const delay = priority === 'medium' ? 500 : 2000;
      setTimeout(async () => {
        try {
          await fetchExercises(false);
        } catch (error) {
          console.warn('Background exercise prefetch failed:', error);
        }
      }, delay);
    }
  } catch (error) {
    console.warn('Exercise prefetch failed:', error);
  }
};

export const getCacheStatus = (): CacheStatus => {
  return {
    hasMemoryCache: !!memoryCache.data,
    cacheAge: memoryCache.timestamp ? Date.now() - memoryCache.timestamp : 0,
    isLoading: memoryCache.isLoading,
    exerciseCount: memoryCache.data ? (memoryCache.data || []).reduce((count: number, group: ExerciseGroup) => count + group.exercises.length, 0) : 0,
    imagesPrefetched: Array.from(imagePrefetchStatus.values()).filter(status => status === true).length
  };
};

export const createCustomExercise = async (exerciseData: CatalogExercise & { uid?: string }): Promise<{ success: boolean; exercise: Record<string, unknown> }> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const { muscleGroup, name, category, equipment, imageURL, difficulty } = exerciseData;

    if (!muscleGroup || !name) {
      throw new Error('Muscle group and exercise name are required.');
    }

    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    const [catalog, custom] = await Promise.all([
      loadCatalog(false),
      fetchCustomExercises(user.uid, true),
    ]);

    const exerciseExists =
      catalog.some(g => g.muscleGroup === muscleGroup && g.exercises.some(e => e.name.toLowerCase() === lower)) ||
      custom.some(e => e.muscleGroup === muscleGroup && e.name.toLowerCase() === lower);

    if (exerciseExists) {
      throw new Error('An exercise with this name already exists in this muscle group.');
    }

    const newExercise = {
      uid: user.uid,
      name: trimmed,
      muscleGroup,
      category: category || 'General',
      equipment: equipment || 'Bodyweight',
      imageURL: imageURL || '',
      difficulty: difficulty || 'Intermediate',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(collection(db, 'customExercises')), newExercise);

    customCache = { uid: null, data: null };

    return { success: true, exercise: newExercise };

  } catch (error) {
    console.error('Error creating custom exercise:', (error as Error).message);
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

export const updateTemplateInFirestore = async (templateId: string, templateData: Partial<TemplateInput>): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!templateId) {
      throw new Error('Template ID is required for update');
    }

    
    const templateRef = doc(db, 'workoutTemplates', templateId);

    const normalizedTemplateName = templateData.templateName?.trim();
    if (templateData.templateName !== undefined && !normalizedTemplateName) {
      throw new Error('Template name cannot be empty');
    }

    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (normalizedTemplateName !== undefined) updateData['templateName'] = normalizedTemplateName;
    if (templateData.exercises !== undefined) updateData['exercises'] = templateData.exercises;
    if (templateData.note !== undefined) updateData['note'] = templateData.note;
    if (templateData.duration !== undefined) updateData['duration'] = templateData.duration;
    if (templateData.preferredDays !== undefined) updateData['preferredDays'] = templateData.preferredDays;
    if (templateData.workoutType !== undefined) updateData['workoutType'] = templateData.workoutType;

    if (normalizedTemplateName !== undefined) {
      const templatesQuery = query(
        collection(db, 'workoutTemplates'),
        where('uid', '==', user.uid),
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      assertTemplateNameAvailable(templatesSnapshot.docs, normalizedTemplateName, templateId);
    }
    await updateDoc(templateRef, updateData);
    return templateId;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const updateSplitInFirestore = async (splitId: string, splitData: Partial<WorkoutSplit>): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!splitId) {
      throw new Error('Split ID is required for update');
    }

    
    const splitRef = doc(db, 'workoutSplits', splitId);
    
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (splitData.name !== undefined) updateData['name'] = splitData.name;
    if (splitData.description !== undefined) updateData['description'] = splitData.description;
    if (splitData.type !== undefined) updateData['type'] = splitData.type;
    if (splitData.schedule !== undefined) updateData['schedule'] = splitData.schedule;
    if (splitData.durationWeeks !== undefined) updateData['durationWeeks'] = splitData.durationWeeks;

    await updateDoc(splitRef, updateData);
    await clearSplitsCache();
    return splitId;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
};

export const fetchSplitsFromFirestore = async (): Promise<WorkoutSplit[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const uid = user.uid;

    const splitsCollectionRef = collection(db, 'workoutSplits');
    const splitsQuery = query(splitsCollectionRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(splitsQuery);

    if (querySnapshot.empty) {
      console.log('No splits found');
      return [];
    }

    const splits: WorkoutSplit[] = querySnapshot.docs.map(docSnap => ({
      ...(docSnap.data() as WorkoutSplit),
      id: docSnap.id,
    }));

    const templates = await fetchTemplatesFromFirestore();
    const templateMap = new Map(templates.map(tmpl => [tmpl.id, tmpl]));

    splits.forEach(split => {
      const schedule = (split.schedule || {}) as Record<string, Record<string, unknown>>;
      Object.keys(schedule).forEach(day => {
        const dayData = schedule[day] || {};
        const templateId = dayData['templateId'] as string | undefined;
        const template = templateId ? templateMap.get(templateId) : undefined;
        if (template) {
          schedule[day] = {
            ...dayData,
            id: template.id ?? templateId,
            templateName: template.templateName || dayData['templateName'],
            exercises: template.exercises || dayData['exercises'],
            duration: template.duration ?? dayData['duration'],
          };
        }
      });
      split.schedule = schedule;
    });

    return splits;
  } catch (error) {
    console.error('Error fetching user splits from Firestore:', (error as Error).message);
    throw error;
  }
};

export const addSplitToFirestore = async (splitData: WorkoutSplit): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const uid = user.uid;

    const sanitizedSchedule: Record<string, Record<string, unknown>> = {};
    const schedule = (splitData.schedule || {}) as Record<string, Record<string, unknown>>;
    Object.keys(schedule).forEach(day => {
      const dayData = schedule[day] || {};
      sanitizedSchedule[day] = {
        templateId: dayData['templateId'] || 'rest-day',
        templateName: dayData['templateName'] || 'Rest Day',
        exercises: dayData['exercises'] || [],
        duration: dayData['duration'] || '0'
      };
    });

    const splitDataToSave = {
      ...splitData,
      schedule: sanitizedSchedule,
      uid,
      createdAt: serverTimestamp(),
    };

    const splitsCollectionRef = collection(db, 'workoutSplits');
    const splitDocRef = doc(splitsCollectionRef);

    await setDoc(splitDocRef, splitDataToSave);
    await clearSplitsCache();
    return splitDocRef.id;
  } catch (error) {
    console.error('Error saving split to Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateSplitDay = async (splitId: string, day: string, workoutData: Record<string, unknown>): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    const sanitizedWorkoutData = {
      templateId: workoutData['templateId'] || 'rest-day',
      templateName: workoutData['templateName'] || 'Rest Day',
      exercises: workoutData['exercises'] || [],
      duration: workoutData['duration'] || '0'
    };
    
    await updateDoc(splitDocRef, {
      [`schedule.${day}`]: sanitizedWorkoutData,
      lastModified: serverTimestamp()
    });
    
    await clearSplitsCache();
    return true;
  } catch (error) {
    console.error('Error updating split day:', (error as Error).message);
    throw error;
  }
};

export const deleteSplitFromFirestore = async (splitId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    await deleteDoc(splitDocRef);
    await clearSplitsCache();
    return true;
  } catch (error) {
    console.error('Error deleting split from Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateSplitProgress = async (splitId: string, currentWeek: number): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    
    const splitDocRef = doc(db, 'workoutSplits', splitId);
    
    await updateDoc(splitDocRef, {
      currentWeek: currentWeek,
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating split progress:', (error as Error).message);
    throw error;
  }
};

export const getExerciseHistory = async (exerciseName: string, muscleGroup?: string): Promise<DocumentData[]> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated.');

        const workoutsRef = collection(db, 'workoutHistory');
        const workoutQuery = query(
            workoutsRef,
            where('uid', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        const querySnapshot = await getDocs(workoutQuery);

        const sessions: DocumentData[] = [];

        for (const snap of querySnapshot.docs) {
            const data = snap.data() as {
              exercises?: Array<{ exerciseName?: string; muscleGroup?: string; sets?: Array<{ weight?: string | number; reps?: string | number }> }>;
              timestamp?: unknown;
              workoutName?: string;
            };
            const exerciseSets = getExerciseHistorySets(data.exercises || [], exerciseName, muscleGroup);
            if (exerciseSets.length === 0) continue;

            const validSets = exerciseSets.filter(s => {
                const weight = parseFloat(String(s.weight));
                const reps = parseInt(String(s.reps), 10);
                return Number.isFinite(weight) && weight >= 0 && Number.isFinite(reps) && reps > 0;
            });
            if (!validSets.length) continue;

            const bestSet = findBestSet(validSets);
            const best = { ...bestSet, e1rm: bestSet.estimated1RM };

            sessions.push({
                id: snap.id,
                timestamp: data.timestamp,
                workoutName: data.workoutName || 'Workout',
                sets: validSets,
                best,
                totalVolume: validSets.reduce((sum: number, s) =>
                    sum + (parseFloat(String(s.weight)) || 0) * (parseInt(String(s.reps), 10) || 0), 0),
            });
        }

        return sessions;
    } catch (error) {
        console.error('Error fetching exercise history:', (error as Error).message);
        throw error;
    }
};
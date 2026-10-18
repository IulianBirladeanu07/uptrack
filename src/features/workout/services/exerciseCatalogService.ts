import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import { queryClient } from '../../../shared/query/queryClient';
import { customDocToExercise, mergeCustomExercises } from '../utils/exerciseCatalog';
import {
  clearExerciseImagePrefetchStatus,
  EXERCISE_IMAGE_CACHE_KEY,
  getPrefetchedExerciseImageCount,
  prefetchExerciseImages,
} from './exerciseImagePrefetch';
import type { CacheStatus } from '../types';
import type { CatalogExercise, ExerciseGroup } from '../../../shared/types';

const CACHE_KEY = 'exercises_cache_v3';
const CACHE_DURATION = 12 * 60 * 60 * 1000;

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

let customCache: { uid: string | null; data: CatalogExercise[] | null } = { uid: null, data: null };

const fetchCustomExercises = async (uid: string, forceRefresh = false): Promise<CatalogExercise[]> => {
  if (!forceRefresh && customCache.uid === uid && customCache.data) return customCache.data;
  const customQuery = query(collection(db, 'customExercises'), where('uid', '==', uid));
  const snap = await getDocs(customQuery);
  const data = snap.docs.map(document => customDocToExercise(document.data()))
    .filter((exercise): exercise is CatalogExercise => exercise != null);
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
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    if (
      !forceRefresh &&
      memoryCache.data &&
      memoryCache.data.length > 0 &&
      Date.now() - memoryCache.timestamp < CACHE_DURATION
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
            version: 3,
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
      querySnapshot.forEach(document => {
        const muscleGroup = document.id;
        const exercises = (document.data() as { exercises?: CatalogExercise[] }).exercises || [];

        if (exercises.length > 0) {
          const validExercises = exercises
            .filter((exercise: CatalogExercise & { isCustom?: boolean }) =>
              exercise && exercise.name && !exercise.isCustom)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(exercise => ({
              name: exercise.name,
              muscleGroup: exercise.muscleGroup || muscleGroup,
              category: exercise.category || 'General',
              imageURL: exercise.imageURL || '',
              equipment: exercise.equipment || 'Bodyweight',
              difficulty: exercise.difficulty || 'Intermediate',
            }));

          if (validExercises.length > 0) {
            exercisesArray.push({ muscleGroup, exercises: validExercises });
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

export const clearExercisesCache = async (clearImages = false): Promise<void> => {
  memoryCache.data = null;
  memoryCache.timestamp = 0;
  memoryCache.isLoading = false;
  memoryCache.loadPromise = null;

  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    if (clearImages) {
      clearExerciseImagePrefetchStatus();
      await AsyncStorage.removeItem(EXERCISE_IMAGE_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

export const prefetchExercises = async (
  priority: 'low' | 'medium' | 'high' = 'low',
): Promise<ExerciseGroup[] | void> => {
  try {
    if (memoryCache.data && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
      return memoryCache.data;
    }

    if (priority === 'high') {
      return await fetchExercises(false);
    }

    const delay = priority === 'medium' ? 500 : 2000;
    setTimeout(async () => {
      try {
        await fetchExercises(false);
      } catch (error) {
        console.warn('Background exercise prefetch failed:', error);
      }
    }, delay);
  } catch (error) {
    console.warn('Exercise prefetch failed:', error);
  }
};

export const getCacheStatus = (): CacheStatus => ({
  hasMemoryCache: !!memoryCache.data,
  cacheAge: memoryCache.timestamp ? Date.now() - memoryCache.timestamp : 0,
  isLoading: memoryCache.isLoading,
  exerciseCount: memoryCache.data
    ? memoryCache.data.reduce((count, group) => count + group.exercises.length, 0)
    : 0,
  imagesPrefetched: getPrefetchedExerciseImageCount(),
});

export const createCustomExercise = async (
  exerciseData: CatalogExercise & { uid?: string },
): Promise<{ success: boolean; exercise: Record<string, unknown> }> => {
  try {
    const user = getAuth().currentUser;
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
      catalog.some(group => group.muscleGroup === muscleGroup &&
        group.exercises.some(exercise => exercise.name.toLowerCase() === lower)) ||
      custom.some(exercise => exercise.muscleGroup === muscleGroup &&
        exercise.name.toLowerCase() === lower);

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
    await queryClient.invalidateQueries({ queryKey: ['exercise-catalog', user.uid] });
    return { success: true, exercise: newExercise };
  } catch (error) {
    console.error('Error creating custom exercise:', (error as Error).message);
    throw error;
  }
};

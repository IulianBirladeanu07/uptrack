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

const fetchCustomExercises = async (uid: string): Promise<CatalogExercise[]> => {
  const customQuery = query(collection(db, 'customExercises'), where('uid', '==', uid));
  const snap = await getDocs(customQuery);
  const data = snap.docs.map(document => customDocToExercise(document.data()))
    .filter((exercise): exercise is CatalogExercise => exercise != null);
  return data;
};

export const fetchExercises = async (forceRefresh = false): Promise<ExerciseGroup[]> => {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const queryKey = ['exercise-catalog', user.uid] as const;
  return queryClient.fetchQuery({
    queryKey,
    staleTime: forceRefresh ? 0 : CACHE_DURATION,
    queryFn: () => loadExercisesForQuery(user.uid, forceRefresh),
  });
};

export const loadExercisesForQuery = async (uid: string, forceRefresh = false): Promise<ExerciseGroup[]> => {
  const [catalog, custom] = await Promise.all([
    loadCatalog(forceRefresh),
    fetchCustomExercises(uid).catch(error => {
      console.warn('Failed to load custom exercises:', (error as Error).message);
      return [];
    }),
  ]);
  return mergeCustomExercises(catalog, custom);
};

const loadCatalog = async (forceRefresh = false): Promise<ExerciseGroup[]> => {
  try {
    if (!forceRefresh) {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp, version = 1 } = JSON.parse(cachedData);
          if (version === 3 && Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
            setTimeout(() => prefetchExerciseImages(data), 0);
            return data;
          }
        }
      } catch (cacheError) {
        console.warn('Cache read error, continuing with fresh fetch:', cacheError);
      }
    }

    const exercisesArray = await fetchExercisesFromFirestore();
    if (exercisesArray && exercisesArray.length > 0) {
      const timestamp = Date.now();
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
  } catch (error) {
    console.error('Error retrieving exercises:', (error as Error).message);
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
  queryClient.removeQueries({ queryKey: ['exercise-catalog'] });

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

export const getCacheStatus = (): CacheStatus => {
  const uid = getAuth().currentUser?.uid;
  const query = uid ? queryClient.getQueryState<ExerciseGroup[]>(['exercise-catalog', uid]) : undefined;
  const data = queryClient.getQueryData<ExerciseGroup[]>(['exercise-catalog', uid]);
  return {
    hasMemoryCache: !!data,
    cacheAge: query?.dataUpdatedAt ? Date.now() - query.dataUpdatedAt : 0,
    isLoading: query?.fetchStatus === 'fetching',
    exerciseCount: data
      ? data.reduce((count, group) => count + group.exercises.length, 0)
      : 0,
    imagesPrefetched: getPrefetchedExerciseImageCount(),
  };
};

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
      fetchCustomExercises(user.uid),
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
    await queryClient.invalidateQueries({ queryKey: ['exercise-catalog', user.uid] });
    return { success: true, exercise: newExercise };
  } catch (error) {
    console.error('Error creating custom exercise:', (error as Error).message);
    throw error;
  }
};

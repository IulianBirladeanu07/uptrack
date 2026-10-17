jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, name) => name),
  doc: jest.fn((_collection, id) => ({ id: id || 'auto-exercise-id' })),
  getDocs: jest.fn(),
  query: jest.fn(collectionName => `query:${collectionName}`),
  setDoc: jest.fn(),
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));
jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn() } }));

import { getAuth } from 'firebase/auth';
import { getDocs, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearExercisesCache,
  createCustomExercise,
  fetchExercises,
  getCacheStatus,
} from './exerciseCatalogService';

const catalogSnapshot = {
  empty: false,
  forEach: (callback: (document: { id: string; data: () => unknown }) => void) => {
    callback({
      id: 'Chest',
      data: () => ({
        exercises: [
          { name: 'Z Press', imageURL: '', equipment: '', difficulty: '' },
          { name: 'Bench Press', muscleGroup: 'Chest' },
          { name: '', muscleGroup: 'Chest' },
          { name: 'Custom Should Not Be Here', isCustom: true },
        ],
      }),
    });
    callback({
      id: 'Back',
      data: () => ({ exercises: [{ name: 'Row' }] }),
    });
  },
};

describe('exercise catalog service', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    await clearExercisesCache(true);
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockImplementation(async reference => {
      if (reference === 'exercises') return catalogSnapshot;
      if (reference === 'query:customExercises') {
        return {
          docs: [
            { data: () => ({ name: 'Incline Press', muscleGroup: 'Chest' }) },
            { data: () => ({ name: 'Bench Press', muscleGroup: 'Chest' }) },
            { data: () => ({ name: 'Incomplete' }) },
          ],
        };
      }
      return { empty: true, docs: [] };
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches, normalizes, merges, and sorts catalog and custom exercises', async () => {
    await expect(fetchExercises(true)).resolves.toEqual([
      {
        muscleGroup: 'Back',
        exercises: [{
          name: 'Row',
          muscleGroup: 'Back',
          category: 'General',
          imageURL: '',
          equipment: 'Bodyweight',
          difficulty: 'Intermediate',
        }],
      },
      {
        muscleGroup: 'Chest',
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            category: 'General',
            imageURL: '',
            equipment: 'Bodyweight',
            difficulty: 'Intermediate',
          },
          {
            name: 'Incline Press',
            muscleGroup: 'Chest',
            category: 'General',
            imageURL: '',
            equipment: 'Bodyweight',
            difficulty: 'Intermediate',
          },
          {
            name: 'Z Press',
            muscleGroup: 'Chest',
            category: 'General',
            imageURL: '',
            equipment: 'Bodyweight',
            difficulty: 'Intermediate',
          },
        ],
      },
    ]);
    expect(getCacheStatus()).toEqual(expect.objectContaining({
      hasMemoryCache: true,
      exerciseCount: 3,
      isLoading: false,
    }));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'exercises_cache_v3',
      expect.stringContaining('"version":3'),
    );
  });

  it('rejects unauthenticated catalog reads', async () => {
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });

    await expect(fetchExercises()).rejects.toThrow('User not authenticated.');
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('does not write a duplicate custom exercise', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(createCustomExercise({
      name: ' bench press ',
      muscleGroup: 'Chest',
    })).rejects.toThrow('An exercise with this name already exists in this muscle group.');
    expect(setDoc).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

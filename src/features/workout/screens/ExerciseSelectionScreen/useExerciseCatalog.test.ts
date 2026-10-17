import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ExerciseGroup } from '../../../../shared/types';
import { clearExercisesCache, fetchExercises } from '../../services/exerciseCatalogService';
import { useExerciseCatalog } from './useExerciseCatalog';

const mockFocus = {
  trigger: null as (() => void) | null,
};

jest.mock('@react-navigation/native', () => {
  const { useEffect, useRef } = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      const callbackRef = useRef(callback);
      callbackRef.current = callback;
      useEffect(() => {
        mockFocus.trigger = () => callbackRef.current();
        mockFocus.trigger();
        return () => {
          mockFocus.trigger = null;
        };
      }, []);
    },
  };
});
jest.mock('../../services/exerciseCatalogService', () => ({
  clearExercisesCache: jest.fn().mockResolvedValue(undefined),
  fetchExercises: jest.fn(),
}));

const groups: ExerciseGroup[] = [{
  muscleGroup: 'Chest',
  exercises: [{
    name: 'Bench Press',
    muscleGroup: 'Chest',
    category: 'Compound',
    imageURL: '',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
  }],
}];

describe('useExerciseCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocus.trigger = null;
    jest.mocked(fetchExercises).mockResolvedValue(groups);
  });

  it('clears the catalog cache on the first focus and loads exercises', async () => {
    const { result } = renderHook(() => useExerciseCatalog());

    await waitFor(() => expect(result.current.exerciseGroups).toEqual(groups));

    expect(clearExercisesCache).toHaveBeenCalledTimes(1);
    expect(clearExercisesCache).toHaveBeenCalledWith(true);
    expect(fetchExercises).toHaveBeenCalledWith(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('retries a failed load and reports the original error message', async () => {
    jest.mocked(fetchExercises)
      .mockRejectedValueOnce(new Error('catalog unavailable'))
      .mockResolvedValueOnce(groups);
    const { result } = renderHook(() => useExerciseCatalog());

    await waitFor(() => expect(result.current.error).toBe('catalog unavailable'));
    expect(result.current.exerciseGroups).toEqual([]);

    await act(async () => {
      await result.current.loadExercises(true);
    });

    expect(result.current.exerciseGroups).toEqual(groups);
    expect(result.current.error).toBeNull();
    expect(fetchExercises).toHaveBeenNthCalledWith(2, true);
  });

  it('forces a catalog reload on focus after creating an exercise without clearing cache again', async () => {
    const { result } = renderHook(() => useExerciseCatalog());

    await waitFor(() => expect(result.current.exerciseGroups).toEqual(groups));

    act(() => result.current.markCreatedExercise());
    act(() => mockFocus.trigger?.());

    await waitFor(() => expect(fetchExercises).toHaveBeenCalledTimes(2));

    expect(fetchExercises).toHaveBeenNthCalledWith(2, true);
    expect(clearExercisesCache).toHaveBeenCalledTimes(1);
  });

  it('uses a fallback message when a load fails with a non-Error value', async () => {
    jest.mocked(fetchExercises).mockRejectedValue('offline');
    const { result } = renderHook(() => useExerciseCatalog());

    await waitFor(() => expect(result.current.error).toBe('Failed to load exercises'));
    expect(result.current.loading).toBe(false);
  });
});

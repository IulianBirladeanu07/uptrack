import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ExerciseGroup } from '../../../../shared/types';
import { loadExercisesForQuery } from '../../services/exerciseCatalogService';
import { useExerciseCatalog } from './useExerciseCatalog';

jest.mock('../../services/exerciseCatalogService', () => ({
  loadExercisesForQuery: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'user-1' } }),
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
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(loadExercisesForQuery).mockResolvedValue(groups);
    queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: 0, retry: false } },
    });
    wrapper = ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children);
  });

  afterEach(() => queryClient.clear());

  it('loads the catalog through the shared query cache without clearing its persistent cache', async () => {
    const { result } = renderHook(() => useExerciseCatalog(), { wrapper });

    await waitFor(() => expect(result.current.exerciseGroups).toEqual(groups));

    expect(loadExercisesForQuery).toHaveBeenCalledTimes(1);
    expect(loadExercisesForQuery).toHaveBeenCalledWith('user-1');
    expect(queryClient.getQueryData(['exercise-catalog', 'user-1'])).toEqual(groups);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deduplicates simultaneous catalog consumers for the same user', async () => {
    const first = renderHook(() => useExerciseCatalog(), { wrapper });
    const second = renderHook(() => useExerciseCatalog(), { wrapper });

    await waitFor(() => {
      expect(first.result.current.exerciseGroups).toEqual(groups);
      expect(second.result.current.exerciseGroups).toEqual(groups);
    });

    expect(loadExercisesForQuery).toHaveBeenCalledTimes(1);
  });

  it('retries a failed load and reports the original error message', async () => {
    jest.mocked(loadExercisesForQuery)
      .mockRejectedValueOnce(new Error('catalog unavailable'))
      .mockResolvedValueOnce(groups);
    const { result } = renderHook(() => useExerciseCatalog(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('catalog unavailable'));
    expect(result.current.exerciseGroups).toEqual([]);

    await act(async () => {
      await result.current.loadExercises(true);
    });

    await waitFor(() => {
      expect(result.current.exerciseGroups).toEqual(groups);
      expect(result.current.error).toBeNull();
    });
    expect(loadExercisesForQuery).toHaveBeenNthCalledWith(2, 'user-1');
  });

  it('uses a fallback message when a load fails with a non-Error value', async () => {
    jest.mocked(loadExercisesForQuery).mockRejectedValue('offline');
    const { result } = renderHook(() => useExerciseCatalog(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('Failed to load exercises'));
    expect(result.current.loading).toBe(false);
  });
});

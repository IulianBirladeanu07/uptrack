import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { fetchExercises } from '../../services/exerciseCatalogService';

const EXERCISE_CATALOG_STALE_TIME = 12 * 60 * 60 * 1000;

export const useExerciseCatalog = () => {
  const uid = getAuth().currentUser?.uid ?? null;
  const queryKey = useMemo(() => ['exercise-catalog', uid] as const, [uid]);
  const {
    data: exerciseGroups = [],
    error: queryError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchExercises(false),
    enabled: uid !== null,
    staleTime: EXERCISE_CATALOG_STALE_TIME,
  });

  const loadExercises = useCallback(async (isRetry = false) => {
    if (!isRetry) return;
    const result = await refetch();
    if (result.error) throw result.error;
  }, [refetch]);

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load exercises'
    : null;

  return {
    exerciseGroups,
    loading: isLoading || isFetching,
    error,
    loadExercises,
  };
};

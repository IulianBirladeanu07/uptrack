import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { clearExercisesCache, fetchExercises } from '../../services/exerciseCatalogService';
import type { ExerciseGroup } from '../../../../shared/types';

export const useExerciseCatalog = () => {
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasClearedCacheRef = useRef(false);
  const createdExerciseRef = useRef(false);

  const loadExercises = useCallback(async (isRetry = false) => {
    if (!isRetry && exerciseGroups.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExercises(true);
      setExerciseGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [exerciseGroups.length]);

  const markCreatedExercise = useCallback(() => {
    createdExerciseRef.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasClearedCacheRef.current) {
        hasClearedCacheRef.current = true;
        clearExercisesCache(true);
      }
      loadExercises(createdExerciseRef.current);
      createdExerciseRef.current = false;
    }, [loadExercises])
  );

  return { exerciseGroups, loading, error, loadExercises, markCreatedExercise };
};

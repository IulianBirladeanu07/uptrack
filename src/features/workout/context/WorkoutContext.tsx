import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { workoutService } from '../services/WorkoutService';
import { workoutTimer } from '../services/WorkoutTimerService';
import {
  fetchWorkoutHistoryPage,
  WORKOUT_HISTORY_PAGE_SIZE,
} from '../services/workoutHistoryQuery';
import { workoutHistoryQueryKeys } from '../services/workoutQueryKeys';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { PersistedWorkoutState } from '../types';

export type WorkoutContextValue = {
  workoutHistory: Record<string, unknown>[];
  workoutHistoryLoading: boolean;
  workoutHistoryRefreshing: boolean;
  workoutHistoryError: string | null;
  retryWorkoutHistory: () => Promise<void>;
  templates: unknown[];
  activeWorkout: PersistedWorkoutState | null;
  setActiveWorkout: (w: PersistedWorkoutState | null) => void;
  hasMoreWorkoutHistory: boolean;
  loadingMoreWorkoutHistory: boolean;
  workoutHistoryLoadMoreError: string | null;
  loadMoreWorkoutHistory: () => Promise<void>;
  refreshAllData: (immediate?: boolean) => Promise<unknown>;
};

export const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [uid, setUid] = useState<string | null>(() => getAuth().currentUser?.uid ?? null);
  const [activeWorkout, setActiveWorkout] = useState<PersistedWorkoutState | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<{ uid: string; message: string } | null>(null);

  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMoreHistoryRef = useRef<string | null>(null);

  const historyQuery = useInfiniteQuery({
    queryKey: workoutHistoryQueryKeys.infinite(uid ?? '', WORKOUT_HISTORY_PAGE_SIZE),
    queryFn: ({ pageParam }) => {
      if (!uid) throw new Error('User not authenticated.');
      return fetchWorkoutHistoryPage(uid, WORKOUT_HISTORY_PAGE_SIZE, pageParam);
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: lastPage => lastPage.hasMore ? lastPage.lastDocument ?? undefined : undefined,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: uid !== null,
  });

  const templatesQuery = useWorkoutTemplates(uid);

  const workoutHistory = useMemo(
    () => historyQuery.data?.pages.flatMap(page => page.records.map(workout => ({
      ...workout.data,
      id: workout.id,
    }))) ?? [],
    [historyQuery.data],
  );
  const templates = templatesQuery.data ?? [];
  const hasMoreWorkoutHistory = !!historyQuery.hasNextPage;
  const loadingMoreWorkoutHistory = historyQuery.isFetchingNextPage;
  const workoutHistoryLoading = historyQuery.isLoading;
  const workoutHistoryRefreshing = historyQuery.isRefetching;
  const workoutHistoryError = historyQuery.isError && workoutHistory.length === 0
    ? historyQuery.error instanceof Error ? historyQuery.error.message : 'Could not load workout history.'
    : null;
  const workoutHistoryLoadMoreError = loadMoreError?.uid === uid ? loadMoreError.message : null;
  const retryWorkoutHistory = useCallback(async () => {
    await historyQuery.refetch();
  }, [historyQuery.refetch]);

  const checkActiveWorkout = useCallback(async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    try {
      const startTime = workoutService.getStartTime();
      const workout = startTime
        ? {
          startTime,
          exercises: workoutService.getExerciseData(),
          note: workoutService.getWorkoutNote(),
          templateName: workoutService.getWorkoutTemplateName(),
          isActive: true,
          lastSaved: Date.now(),
        }
        : await workoutService.restoreWorkout();
      if (getAuth().currentUser?.uid !== uid || workoutService.uid !== uid) return;
      setActiveWorkout(workout);
    } catch (error) {
      console.error('Error checking active workout:', (error as Error).message);
    }
  }, []);

  const loadMoreWorkoutHistory = useCallback(async () => {
    if (!uid || loadingMoreHistoryRef.current === uid || !historyQuery.hasNextPage) return;
    loadingMoreHistoryRef.current = uid;
    setLoadMoreError(null);
    try {
      const result = await historyQuery.fetchNextPage();
      if (getAuth().currentUser?.uid !== uid) return;
      if (result.isFetchNextPageError) {
        const error = result.error;
        setLoadMoreError({
          uid,
          message: error instanceof Error ? error.message : 'Could not load more workout history.',
        });
      }
    } catch (error) {
      if (getAuth().currentUser?.uid === uid) {
        setLoadMoreError({
          uid,
          message: error instanceof Error ? error.message : 'Could not load more workout history.',
        });
      }
    } finally {
      if (loadingMoreHistoryRef.current === uid) loadingMoreHistoryRef.current = null;
    }
  }, [historyQuery.fetchNextPage, historyQuery.hasNextPage, uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      const uid = user?.uid ?? null;
      if (workoutService.uid !== uid) {
        workoutTimer.stop();
        loadingMoreHistoryRef.current = null;
        setLoadMoreError(null);
        setActiveWorkout(null);
      }
      setUid(uid);
      await workoutService.setUser(uid);
      if ((getAuth().currentUser?.uid ?? null) !== uid) return;
      if (user) {
        checkActiveWorkout();
      } else {
        setActiveWorkout(null);
      }
    });

    return () => unsubscribe();
  }, [checkActiveWorkout]);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, []);

  const refreshAllData = useCallback((immediate = false) => {
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

    const refresh = () => uid
      ? Promise.all([historyQuery.refetch(), templatesQuery.refetch(), checkActiveWorkout()])
      : Promise.resolve([]);

    if (immediate) {
      return refresh();
    }

    return new Promise((resolve) => {
      refreshTimeout.current = setTimeout(() => {
        refresh().then(resolve);
      }, 300);
    });
  }, [checkActiveWorkout, historyQuery.refetch, templatesQuery.refetch, uid]);

  const contextValue = useMemo(
    () => ({
      workoutHistory,
      workoutHistoryLoading,
      workoutHistoryRefreshing,
      workoutHistoryError,
      retryWorkoutHistory,
      hasMoreWorkoutHistory,
      loadingMoreWorkoutHistory,
      workoutHistoryLoadMoreError,
      loadMoreWorkoutHistory,
      templates,
      activeWorkout,
      setActiveWorkout,
      refreshAllData,
    }),
    [
      workoutHistory,
      workoutHistoryLoading,
      workoutHistoryRefreshing,
      workoutHistoryError,
      retryWorkoutHistory,
      hasMoreWorkoutHistory,
      loadingMoreWorkoutHistory,
      workoutHistoryLoadMoreError,
      loadMoreWorkoutHistory,
      templates,
      activeWorkout,
      refreshAllData,
    ],
  );

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

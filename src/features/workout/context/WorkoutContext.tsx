import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fetchTemplatesFromFirestore } from '../services/workoutTemplateService';
import { workoutService } from '../services/WorkoutService';
import { workoutTimer } from '../services/WorkoutTimerService';
import {
  fetchUserWorkoutHistoryPage,
  WORKOUT_HISTORY_PAGE_SIZE,
} from '../services/workoutHistoryQuery';
import type { PersistedWorkoutState } from '../types';

export type WorkoutContextValue = {
  workoutHistory: Record<string, unknown>[];
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
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, unknown>[]>([]);
  const [hasMoreWorkoutHistory, setHasMoreWorkoutHistory] = useState(false);
  const [loadingMoreWorkoutHistory, setLoadingMoreWorkoutHistory] = useState(false);
  const [workoutHistoryLoadMoreError, setWorkoutHistoryLoadMoreError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<PersistedWorkoutState | null>(null);

  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyPageRef = useRef(0);
  const historyGenerationRef = useRef(0);
  const loadingMoreHistoryRef = useRef(false);

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

  const fetchWorkoutHistory = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const historyGeneration = ++historyGenerationRef.current;
      loadingMoreHistoryRef.current = false;
      setLoadingMoreWorkoutHistory(false);
      setWorkoutHistoryLoadMoreError(null);
      const history = await fetchUserWorkoutHistoryPage(uid, WORKOUT_HISTORY_PAGE_SIZE, 0);
      if (
        getAuth().currentUser?.uid !== uid ||
        historyGenerationRef.current !== historyGeneration
      ) return;
      historyPageRef.current = 0;
      setWorkoutHistory(history.records.map(workout => ({
        ...workout.data,
        id: workout.id,
      })));
      setHasMoreWorkoutHistory(history.hasMore);
    } catch (error) {
      console.error('Error fetching workout history:', (error as Error).message);
    }
  }, []);

  const loadMoreWorkoutHistory = useCallback(async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid || loadingMoreHistoryRef.current || !hasMoreWorkoutHistory) return;
    loadingMoreHistoryRef.current = true;
    setLoadingMoreWorkoutHistory(true);
    setWorkoutHistoryLoadMoreError(null);
    const historyGeneration = historyGenerationRef.current;
    const nextPageIndex = historyPageRef.current + 1;
    try {
      const page = await fetchUserWorkoutHistoryPage(uid, WORKOUT_HISTORY_PAGE_SIZE, nextPageIndex);
      if (
        getAuth().currentUser?.uid !== uid ||
        historyGenerationRef.current !== historyGeneration
      ) return;
      historyPageRef.current = nextPageIndex;
      setWorkoutHistory(previous => [
        ...previous,
        ...page.records.map(workout => ({ ...workout.data, id: workout.id })),
      ]);
      setHasMoreWorkoutHistory(page.hasMore);
    } catch (error) {
      console.error('Error loading more workout history:', (error as Error).message);
      setWorkoutHistoryLoadMoreError(
        error instanceof Error ? error.message : 'Could not load more workout history.',
      );
    } finally {
      if (historyGenerationRef.current === historyGeneration) {
        loadingMoreHistoryRef.current = false;
        setLoadingMoreWorkoutHistory(false);
      }
    }
  }, [hasMoreWorkoutHistory]);

  const fetchTemplates = useCallback(async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    try {
      const fetchedTemplates = await fetchTemplatesFromFirestore();
      if (getAuth().currentUser?.uid !== uid || workoutService.uid !== uid) return;
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', (error as Error).message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      const uid = user?.uid ?? null;
      if (workoutService.uid !== uid) {
        workoutTimer.stop();
        historyGenerationRef.current++;
        historyPageRef.current = 0;
        loadingMoreHistoryRef.current = false;
        setWorkoutHistory([]);
        setHasMoreWorkoutHistory(false);
        setLoadingMoreWorkoutHistory(false);
        setWorkoutHistoryLoadMoreError(null);
        setTemplates([]);
        setActiveWorkout(null);
      }
      await workoutService.setUser(uid);
      if ((getAuth().currentUser?.uid ?? null) !== uid) return;
      if (user) {
        fetchWorkoutHistory();
        fetchTemplates();
        checkActiveWorkout();
      } else {
        setWorkoutHistory([]);
        setTemplates([]);
        setActiveWorkout(null);
      }
    });

    return () => unsubscribe();
  }, [fetchWorkoutHistory, fetchTemplates, checkActiveWorkout]);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, []);

  const refreshAllData = useCallback((immediate = false) => {
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

    if (immediate) {
      return Promise.all([fetchWorkoutHistory(), fetchTemplates(), checkActiveWorkout()]);
    }

    return new Promise((resolve) => {
      refreshTimeout.current = setTimeout(() => {
        Promise.all([fetchWorkoutHistory(), fetchTemplates(), checkActiveWorkout()]).then(resolve);
      }, 300);
    });
  }, [fetchWorkoutHistory, fetchTemplates, checkActiveWorkout]);

  const contextValue = useMemo(
    () => ({
      workoutHistory,
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

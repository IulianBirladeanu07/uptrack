import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { fetchTemplatesFromFirestore } from '../handlers/WorkoutHandler';
import { workoutService } from '../services/WorkoutService';
import type { PersistedWorkoutState } from '../types';

type UserSettings = {
  targetCalories: number;
  targetProtein: number;
  targetFats: number;
  targetCarbs: number;
};

export type WorkoutContextValue = {
  workoutHistory: Record<string, unknown>[];
  templates: unknown[];
  activeWorkout: PersistedWorkoutState | null;
  setActiveWorkout: (w: PersistedWorkoutState | null) => void;
  refreshAllData: (immediate?: boolean) => Promise<unknown>;
  userSettings: UserSettings;
  setUserSettings: (settings: Partial<UserSettings>) => void;
};

export const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<PersistedWorkoutState | null>(null);
  const [userSettings, setUserSettingsState] = useState<UserSettings>({
    targetCalories: 2000,
    targetProtein: 150,
    targetFats: 70,
    targetCarbs: 250,
  });

  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUserSettings = useCallback((settings: Partial<UserSettings>) => {
    setUserSettingsState(prev => ({ ...prev, ...settings }));
  }, []);

  const checkActiveWorkout = useCallback(async () => {
    try {
      const workout = await workoutService.restoreWorkout();
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
      const workoutRef = collection(db, 'workoutHistory');
      const workoutQuery = query(workoutRef, where('uid', '==', uid), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(workoutQuery);
      setWorkoutHistory(querySnapshot.docs.map(docSnap => docSnap.data()));
    } catch (error) {
      console.error('Error fetching workout history:', (error as Error).message);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const fetchedTemplates = await fetchTemplatesFromFirestore();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', (error as Error).message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      await workoutService.setUser(user ? user.uid : null);
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
      templates,
      activeWorkout,
      setActiveWorkout,
      refreshAllData,
      userSettings,
      setUserSettings,
    }),
    [workoutHistory, templates, activeWorkout, refreshAllData, userSettings, setUserSettings],
  );

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

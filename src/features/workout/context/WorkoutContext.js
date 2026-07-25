import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { fetchTemplatesFromFirestore } from '../handlers/WorkoutHandler';
import { workoutService } from '../services/WorkoutService';

export const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [userSettings, setUserSettingsState] = useState({
        targetCalories: 2000,
        targetProtein: 150,
        targetFats: 70,
        targetCarbs: 250,
    });

    const refreshTimeout = useRef(null);

    const setUserSettings = useCallback((settings) => {
        setUserSettingsState(prev => ({ ...prev, ...settings }));
    }, []);

    const checkActiveWorkout = useCallback(async () => {
        try {
            const workout = await workoutService.restoreWorkout();
            setActiveWorkout(workout);
        } catch (error) {
            console.error('Error checking active workout:', error.message);
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
            setWorkoutHistory(querySnapshot.docs.map(doc => doc.data()));
        } catch (error) {
            console.error('Error fetching workout history:', error.message);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        try {
            const fetchedTemplates = await fetchTemplatesFromFirestore();
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error('Error fetching templates:', error.message);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
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

    const contextValue = useMemo(() => ({
        workoutHistory,
        templates,
        activeWorkout,
        setActiveWorkout,
        refreshAllData,
        userSettings,
        setUserSettings,
    }), [workoutHistory, templates, activeWorkout, refreshAllData, userSettings, setUserSettings]);

    return (
        <WorkoutContext.Provider value={contextValue}>
            {children}
        </WorkoutContext.Provider>
    );
};
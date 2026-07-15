import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { countWorkoutsThisWeek, getLastWorkout, fetchTemplatesFromFirestore } from '../handlers/WorkoutHandler';
import { workoutService } from '../services/WorkoutService';

export const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
    const [lastWorkout, setLastWorkout] = useState(null);
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
        const workout = await workoutService.restoreWorkout();
        setActiveWorkout(workout);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                setWorkoutsThisWeek(0);
                setLastWorkout(null);
                return;
            }
            const [workoutCount, lastWorkoutData] = await Promise.all([
                countWorkoutsThisWeek(),
                getLastWorkout(),
            ]);
            setWorkoutsThisWeek(workoutCount);
            setLastWorkout(lastWorkoutData);
        } catch (error) {
            console.error('Error refreshing data:', error.message);
        }
    }, []);

    const fetchWorkoutHistory = useCallback(async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;
        const workoutRef = collection(db, 'workoutHistory');
        const workoutQuery = query(workoutRef, where('uid', '==', uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(workoutQuery);
        setWorkoutHistory(querySnapshot.docs.map(doc => doc.data()));
    }, []);

    const fetchTemplates = useCallback(async () => {
        const fetchedTemplates = await fetchTemplatesFromFirestore();
        setTemplates(fetchedTemplates);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            if (user) {
                fetchData();
                fetchWorkoutHistory();
                fetchTemplates();
                checkActiveWorkout();
            } else {
                setWorkoutsThisWeek(0);
                setLastWorkout(null);
                setWorkoutHistory([]);
                setTemplates([]);
                setActiveWorkout(null);
            }
        });

        return () => unsubscribe();
    }, [fetchData, fetchWorkoutHistory, fetchTemplates, checkActiveWorkout]);

    const refreshAllData = useCallback(() => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        refreshTimeout.current = setTimeout(() => {
            fetchData();
            fetchWorkoutHistory();
            fetchTemplates();
            checkActiveWorkout();
        }, 300);
    }, [fetchData, fetchWorkoutHistory, fetchTemplates, checkActiveWorkout]);

    const contextValue = useMemo(() => ({
        workoutsThisWeek,
        lastWorkout,
        workoutHistory,
        templates,
        activeWorkout,
        setActiveWorkout,
        refreshAllData,
        userSettings,
        setUserSettings,
    }), [workoutsThisWeek, lastWorkout, workoutHistory, templates, activeWorkout, refreshAllData, userSettings, setUserSettings]);

    return (
        <WorkoutContext.Provider value={contextValue}>
            {children}
        </WorkoutContext.Provider>
    );
};
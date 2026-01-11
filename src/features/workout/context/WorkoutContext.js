import React, { createContext, useState, useEffect, useCallback } from 'react';
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

    const setUserSettings = (settings) => {
        setUserSettingsState((prevSettings) => ({
            ...prevSettings,
            ...settings,
        }));
    };

    const checkActiveWorkout = useCallback(async () => {
        const workout = await workoutService.restoreWorkout();
        setActiveWorkout(workout);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const workoutCount = await countWorkoutsThisWeek();
                const lastWorkoutData = await getLastWorkout();
                setWorkoutsThisWeek(workoutCount);
                setLastWorkout(lastWorkoutData);
            } else {
                setWorkoutsThisWeek(0);
                setLastWorkout(null);
            }
        } catch (error) {
            console.error('Error refreshing data:', error.message);
        }
    }, []);

    const fetchWorkoutHistory = useCallback(async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            console.error('User not authenticated.');
            return;
        }

        const uid = user.uid;
        const workoutRef = collection(db, 'workoutHistory');
        const workoutQuery = query(workoutRef, where('uid', '==', uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(workoutQuery);

        const workoutList = querySnapshot.docs.map((doc) => doc.data());
        setWorkoutHistory(workoutList);
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
        fetchData();
        fetchWorkoutHistory();
        fetchTemplates();
        checkActiveWorkout();
    }, [fetchData, fetchWorkoutHistory, fetchTemplates, checkActiveWorkout]);

    return (
        <WorkoutContext.Provider
            value={{
                workoutsThisWeek,
                lastWorkout,
                workoutHistory,
                templates,
                activeWorkout,
                refreshAllData,
                userSettings,
                setUserSettings,
            }}
        >
            {children}
        </WorkoutContext.Provider>
    );
};
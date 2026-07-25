import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../../auth/context/AuthContext';
import GoogleFitStepDisplay from '../../../shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay';

import {
    writeMealType, consolidateFoodData, buildAddUndo, applyAddUndo, fetchLast30DaysMeals,
} from '../services/mealService';
import { getLocalWeekStart } from '../helpers/weightTrackerUtils';
import { getRollingWeekStats, checkAndCompleteLearning, calculateLearningStats, checkAndRunWeeklyEval, checkAndBackfillStepsBonus } from '../helpers/learningCompletionService';
import useDailyNutrition from '../helpers/useDailyNutrition';
import MealCache from './cache/MealCache';
import { formatDate } from '../utils/dateUtils';

const MEAL_CACHE_KEY_PREFIX = 'meal_cache_v2_';
const MEAL_CACHE_TTL        = 30 * 60 * 1000;
const MEAL_TYPES            = ['breakfast', 'lunch', 'dinner', 'snacks'];
const REQUIRED_LEARNING_DAYS = 7;

const FoodContext = createContext();

export const useFoodContext = () => {
    const context = useContext(FoodContext);
    if (!context) throw new Error('useFoodContext must be used within a FoodProvider');
    return context;
};

const persistMealCache = async (uid, meals) => {
    try {
        await AsyncStorage.setItem(
            `${MEAL_CACHE_KEY_PREFIX}${uid}`,
            JSON.stringify({ meals, ts: Date.now() })
        );
    } catch {}
};

const loadPersistedMealCache = async (uid) => {
    try {
        const raw = await AsyncStorage.getItem(`${MEAL_CACHE_KEY_PREFIX}${uid}`);
        if (!raw) return null;
        const { meals, ts } = JSON.parse(raw);
        if (Date.now() - ts > MEAL_CACHE_TTL) return null;
        return meals;
    } catch {
        return null;
    }
};

const clearPersistedMealCache = async (uid) => {
    try {
        await AsyncStorage.removeItem(`${MEAL_CACHE_KEY_PREFIX}${uid}`);
    } catch {}
};

const getCurrentWeekRollingStats = (mealCache, weightIns) => {
    if (!mealCache) return { avgCalories: 0, avgSteps: 0, avgWeight: null };

    const today        = new Date();
    const weekStartStr = getLocalWeekStart(today);
    const [sy, sm, sd] = weekStartStr.split('-').map(Number);
    const weekStartDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const todayEnd      = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const nutritionStats = getRollingWeekStats(mealCache, weekStartDate, todayEnd);

    const weekEntry      = weightIns?.find(w => w.weekStart === weekStartStr);
    const avgWeight      = weekEntry?.average ?? null;
    const daysLoggedWeight = weekEntry?.days
        ? Object.values(weekEntry.days).filter(w => w != null && !isNaN(w)).length
        : 0;

    return {
        avgCalories:         nutritionStats.avgCalories,
        avgProtein:          nutritionStats.avgProtein,
        avgCarbs:            nutritionStats.avgCarbs,
        avgFats:             nutritionStats.avgFats,
        avgSteps:            nutritionStats.avgSteps,
        avgWeight,
        daysLoggedNutrition: nutritionStats.daysLoggedNutrition,
        daysLoggedSteps:     nutritionStats.daysLoggedSteps,
        daysLoggedWeight,
    };
};

const buildCategoryData = (cache) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allDays = cache.getDateRange(thirtyDaysAgo, new Date());

    const recentMeals = allDays
        .flatMap(({ date, meals }) =>
            MEAL_TYPES
                .filter(mealType => (meals[mealType] || []).length > 0)
                .map(mealType => ({
                    id:            `${date}_${mealType}`,
                    date,
                    mealType,
                    foods:         meals[mealType],
                    totalCalories: meals[mealType].reduce((s, f) => s + (Number(f.calories) || 0), 0),
                }))
        )
        .reverse()
        .slice(0, 30);

    const foodUsageMap = new Map();
    allDays.forEach(({ date, meals }) => {
        MEAL_TYPES.forEach(mealType => {
            (meals[mealType] || []).forEach(food => {
                const key = `${food.id}_${mealType}`;
                if (!foodUsageMap.has(key)) {
                    foodUsageMap.set(key, { ...food, mealType, usageCount: 0, lastUsed: date });
                }
                const entry = foodUsageMap.get(key);
                entry.usageCount += 1;
                if (date > entry.lastUsed) entry.lastUsed = date;
            });
        });
    });

    const frequentFoods = Array.from(foodUsageMap.values())
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 50);

    return { recentMeals, frequentFoods, favoriteFoods: [] };
};

export const FoodProvider = ({ children, initialUserData }) => {
    const [currentUser,         setCurrentUser]         = useState(null);
    const [selectedDate,        setSelectedDate]        = useState(new Date());
    const [userProfile,         setUserProfile]         = useState(initialUserData || null);
    const [loading,             setLoading]             = useState(false);
    const [error,               setError]               = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [dailySteps,          setDailySteps]          = useState(0);
    const [stepsVersion,        setStepsVersion]        = useState(0);
    const [stepsLoading,        setStepsLoading]        = useState(false);
    const [stepsError,          setStepsError]          = useState(null);
    const [stepsConnected,      setStepsConnected]      = useState(null);
    const [cacheVersion,        setCacheVersion]        = useState(0);
    const [categoryData,        setCategoryData]        = useState({
        recentMeals: [], frequentFoods: [], favoriteFoods: []
    });

    const [mealState, setMealState] = useState({
        breakfast: [], lunch: [], dinner: [], snacks: []
    });

    const initializationRef = useRef(false);
    const mealCache         = useRef(new MealCache());
    const mountedRef        = useRef(true);
    const operationQueues   = useRef(new Map());
    const selectedDateRef   = useRef(selectedDate);
    const stepsDisplayRef   = useRef(null);
    const stepsBonusCheckedRef = useRef(false);
    const currentUserRef    = useRef(null);

    const { userData, refreshUserData } = useContext(AuthContext);

    useEffect(() => {
        selectedDateRef.current = selectedDate;
    }, [selectedDate]);

    const nutritionHookData = useDailyNutrition(
        mealState.breakfast, mealState.lunch, mealState.dinner, mealState.snacks
    );

    const enhancedLearningData = useMemo(() => {
        if (nutritionHookData.hasTargets) {
            return {
                daysLogged: REQUIRED_LEARNING_DAYS,
                weeklyAvgCalories: userData?.maintenanceCalories || 0,
                isLearningComplete: true,
            };
        }
        const learningStats = calculateLearningStats(mealCache.current, selectedDate, REQUIRED_LEARNING_DAYS);
        return {
            daysLogged:         learningStats.daysLogged,
            weeklyAvgCalories:  learningStats.averages.calories,
            isLearningComplete: learningStats.isComplete,
            averages:           learningStats.averages,
        };
    }, [nutritionHookData.hasTargets, userData, selectedDate, mealState]);

    const remainingCalories = useMemo(() => {
        const target   = nutritionHookData.userMacros?.targetCalories || 2000;
        const consumed = nutritionHookData.dailyNutrition?.calories || 0;
        return Math.max(0, target - consumed);
    }, [nutritionHookData.userMacros?.targetCalories, nutritionHookData.dailyNutrition?.calories]);

    const rollingWeekStats = useMemo(() =>
        getCurrentWeekRollingStats(mealCache.current, userData?.weightIns),
    [cacheVersion, stepsVersion, userData?.weightIns]);

    useEffect(() => {
        const id = setTimeout(() => {
            if (mountedRef.current) {
                setCategoryData(buildCategoryData(mealCache.current));
            }
        }, 0);
        return () => clearTimeout(id);
    }, [cacheVersion]);

    useEffect(() => {
        if (!mountedRef.current) return;
        const key = formatDate(selectedDateRef.current);
        setDailySteps(mealCache.current.getSteps(key));
    }, [stepsVersion, selectedDate]);

    const getCaloriesForDateRange = useCallback((startDate, endDate) =>
        mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => ({
            date,
            calories: Object.values(meals ?? {}).flat().reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
        })),
    []);

    useEffect(() => { return () => { mountedRef.current = false; }; }, []);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        if (mountedRef.current) setError(`Failed to ${context}. Please try again.`);
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => { if (mountedRef.current) setError(null); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const executeWithLock = useCallback((key, operation) => {
        const previous = operationQueues.current.get(key) || Promise.resolve();
        const run = previous.then(operation, operation);
        operationQueues.current.set(key, run.catch(() => {}));
        return run;
    }, []);

    const updateMealState = useCallback((mealType, foods, dateKey) => {
        if (!mountedRef.current) return;
        const key = dateKey || formatDate(selectedDateRef.current);
        mealCache.current.updateMealType(key, mealType, foods);
        if (key === formatDate(selectedDateRef.current)) {
            setMealState(prev => ({ ...prev, [mealType]: foods }));
        }
        setCacheVersion(v => v + 1);
    }, []);

    const updateDailySteps = useCallback((steps, dateKey) => {
        if (!mountedRef.current) return;
        const key = dateKey || formatDate(selectedDateRef.current);
        mealCache.current.setSteps(key, steps);
        setStepsVersion(v => v + 1);
    }, []);

    const handleStepsError = useCallback((errorCode) => {
        if (!mountedRef.current) return;
        setStepsError(errorCode);
    }, []);

    const handleStepsLoading = useCallback((isLoading) => {
        if (!mountedRef.current) return;
        setStepsLoading(isLoading);
    }, []);

    const handleStepsConnectedChange = useCallback((connected) => {
        if (!mountedRef.current) return;
        setStepsConnected(connected);
    }, []);

    const retryStepsConnection = useCallback(() => {
        stepsDisplayRef.current?.retry?.();
    }, []);

    const getWeeklyAvgSteps = useCallback(() => {
        const endDate   = new Date(selectedDateRef.current);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        const data          = mealCache.current.getStepsRange(startDate, endDate);
        const todayKey      = formatDate(selectedDateRef.current);
        const isToday       = todayKey === formatDate(new Date());
        const completedDays = isToday ? data.filter(d => d.date !== todayKey) : data;
        const total         = completedDays.reduce((sum, d) => sum + d.steps, 0);
        return completedDays.length > 0 ? Math.round(total / completedDays.length) : 0;
    }, []);

    const getNutritionForDateRange = useCallback((startDate, endDate) =>
        mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => {
            const foods = Object.values(meals ?? {}).flat();
            return {
                date,
                calories: foods.reduce((s, f) => s + (Number(f?.calories) || 0), 0),
                protein:  foods.reduce((s, f) => s + (Number(f?.protein)  || 0), 0),
                carbs:    foods.reduce((s, f) => s + (Number(f?.carbohydrates) || 0), 0),
                fat:      foods.reduce((s, f) => s + (Number(f?.fats)     || 0), 0),
            };
        }),
    []);

    const getStepsForDateRange = useCallback((startDate, endDate) =>
        mealCache.current.getStepsRange(startDate, endDate),
    []);

    const getMealCache = useCallback(() => mealCache.current, []);

    const serializeCacheForPersist = useCallback(() =>
        Array.from(mealCache.current.data.entries()).flatMap(([date, meals]) =>
            Object.entries(meals).map(([mealType, foods]) => ({ date, mealType, foods }))
        ),
    []);

    const showSaveFailedAlert = useCallback(() => {
        Alert.alert("Couldn't save", 'Check your connection and try again.');
    }, []);

    const handleAddMeal = useCallback(async (mealType, foods, mealDate) => {
        if (!currentUser || !mealType || !foods?.length) throw new Error('Invalid meal parameters');
        const dateKey = formatDate(mealDate || selectedDateRef.current);
        const uid     = currentUser.uid;

        const existing     = mealCache.current.get(dateKey)[mealType];
        const consolidated = consolidateFoodData(existing, foods);
        const undoSpecs     = buildAddUndo(existing, foods);

        updateMealState(mealType, consolidated, dateKey);
        persistMealCache(uid, serializeCacheForPersist());

        const operationKey = `${dateKey}-${mealType}`;
        try {
            await executeWithLock(operationKey, () => writeMealType(uid, mealType, consolidated, dateKey));
            return consolidated;
        } catch (error) {
            handleError(error, 'add meal');
            if (mountedRef.current) {
                const currentArray = mealCache.current.get(dateKey)[mealType];
                const rolledBack   = applyAddUndo(currentArray, undoSpecs);
                updateMealState(mealType, rolledBack, dateKey);
                persistMealCache(uid, serializeCacheForPersist());
            }
            showSaveFailedAlert();
            throw error;
        }
    }, [currentUser, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const handleDeleteMeal = useCallback(async (mealType, foodId) => {
        if (!currentUser || !mealType || !foodId) return false;
        const dateKey = formatDate(selectedDateRef.current);
        const uid     = currentUser.uid;

        const existing    = mealCache.current.get(dateKey)[mealType];
        const deletedItem = existing.find(f => f.id === foodId);
        if (!deletedItem) return false;
        const updated = existing.filter(f => f.id !== foodId);

        updateMealState(mealType, updated, dateKey);
        persistMealCache(uid, serializeCacheForPersist());

        const operationKey = `${dateKey}-${mealType}`;
        try {
            await executeWithLock(operationKey, () => writeMealType(uid, mealType, updated, dateKey));
            return true;
        } catch (error) {
            handleError(error, 'delete meal item');
            if (mountedRef.current) {
                const currentArray = mealCache.current.get(dateKey)[mealType];
                if (!currentArray.some(f => f.id === foodId)) {
                    updateMealState(mealType, [...currentArray, deletedItem], dateKey);
                    persistMealCache(uid, serializeCacheForPersist());
                }
            }
            showSaveFailedAlert();
            return false;
        }
    }, [currentUser, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const updateMealInDatabase = useCallback(async (mealType, foodId, updatedFoodDetails) => {
        if (!currentUser || !mealType || !foodId || !updatedFoodDetails) throw new Error('Invalid update parameters');
        const dateKey = formatDate(selectedDateRef.current);
        const uid     = currentUser.uid;

        const existing     = mealCache.current.get(dateKey)[mealType];
        const previousItem = existing.find(f => f.id === foodId);
        if (!previousItem) throw new Error('Food item not found');

        const updated = existing.map(f =>
            f.id === foodId ? { ...updatedFoodDetails, id: foodId, usageCount: f.usageCount || 1 } : f
        );

        updateMealState(mealType, updated, dateKey);
        persistMealCache(uid, serializeCacheForPersist());

        const operationKey = `${dateKey}-${mealType}`;
        try {
            await executeWithLock(operationKey, () => writeMealType(uid, mealType, updated, dateKey));
        } catch (error) {
            handleError(error, 'update meal item');
            if (mountedRef.current) {
                const currentArray = mealCache.current.get(dateKey)[mealType];
                if (currentArray.some(f => f.id === foodId)) {
                    const restored = currentArray.map(f => f.id === foodId ? previousItem : f);
                    updateMealState(mealType, restored, dateKey);
                    persistMealCache(uid, serializeCacheForPersist());
                }
            }
            showSaveFailedAlert();
            throw error;
        }
    }, [currentUser, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const updateCurrentDayMeals = useCallback((date) => {
        if (!mountedRef.current) return;
        const dateKey  = formatDate(date);
        const dayMeals = mealCache.current.get(dateKey);
        setMealState({
            breakfast: dayMeals.breakfast || [],
            lunch:     dayMeals.lunch     || [],
            dinner:    dayMeals.dinner    || [],
            snacks:    dayMeals.snacks    || [],
        });
    }, []);

    const handleDateChange = useCallback((date) => {
        setSelectedDate(date);
        updateCurrentDayMeals(date);
    }, [updateCurrentDayMeals]);

    const initializeAppData = useCallback(async (user) => {
        if (initializationRef.current || !mountedRef.current) return;
        initializationRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const cachedMeals = await loadPersistedMealCache(user.uid);

            if (cachedMeals && mountedRef.current) {
                mealCache.current.buildFromMeals(cachedMeals);
                setUserProfile(initialUserData);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                setInitialLoadComplete(true);
            }

            const last30DaysMeals = await fetchLast30DaysMeals(user.uid);

            if (mountedRef.current) {
                setUserProfile(initialUserData);
                mealCache.current.buildFromMeals(last30DaysMeals);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                if (!cachedMeals) setInitialLoadComplete(true);

                persistMealCache(user.uid, last30DaysMeals);

                setTimeout(async () => {
                    if (!mountedRef.current) return;
                    if (initialUserData) {
                        const adjustment = await checkAndRunWeeklyEval(user.uid, initialUserData, mealCache.current);
                        if (adjustment && mountedRef.current) {
                            setUserProfile(prev => ({ ...prev, ...adjustment }));
                            await refreshUserData();
                        }
                    }
                }, 1000);
            }
        } catch (err) {
            console.error('[FoodContext] init failed:', err);
            if (mountedRef.current) {
                handleError(err, 'load application data');
                initializationRef.current = false;
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [initialUserData, updateCurrentDayMeals, handleError, refreshUserData]);

    useEffect(() => {
        const checkLearningCompletion = async () => {
            if (currentUser && enhancedLearningData.isLearningComplete && !nutritionHookData.hasTargets) {
                try {
                    const newTargets = await checkAndCompleteLearning(
                        currentUser.uid, mealCache.current, selectedDate, nutritionHookData.hasTargets
                    );
                    if (newTargets) setUserProfile(prev => ({ ...prev, ...newTargets }));
                } catch (error) {
                    console.error('Failed to complete learning phase:', error);
                    handleError(error, 'complete learning phase');
                }
            }
        };
        checkLearningCompletion();
    }, [currentUser, enhancedLearningData.isLearningComplete, nutritionHookData.hasTargets, selectedDate, handleError]);

    useEffect(() => {
        if (!currentUser || !stepsConnected || !userData || stepsBonusCheckedRef.current) return;
        stepsBonusCheckedRef.current = true;

        const runStepsBonusBackfill = async () => {
            try {
                const result = await checkAndBackfillStepsBonus(
                    currentUser.uid, userData, mealCache.current, new Date()
                );
                if (result && mountedRef.current) {
                    setUserProfile(prev => ({ ...prev, ...result }));
                    await refreshUserData();
                }
            } catch (error) {
                console.error('Failed to backfill steps bonus:', error);
            }
        };
        runStepsBonusBackfill();
    }, [currentUser, stepsConnected, userData, refreshUserData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!mountedRef.current) return;
            const previousUser = currentUserRef.current;
            currentUserRef.current = user;
            setCurrentUser(user);
            if (user && !initializationRef.current) {
                initializeAppData(user);
            } else if (!user) {
                if (previousUser) clearPersistedMealCache(previousUser.uid);
                initializationRef.current = false;
                stepsBonusCheckedRef.current = false;
                mealCache.current.clear();
                setCategoryData({ recentMeals: [], frequentFoods: [], favoriteFoods: [] });
                setUserProfile(null);
                setMealState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
                setDailySteps(0);
                setStepsVersion(0);
                setStepsLoading(false);
                setStepsError(null);
                setStepsConnected(null);
                setCacheVersion(0);
                setError(null);
                setLoading(false);
                setInitialLoadComplete(false);
            }
        });
        return () => unsubscribe();
    }, [initializeAppData]);

    const getTrendData = useCallback((days = 7) => {
        const endDate   = new Date(selectedDateRef.current);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days + 1);
        const daily   = mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => ({
            date,
            calories: Object.values(meals ?? {}).flat().reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
        }));
        const total   = daily.reduce((sum, d) => sum + d.calories, 0);
        const average = daily.length ? total / daily.length : 0;
        return { daily, total, average };
    }, []);

    const contextValue = useMemo(() => ({
        breakfastFoods:   mealState.breakfast,
        lunchFoods:       mealState.lunch,
        dinnerFoods:      mealState.dinner,
        snacksFoods:      mealState.snacks,
        selectedDate,
        setSelectedDate:  handleDateChange,
        recentMeals:      categoryData.recentMeals,
        frequentFoods:    categoryData.frequentFoods,
        favoriteFoods:    categoryData.favoriteFoods,
        userProfile,
        hasTargets:       nutritionHookData.hasTargets,
        learningData:     enhancedLearningData,
        remainingCalories,
        dailyNutrition:   nutritionHookData.dailyNutrition,
        userMacros:       nutritionHookData.userMacros,
        handleAddMeal,
        addMultipleFoods: handleAddMeal,
        handleDeleteMeal,
        updateMealInDatabase,
        updateFoods:      updateMealState,
        getTrendData,
        dailySteps,
        updateDailySteps,
        getWeeklyAvgSteps,
        loading,
        error,
        initialLoadComplete,
        rollingWeekStats,
        getCaloriesForDateRange,
        getNutritionForDateRange,
        getStepsForDateRange,
        getMealCache,
        stepsLoading,
        stepsError,
        stepsConnected,
        retryStepsConnection,
    }), [
        mealState, selectedDate, handleDateChange, categoryData,
        userProfile, nutritionHookData.hasTargets, enhancedLearningData,
        remainingCalories, nutritionHookData.dailyNutrition, nutritionHookData.userMacros,
        handleAddMeal, handleDeleteMeal, updateMealInDatabase, updateMealState,
        getTrendData, dailySteps, updateDailySteps, getWeeklyAvgSteps,
        loading, error, initialLoadComplete, rollingWeekStats, getCaloriesForDateRange,
        getNutritionForDateRange, getStepsForDateRange, getMealCache, stepsLoading, stepsError,
        stepsConnected, retryStepsConnection,
    ]);

    return (
        <FoodContext.Provider value={contextValue}>
            <GoogleFitStepDisplay
                ref={stepsDisplayRef}
                onStepsUpdate={updateDailySteps}
                onStepsError={handleStepsError}
                onStepsLoading={handleStepsLoading}
                onConnectedChange={handleStepsConnectedChange}
            />
            {children}
        </FoodContext.Provider>
    );
};

export default FoodProvider;
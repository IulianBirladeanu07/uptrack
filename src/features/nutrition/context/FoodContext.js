import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../../auth/context/AuthContext';
import GoogleFitStepDisplay from '../../../shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay';

import { addMeal, deleteMealItem, updateMealItem, fetchLast30DaysMeals } from '../services/mealService';
import { getLocalWeekStart } from '../helpers/weightTrackerUtils';
import { getRollingWeekStats, checkAndCompleteLearning, calculateLearningStats, checkAndRunWeeklyEval, hasEnoughDataForAdjustment } from '../helpers/learningCompletionService';
import useDailyNutrition from '../helpers/useDailyNutrition';
import MealCache from './cache/MealCache';
import { formatDate } from '../utils/dateUtils';

const MEAL_CACHE_KEY_PREFIX = 'meal_cache_v2_';
const MEAL_CACHE_TTL        = 30 * 60 * 1000;
const MEAL_TYPES            = ['breakfast', 'lunch', 'dinner', 'snacks'];

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
    const [currentUser,          setCurrentUser]          = useState(null);
    const [selectedDate,         setSelectedDate]         = useState(new Date());
    const [userProfile,          setUserProfile]          = useState(initialUserData || null);
    const [loading,              setLoading]              = useState(false);
    const [error,                setError]                = useState(null);
    const [initialLoadComplete,  setInitialLoadComplete]  = useState(false);
    const [dailySteps,           setDailySteps]           = useState(0);
    const [stepsVersion,         setStepsVersion]         = useState(0);
    const [cacheVersion,         setCacheVersion]         = useState(0);

    const [mealState, setMealState] = useState({
        breakfast: [], lunch: [], dinner: [], snacks: []
    });

    const [categoryData, setCategoryData] = useState({
        recentMeals: [], frequentFoods: [], favoriteFoods: []
    });

    const initializationRef = useRef(false);
    const mealCache         = useRef(new MealCache());
    const mountedRef        = useRef(true);
    const pendingOps        = useRef(new Set());

    const { userData, refreshUserData } = useContext(AuthContext);

    const nutritionHookData = useDailyNutrition(
        mealState.breakfast, mealState.lunch, mealState.dinner, mealState.snacks,
        selectedDate, userProfile
    );

    const enhancedLearningData = useMemo(() => {
        if (nutritionHookData.hasTargets) return nutritionHookData.learningData;
        const learningStats = calculateLearningStats(mealCache.current, selectedDate, nutritionHookData.REQUIRED_LEARNING_DAYS);
        return {
            daysLogged:          learningStats.daysLogged,
            weeklyAvgCalories:   learningStats.averages.calories,
            isLearningComplete:  learningStats.isComplete,
            averages:            learningStats.averages,
        };
    }, [nutritionHookData, selectedDate, mealState]);

    const remainingCalories = useMemo(() => {
        const target   = nutritionHookData.userMacros?.targetCalories || 2000;
        const consumed = nutritionHookData.dailyNutrition?.calories || 0;
        return Math.max(0, target - consumed);
    }, [nutritionHookData.userMacros?.targetCalories, nutritionHookData.dailyNutrition?.calories]);

    const rollingWeekStats = useMemo(() =>
        getCurrentWeekRollingStats(mealCache.current, userData?.weightIns),
    [cacheVersion, stepsVersion, userData?.weightIns]);

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

    const executeWithLock = useCallback(async (key, operation) => {
        if (pendingOps.current.has(key)) {
            console.warn(`Operation ${key} already in progress`);
            return null;
        }
        pendingOps.current.add(key);
        try {
            return await operation();
        } finally {
            pendingOps.current.delete(key);
        }
    }, []);

    const updateMealState = useCallback((mealType, foods) => {
        if (!mountedRef.current) return;
        const dateKey = formatDate(selectedDate);
        setMealState(prev => ({ ...prev, [mealType]: foods }));
        mealCache.current.updateMealType(dateKey, mealType, foods);
        setCategoryData(buildCategoryData(mealCache.current));
        setCacheVersion(v => v + 1);
    }, [selectedDate]);

    const updateDailySteps = useCallback((steps, dateKey) => {
        if (!mountedRef.current) return;
        const key = dateKey || formatDate(selectedDate);
        mealCache.current.setSteps(key, steps);
        if (key === formatDate(selectedDate)) setDailySteps(steps);
        setStepsVersion(v => v + 1);
    }, [selectedDate]);

    const getWeeklyAvgSteps = useCallback(() => {
        const endDate   = new Date(selectedDate);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        const data           = mealCache.current.getStepsRange(startDate, endDate);
        const todayKey       = formatDate(selectedDate);
        const isToday        = todayKey === formatDate(new Date());
        const completedDays  = isToday ? data.filter(d => d.date !== todayKey) : data;
        const total          = completedDays.reduce((sum, d) => sum + d.steps, 0);
        return completedDays.length > 0 ? Math.round(total / completedDays.length) : 0;
    }, [selectedDate]);

    const getNutritionForDateRange = useCallback((startDate, endDate) =>
        mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => {
            const foods = Object.values(meals ?? {}).flat();
            return {
                date,
                calories: foods.reduce((s, f) => s + (Number(f?.calories) || 0), 0),
                protein:  foods.reduce((s, f) => s + (Number(f?.protein)  || 0), 0),
                carbs:    foods.reduce((s, f) => s + (Number(f?.carbs)    || 0), 0),
                fat:      foods.reduce((s, f) => s + (Number(f?.fat)      || 0), 0),
            };
        }),
    []);

    const getStepsForDateRange = useCallback((startDate, endDate) =>
        mealCache.current.getStepsRange(startDate, endDate),
    []);

    const serializeCacheForPersist = useCallback(() =>
        Array.from(mealCache.current.data.entries()).flatMap(([date, meals]) =>
            Object.entries(meals).map(([mealType, foods]) => ({ date, mealType, foods }))
        ),
    []);

    const handleAddMeal = useCallback(async (mealType, foods, mealDate) => {
        if (!currentUser || !mealType || !foods?.length) throw new Error('Invalid meal parameters');
        const formattedDate  = formatDate(mealDate || selectedDate);
        const operationKey   = `add-meal-${formattedDate}-${mealType}`;
        return executeWithLock(operationKey, async () => {
            try {
                const consolidatedFoods = await addMeal(currentUser.uid, mealType, foods, formattedDate);
                if (mountedRef.current) {
                    updateMealState(mealType, consolidatedFoods);
                    persistMealCache(currentUser.uid, serializeCacheForPersist());
                }
                return consolidatedFoods;
            } catch (error) {
                handleError(error, 'add meal');
                throw error;
            }
        });
    }, [currentUser, selectedDate, updateMealState, executeWithLock, handleError, serializeCacheForPersist]);

    const handleDeleteMeal = useCallback(async (mealType, foodId) => {
        if (!currentUser || !mealType || !foodId) return false;
        const formattedDate = formatDate(selectedDate);
        const operationKey  = `delete-meal-${formattedDate}-${mealType}-${foodId}`;
        return executeWithLock(operationKey, async () => {
            try {
                const updatedFoods = await deleteMealItem(currentUser.uid, mealType, foodId, formattedDate);
                if (mountedRef.current) {
                    updateMealState(mealType, updatedFoods);
                    persistMealCache(currentUser.uid, serializeCacheForPersist());
                }
                return true;
            } catch (error) {
                handleError(error, 'delete meal item');
                return false;
            }
        }) || false;
    }, [currentUser, selectedDate, updateMealState, executeWithLock, handleError, serializeCacheForPersist]);

    const updateMealInDatabase = useCallback(async (mealType, foodId, updatedFoodDetails) => {
        if (!currentUser || !mealType || !foodId || !updatedFoodDetails) throw new Error('Invalid update parameters');
        const formattedDate = formatDate(selectedDate);
        const operationKey  = `update-meal-${formattedDate}-${mealType}-${foodId}`;
        return executeWithLock(operationKey, async () => {
            try {
                const updatedFoods = await updateMealItem(currentUser.uid, mealType, foodId, updatedFoodDetails, formattedDate);
                if (mountedRef.current) {
                    updateMealState(mealType, updatedFoods);
                    persistMealCache(currentUser.uid, serializeCacheForPersist());
                }
            } catch (error) {
                handleError(error, 'update meal item');
                throw error;
            }
        });
    }, [currentUser, selectedDate, updateMealState, executeWithLock, handleError, serializeCacheForPersist]);

    const updateCurrentDayMeals = useCallback((date) => {
        if (!mountedRef.current) return;
        const dateKey  = formatDate(date);
        const dayMeals = mealCache.current.get(dateKey);
        const daySteps = mealCache.current.getSteps(dateKey);
        setMealState({
            breakfast: dayMeals.breakfast || [],
            lunch:     dayMeals.lunch     || [],
            dinner:    dayMeals.dinner    || [],
            snacks:    dayMeals.snacks    || [],
        });
        setDailySteps(daySteps);
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

        const t0 = Date.now();
        console.log('[FoodContext] init start');

        try {
            const tCacheStart = Date.now();
            const cachedMeals = await loadPersistedMealCache(user.uid);
            console.log(`[FoodContext] cache read: ${Date.now() - tCacheStart}ms, hit=${!!cachedMeals}`);

            if (cachedMeals && mountedRef.current) {
                mealCache.current.buildFromMeals(cachedMeals);
                setUserProfile(initialUserData);
                updateCurrentDayMeals(new Date());
                setCategoryData(buildCategoryData(mealCache.current));
                setCacheVersion(v => v + 1);
                setInitialLoadComplete(true);
                console.log(`[FoodContext] initialLoadComplete from cache: ${Date.now() - t0}ms`);
            }

            const tFirestore = Date.now();
            const last30DaysMeals = await fetchLast30DaysMeals(user.uid);
            console.log(`[FoodContext] fetchLast30DaysMeals: ${Date.now() - tFirestore}ms, docs=${last30DaysMeals.length}`);

            if (mountedRef.current) {
                setUserProfile(initialUserData);
                mealCache.current.buildFromMeals(last30DaysMeals);
                updateCurrentDayMeals(new Date());
                setCategoryData(buildCategoryData(mealCache.current));
                setCacheVersion(v => v + 1);
                if (!cachedMeals) setInitialLoadComplete(true);
                console.log(`[FoodContext] initialLoadComplete from firestore: ${Date.now() - t0}ms`);

                persistMealCache(user.uid, last30DaysMeals);

                setTimeout(async () => {
                    if (!mountedRef.current) return;
                    if (initialUserData && hasEnoughDataForAdjustment(initialUserData)) {
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
            if (mountedRef.current) {
                setLoading(false);
                console.log(`[FoodContext] init complete: ${Date.now() - t0}ms total`);
            }
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!mountedRef.current) return;
            setCurrentUser(user);
            if (user && !initializationRef.current) {
                initializeAppData(user);
            } else if (!user) {
                if (currentUser) clearPersistedMealCache(currentUser.uid);
                initializationRef.current = false;
                mealCache.current.clear();
                setCategoryData({ recentMeals: [], frequentFoods: [], favoriteFoods: [] });
                setUserProfile(null);
                setMealState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
                setDailySteps(0);
                setStepsVersion(0);
                setCacheVersion(0);
                setError(null);
                setLoading(false);
                setInitialLoadComplete(false);
            }
        });
        return () => unsubscribe();
    }, [initializeAppData]);

    const getTrendData = useCallback((days = 7) => {
        const endDate   = new Date(selectedDate);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days + 1);
        const daily   = mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => ({
            date,
            calories: Object.values(meals ?? {}).flat().reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
        }));
        const total   = daily.reduce((sum, d) => sum + d.calories, 0);
        const average = daily.length ? total / daily.length : 0;
        return { daily, total, average };
    }, [selectedDate]);

    const contextValue = useMemo(() => ({
        breakfastFoods:    mealState.breakfast,
        lunchFoods:        mealState.lunch,
        dinnerFoods:       mealState.dinner,
        snacksFoods:       mealState.snacks,
        selectedDate,
        setSelectedDate:   handleDateChange,
        recentMeals:       categoryData.recentMeals,
        frequentFoods:     categoryData.frequentFoods,
        favoriteFoods:     categoryData.favoriteFoods,
        userProfile,
        hasTargets:        nutritionHookData.hasTargets,
        learningData:      enhancedLearningData,
        remainingCalories,
        dailyNutrition:    nutritionHookData.dailyNutrition,
        userMacros:        nutritionHookData.userMacros,
        handleAddMeal,
        handleDeleteMeal,
        updateMealInDatabase,
        updateFoods:       updateMealState,
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
    }), [
        mealState, selectedDate, handleDateChange, categoryData,
        userProfile, nutritionHookData.hasTargets, enhancedLearningData,
        remainingCalories, nutritionHookData.dailyNutrition, nutritionHookData.userMacros,
        handleAddMeal, handleDeleteMeal, updateMealInDatabase, updateMealState,
        getTrendData, dailySteps, updateDailySteps, getWeeklyAvgSteps,
        loading, error, initialLoadComplete, rollingWeekStats, getCaloriesForDateRange,
        getNutritionForDateRange, getStepsForDateRange,
    ]);

    return (
        <FoodContext.Provider value={contextValue}>
            <GoogleFitStepDisplay onStepsUpdate={updateDailySteps} />
            {children}
        </FoodContext.Provider>
    );
};

export default FoodProvider;
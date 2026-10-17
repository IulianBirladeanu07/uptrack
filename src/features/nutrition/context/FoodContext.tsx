import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { auth } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../../auth/context/AuthContext';
import StepDisplay from '../../../shared/components/StepDisplay/StepDisplay';
import type { StepDisplayHandle } from '../../../shared/components/StepDisplay/StepDisplay';

import {
    writeMealType, consolidateFoodData, buildAddUndo, applyAddUndo, fetchLast30DaysMeals, fetchRawMealsForDate,
} from '../services/mealService';
import { getLocalWeekStart } from '../helpers/weightTrackerUtils';
import { getRollingWeekStats, checkAndCompleteLearning, calculateLearningStats, checkAndRunWeeklyEval, checkAndBackfillStepsBonus } from '../helpers/learningCompletionService';
import useDailyNutrition from '../helpers/useDailyNutrition';
import MealCache from './cache/MealCache';
import {
    clearPersistedMealCache,
    loadPersistedMealCache,
    persistMealCache,
} from './cache/mealCacheStorage';
import { AsyncOperationQueue } from './AsyncOperationQueue';
import { buildCategoryData } from './categoryData';
import { loadSelectedDateMeals } from './selectedDateMealLoad';
import { formatDate } from '../utils/dateUtils';
import { isCurrentUserRequest } from '../utils/userRequest';
import { diffSteps, persistDailySteps, restorePendingSteps } from '../helpers/stepsSyncService';
import type { User } from 'firebase/auth';
import type {
    DailySteps, DateInput, EnhancedLearningData, FoodCategories, FoodDetailFood, LoggedFood,
    MealGroup, MealType, MealsByType, NutritionTotals, UserData, WeightInWeek,
} from '../../../shared/types';

const REQUIRED_LEARNING_DAYS = 7;

type DayCalories = { date: string; calories: number };

export type FoodContextValue = {
    breakfastFoods:           LoggedFood[];
    lunchFoods:               LoggedFood[];
    dinnerFoods:              LoggedFood[];
    snacksFoods:              LoggedFood[];
    selectedDate:             Date;
    setSelectedDate:          (date: Date) => void;
    recentMeals:              FoodCategories['recentMeals'];
    frequentFoods:            FoodCategories['frequentFoods'];
    favoriteFoods:            FoodCategories['favoriteFoods'];
    userProfile:              Partial<UserData> | null;
    hasTargets:               boolean;
    learningData:             EnhancedLearningData;
    remainingCalories:        number;
    dailyNutrition:           NutritionTotals;
    userMacros:               ReturnType<typeof useDailyNutrition>['userMacros'];
    handleAddMeal:            (mealType: MealType, foods: LoggedFood[], mealDate?: DateInput) => Promise<LoggedFood[]>;
    addMultipleFoods:         (mealType: MealType, foods: LoggedFood[], mealDate?: DateInput) => Promise<LoggedFood[]>;
    handleDeleteMeal:         (mealType: MealType, foodId: string) => Promise<boolean>;
    updateMealInDatabase:     (mealType: MealType, foodId: string, updatedFoodDetails: FoodDetailFood) => Promise<void>;
    getTrendData:             (days?: number) => { daily: DayCalories[]; total: number; average: number };
    dailySteps:               number;
    updateDailySteps:         (steps: number, dateKey?: string) => void;
    getWeeklyAvgSteps:        () => number;
    loading:                  boolean;
    error:                    string | null;
    initialLoadComplete:      boolean;
    initializationError:      string | null;
    retryInitialization:      () => void;
    rollingWeekStats:         ReturnType<typeof getCurrentWeekRollingStats>;
    getCaloriesForDateRange:  (startDate: DateInput, endDate: DateInput) => DayCalories[];
    getNutritionForDateRange: (startDate: DateInput, endDate: DateInput) => ({ date: string } & NutritionTotals)[];
    getStepsForDateRange:     (startDate: DateInput, endDate: DateInput) => { date: string; steps: number }[];
    getMealCache:             () => MealCache;
    stepsLoading:             boolean;
    stepsError:               string | null;
    stepsConnected:           boolean | null;
    retryStepsConnection:     () => void;
};

const FoodContext = createContext<FoodContextValue | undefined>(undefined);

export const useFoodContext = () => {
    const context = useContext(FoodContext);
    if (!context) throw new Error('useFoodContext must be used within a FoodProvider');
    return context;
};

const getCurrentWeekRollingStats = (mealCache: MealCache | null, weightIns?: WeightInWeek[]) => {
    if (!mealCache) return { avgCalories: 0, avgSteps: 0, avgWeight: null, prevAvgWeight: null };

    const today        = new Date();
    const weekStartStr = getLocalWeekStart(today);
    const [sy, sm, sd] = weekStartStr.split('-').map(Number);
    const weekStartDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const todayEnd      = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const nutritionStats = getRollingWeekStats(mealCache, weekStartDate, todayEnd);

    const prevWeekDate   = new Date(sy, sm - 1, sd - 7);
    const prevWeekStr    = getLocalWeekStart(prevWeekDate);
    const weekEntry      = weightIns?.find(w => w.weekStart === weekStartStr);
    const prevWeekEntry  = weightIns?.find(w => w.weekStart === prevWeekStr);
    const avgWeight      = weekEntry?.average ?? null;
    const prevAvgWeight  = prevWeekEntry?.average ?? null;
    const daysLoggedWeight = weekEntry?.days
        ? Object.values(weekEntry.days).filter(w => w != null && !isNaN(Number(w))).length
        : 0;

    return {
        avgCalories:         nutritionStats.avgCalories,
        avgProtein:          nutritionStats.avgProtein,
        avgCarbs:            nutritionStats.avgCarbs,
        avgFats:             nutritionStats.avgFats,
        avgSteps:            nutritionStats.avgSteps,
        avgWeight,
        prevAvgWeight,
        daysLoggedNutrition: nutritionStats.daysLoggedNutrition,
        daysLoggedSteps:     nutritionStats.daysLoggedSteps,
        daysLoggedWeight,
    };
};

export const FoodProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser,         setCurrentUser]         = useState<User | null>(null);
    const [selectedDate,        setSelectedDate]        = useState(new Date());
    const [userProfile,         setUserProfile]         = useState<Partial<UserData> | null>(null);
    const [loading,             setLoading]             = useState(false);
    const [error,               setError]               = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [initializationError, setInitializationError] = useState<string | null>(null);
    const [freshMealsLoaded,    setFreshMealsLoaded]    = useState(false);
    const [dailySteps,          setDailySteps]          = useState(0);
    const [stepsVersion,        setStepsVersion]        = useState(0);
    const [stepsLoading,        setStepsLoading]        = useState(false);
    const [stepsError,          setStepsError]          = useState<string | null>(null);
    const [stepsConnected,      setStepsConnected]      = useState<boolean | null>(null);
    const [cacheVersion,        setCacheVersion]        = useState(0);
    const [categoryData,        setCategoryData]        = useState<FoodCategories>({
        recentMeals: [], frequentFoods: [], favoriteFoods: []
    });

    const [mealState, setMealState] = useState<MealsByType>({
        breakfast: [], lunch: [], dinner: [], snacks: []
    });

    const initializationRef = useRef(false);
    const userGenerationRef = useRef(0);
    const mealCache         = useRef(new MealCache());
    const mountedRef        = useRef(true);
    const operationQueue    = useRef(new AsyncOperationQueue());
    const selectedDateRef   = useRef(selectedDate);
    const stepsDisplayRef   = useRef<StepDisplayHandle | null>(null);
    const stepsBonusCheckedRef = useRef(false);
    const weeklyEvalCheckedRef = useRef(false);
    const currentUserRef    = useRef<User | null>(null);
    const pendingStepsRef   = useRef<DailySteps>({});
    const writtenStepsRef   = useRef<DailySteps>({});
    const flushingStepsRef  = useRef<number | null>(null);
    const userDataRef       = useRef<UserData | null>(null);

    const { userData, refreshUserData } = useContext(AuthContext)!;

    useEffect(() => {
        selectedDateRef.current = selectedDate;
    }, [selectedDate]);

    const nutritionHookData = useDailyNutrition(
        mealState.breakfast, mealState.lunch, mealState.dinner, mealState.snacks
    );

    const enhancedLearningData = useMemo<EnhancedLearningData>(() => {
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

    const getCaloriesForDateRange = useCallback((startDate: DateInput, endDate: DateInput) =>
        mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => ({
            date,
            calories: Object.values(meals ?? {}).flat().reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
        })),
    []);

    useEffect(() => { return () => { mountedRef.current = false; }; }, []);

    const handleError = useCallback((error: unknown, context: string) => {
        console.error(`Error in ${context}:`, error);
        if (mountedRef.current) setError(`Failed to ${context}. Please try again.`);
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => { if (mountedRef.current) setError(null); }, 5000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [error]);

    const executeWithLock = useCallback(<T,>(key: string, operation: () => Promise<T>): Promise<T> => {
        return operationQueue.current.run(key, operation);
    }, []);

    const updateMealState = useCallback((mealType: MealType, foods: LoggedFood[], dateKey?: string) => {
        if (!mountedRef.current) return;
        const key = dateKey || formatDate(selectedDateRef.current);
        mealCache.current.updateMealType(key, mealType, foods);
        if (key === formatDate(selectedDateRef.current)) {
            setMealState(prev => ({ ...prev, [mealType]: foods }));
        }
        setCacheVersion(v => v + 1);
    }, []);

    const updateDailySteps = useCallback((steps: number, dateKey?: string) => {
        if (!mountedRef.current) return;
        const key = dateKey || formatDate(selectedDateRef.current);
        mealCache.current.setSteps(key, steps);
        setStepsVersion(v => v + 1);
    }, []);

    const flushSteps = useCallback(async () => {
        const uid = currentUserRef.current?.uid;
        const ud  = userDataRef.current;
        const generation = userGenerationRef.current;
        if (!uid || !ud || (ud.uid && ud.uid !== uid) || flushingStepsRef.current === generation) return;
        const incoming = pendingStepsRef.current;
        if (!Object.keys(incoming).length) return;
        const stored  = { ...(ud.dailySteps || {}), ...writtenStepsRef.current };
        const toWrite = diffSteps(stored, incoming, formatDate(new Date()));
        pendingStepsRef.current = {};
        if (!Object.keys(toWrite).length) return;
        flushingStepsRef.current = generation;
        try {
            await persistDailySteps(uid, toWrite);
            if (isCurrentUserRequest({ uid, generation }, currentUserRef.current?.uid, userGenerationRef.current)) {
                writtenStepsRef.current = { ...writtenStepsRef.current, ...toWrite };
            }
        } catch (e) {
            if (isCurrentUserRequest({ uid, generation }, currentUserRef.current?.uid, userGenerationRef.current)) {
                pendingStepsRef.current = restorePendingSteps(toWrite, pendingStepsRef.current);
                console.error('persistDailySteps error:', e);
            }
        } finally {
            if (flushingStepsRef.current === generation) flushingStepsRef.current = null;
        }
    }, []);

    const handleStepsHistory = useCallback((entries: DailySteps) => {
        pendingStepsRef.current = { ...pendingStepsRef.current, ...entries };
        flushSteps();
    }, [flushSteps]);

    useEffect(() => {
        userDataRef.current = userData;
        flushSteps();
    }, [userData, currentUser, flushSteps]);

    const handleStepsError = useCallback((errorCode: string | null) => {
        if (!mountedRef.current) return;
        setStepsError(errorCode);
    }, []);

    const handleStepsLoading = useCallback((isLoading: boolean) => {
        if (!mountedRef.current) return;
        setStepsLoading(isLoading);
    }, []);

    const handleStepsConnectedChange = useCallback((connected: boolean) => {
        if (!mountedRef.current) return;
        setStepsConnected(connected);
    }, []);

    const retryStepsConnection = useCallback(() => {
        flushSteps();
        stepsDisplayRef.current?.retry?.();
    }, [flushSteps]);

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

    const getNutritionForDateRange = useCallback((startDate: DateInput, endDate: DateInput) =>
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

    const getStepsForDateRange = useCallback((startDate: DateInput, endDate: DateInput) =>
        mealCache.current.getStepsRange(startDate, endDate),
    []);

    const getMealCache = useCallback(() => mealCache.current, []);

    const serializeCacheForPersist = useCallback((): MealGroup[] =>
        Array.from(mealCache.current.data.entries()).flatMap(([date, meals]) =>
            (Object.entries(meals) as [MealType, LoggedFood[]][]).map(([mealType, foods]) => ({ date, mealType, foods }))
        ),
    []);

    const showSaveFailedAlert = useCallback(() => {
        Alert.alert("Couldn't save", 'Check your connection and try again.');
    }, []);

    const ensureDayLoaded = useCallback(async (dateKey: string, uid: string) => {
        if (mealCache.current.has(dateKey)) return;
        const day = await fetchRawMealsForDate(uid, dateKey);
        if (
            !mountedRef.current ||
            currentUserRef.current?.uid !== uid ||
            mealCache.current.has(dateKey)
        ) return;
        mealCache.current.set(dateKey, day);
    }, []);

    const handleAddMeal = useCallback(async (mealType: MealType, foods: LoggedFood[], mealDate?: DateInput): Promise<LoggedFood[]> => {
        if (!currentUser || !mealType || !foods?.length) throw new Error('Invalid meal parameters');
        const dateKey = formatDate(mealDate || selectedDateRef.current);
        const uid     = currentUser.uid;

        try {
            await ensureDayLoaded(dateKey, uid);
            if (currentUserRef.current?.uid !== uid) {
                throw new Error('The signed-in user changed while loading meals.');
            }
        } catch (error) {
            if (currentUserRef.current?.uid === uid) {
                handleError(error, 'load meals');
                showSaveFailedAlert();
            }
            throw error;
        }

        const operationKey = `${uid}-${dateKey}-${mealType}`;
        try {
            return await executeWithLock(operationKey, async () => {
                if (!mountedRef.current || currentUserRef.current?.uid !== uid) {
                    throw new Error('The signed-in user changed before the meal could be saved.');
                }
                const existing = mealCache.current.get(dateKey)[mealType];
                const consolidated = consolidateFoodData(existing, foods);
                const undoSpecs = buildAddUndo(existing, foods);
                updateMealState(mealType, consolidated, dateKey);
                persistMealCache(uid, serializeCacheForPersist());
                try {
                    await writeMealType(uid, mealType, consolidated, dateKey);
                    return consolidated;
                } catch (error) {
                    if (mountedRef.current && currentUserRef.current?.uid === uid) {
                        const currentArray = mealCache.current.get(dateKey)[mealType];
                        const rolledBack = applyAddUndo(currentArray, undoSpecs);
                        updateMealState(mealType, rolledBack, dateKey);
                        persistMealCache(uid, serializeCacheForPersist());
                    }
                    throw error;
                }
            });
        } catch (error) {
            if (currentUserRef.current?.uid === uid) handleError(error, 'add meal');
            if (currentUserRef.current?.uid === uid) showSaveFailedAlert();
            throw error;
        }
    }, [currentUser, ensureDayLoaded, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const handleDeleteMeal = useCallback(async (mealType: MealType, foodId: string): Promise<boolean> => {
        if (!currentUser || !mealType || !foodId) return false;
        const dateKey = formatDate(selectedDateRef.current);
        const uid     = currentUser.uid;

        const operationKey = `${uid}-${dateKey}-${mealType}`;
        try {
            return await executeWithLock(operationKey, async () => {
                if (!mountedRef.current || currentUserRef.current?.uid !== uid) return false;
                const existing = mealCache.current.get(dateKey)[mealType];
                if (!existing.some(food => food.id === foodId)) return false;
                const updated = existing.filter(food => food.id !== foodId);
                updateMealState(mealType, updated, dateKey);
                persistMealCache(uid, serializeCacheForPersist());
                try {
                    await writeMealType(uid, mealType, updated, dateKey);
                    return true;
                } catch (error) {
                    if (mountedRef.current && currentUserRef.current?.uid === uid) {
                        updateMealState(mealType, existing, dateKey);
                        persistMealCache(uid, serializeCacheForPersist());
                    }
                    throw error;
                }
            });
        } catch (error) {
            if (currentUserRef.current?.uid === uid) handleError(error, 'delete meal item');
            if (currentUserRef.current?.uid === uid) showSaveFailedAlert();
            return false;
        }
    }, [currentUser, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const updateMealInDatabase = useCallback(async (mealType: MealType, foodId: string, updatedFoodDetails: FoodDetailFood): Promise<void> => {
        if (!currentUser || !mealType || !foodId || !updatedFoodDetails) throw new Error('Invalid update parameters');
        const dateKey = formatDate(selectedDateRef.current);
        const uid     = currentUser.uid;

        const operationKey = `${uid}-${dateKey}-${mealType}`;
        try {
            await executeWithLock(operationKey, async () => {
                if (!mountedRef.current || currentUserRef.current?.uid !== uid) {
                    throw new Error('The signed-in user changed before the meal could be saved.');
                }
                const existing = mealCache.current.get(dateKey)[mealType];
                const previousItem = existing.find(food => food.id === foodId);
                if (!previousItem) throw new Error('Food item not found');
                const updated = existing.map(food =>
                    food.id === foodId ? { ...updatedFoodDetails, id: foodId, usageCount: food.usageCount || 1 } : food
                );
                updateMealState(mealType, updated, dateKey);
                persistMealCache(uid, serializeCacheForPersist());
                try {
                    await writeMealType(uid, mealType, updated, dateKey);
                } catch (error) {
                    if (mountedRef.current && currentUserRef.current?.uid === uid) {
                        const currentArray = mealCache.current.get(dateKey)[mealType];
                        if (currentArray.some(food => food.id === foodId)) {
                            updateMealState(mealType, existing, dateKey);
                            persistMealCache(uid, serializeCacheForPersist());
                        }
                    }
                    throw error;
                }
            });
        } catch (error) {
            if (currentUserRef.current?.uid === uid) handleError(error, 'update meal item');
            if (currentUserRef.current?.uid === uid) showSaveFailedAlert();
            throw error;
        }
    }, [currentUser, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const updateCurrentDayMeals = useCallback((date: DateInput) => {
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

    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
        updateCurrentDayMeals(date);
        const uid     = currentUserRef.current?.uid;
        const dateKey = formatDate(date);
        if (!uid || mealCache.current.has(dateKey)) return;
        void loadSelectedDateMeals(
            () => ensureDayLoaded(dateKey, uid),
            () =>
                mountedRef.current &&
                currentUserRef.current?.uid === uid &&
                formatDate(selectedDateRef.current) === dateKey,
            () => {
                updateCurrentDayMeals(date);
                setCacheVersion(v => v + 1);
            },
            error => {
                console.error('load day failed:', error);
                Alert.alert('Unable to load meals', 'Could not load meals for this date. Check your connection and try again.');
            },
        );
    }, [updateCurrentDayMeals, ensureDayLoaded]);

    const initializeAppData = useCallback(async (user: User) => {
        if (initializationRef.current || !mountedRef.current) return;
        const request = { uid: user.uid, generation: userGenerationRef.current };
        const isCurrentRequest = () =>
            mountedRef.current &&
            isCurrentUserRequest(
                request,
                currentUserRef.current?.uid,
                userGenerationRef.current,
            );
        if (!isCurrentRequest()) return;
        initializationRef.current = true;

        setLoading(true);
        setError(null);
        setInitializationError(null);

        try {
            const cachedMeals = await loadPersistedMealCache(user.uid);

            if (!isCurrentRequest()) return;

            if (cachedMeals) {
                mealCache.current.buildFromMeals(cachedMeals);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                setInitialLoadComplete(true);
            }

            const last30DaysMeals = await fetchLast30DaysMeals(user.uid);

            if (isCurrentRequest()) {
                mealCache.current.buildFromMeals(last30DaysMeals);
                setFreshMealsLoaded(true);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                if (!cachedMeals) setInitialLoadComplete(true);

                persistMealCache(user.uid, last30DaysMeals);
                setInitializationError(null);
            }
        } catch (err) {
            console.error('[FoodContext] init failed:', err);
            if (isCurrentRequest()) {
                setInitializationError('Unable to load nutrition data. Check your connection and try again.');
                handleError(err, 'load application data');
                initializationRef.current = false;
            }
        } finally {
            if (isCurrentRequest()) setLoading(false);
        }
    }, [updateCurrentDayMeals, handleError]);

    const retryInitialization = useCallback(() => {
        const user = currentUserRef.current;
        if (user) void initializeAppData(user);
    }, [initializeAppData]);

    useEffect(() => {
        const checkLearningCompletion = async () => {
            if (currentUser && enhancedLearningData.isLearningComplete && !nutritionHookData.hasTargets) {
                const request = { uid: currentUser.uid, generation: userGenerationRef.current };
                try {
                    const newTargets = await checkAndCompleteLearning(
                        currentUser.uid, mealCache.current, selectedDate, nutritionHookData.hasTargets
                    );
                    if (
                        newTargets &&
                        mountedRef.current &&
                        isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)
                    ) setUserProfile(prev => ({ ...prev, ...newTargets }));
                } catch (error) {
                    console.error('Failed to complete learning phase:', error);
                    if (isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)) {
                        handleError(error, 'complete learning phase');
                    }
                }
            }
        };
        checkLearningCompletion();
    }, [currentUser, enhancedLearningData.isLearningComplete, nutritionHookData.hasTargets, selectedDate, handleError]);

    useEffect(() => {
        if (!currentUser || !stepsConnected || !userData || stepsBonusCheckedRef.current) return;
        stepsBonusCheckedRef.current = true;

        const runStepsBonusBackfill = async () => {
            const request = { uid: currentUser.uid, generation: userGenerationRef.current };
            try {
                const result = await checkAndBackfillStepsBonus(
                    currentUser.uid, userData, mealCache.current, new Date()
                );
                if (
                    result &&
                    mountedRef.current &&
                    isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)
                ) {
                    setUserProfile(prev => ({ ...prev, ...result }));
                    await refreshUserData();
                }
            } catch (error) {
                if (isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)) {
                    console.error('Failed to backfill steps bonus:', error);
                }
            }
        };
        runStepsBonusBackfill();
    }, [currentUser, stepsConnected, userData, refreshUserData]);

    useEffect(() => {
        if (!currentUser || !freshMealsLoaded || !userData || weeklyEvalCheckedRef.current) return;
        weeklyEvalCheckedRef.current = true;

        const runWeeklyEval = async () => {
            const request = { uid: currentUser.uid, generation: userGenerationRef.current };
            try {
                const adjustment = await checkAndRunWeeklyEval(currentUser.uid, userData, mealCache.current);
                if (
                    adjustment &&
                    mountedRef.current &&
                    isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)
                ) {
                    setUserProfile(prev => ({ ...prev, ...adjustment }));
                    await refreshUserData();
                }
            } catch (error) {
                if (isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)) {
                    console.error('Failed to run weekly evaluation:', error);
                }
            }
        };
        runWeeklyEval();
    }, [currentUser, freshMealsLoaded, userData, refreshUserData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!mountedRef.current) return;
            const previousUser = currentUserRef.current;
            const userChanged = previousUser?.uid !== user?.uid;
            if (userChanged) {
                userGenerationRef.current++;
                initializationRef.current = false;
                stepsBonusCheckedRef.current = false;
                weeklyEvalCheckedRef.current = false;
                pendingStepsRef.current = {};
                writtenStepsRef.current = {};
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
                setInitialLoadComplete(false);
                setInitializationError(null);
                setFreshMealsLoaded(false);
                setLoading(!!user);
            }
            currentUserRef.current = user;
            setCurrentUser(user);
            if (user) {
                initializeAppData(user);
            } else {
                if (previousUser) clearPersistedMealCache(previousUser.uid);
                setLoading(false);
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

    const contextValue = useMemo<FoodContextValue>(() => ({
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
        getTrendData,
        dailySteps,
        updateDailySteps,
        getWeeklyAvgSteps,
        loading,
        error,
        initialLoadComplete,
        initializationError,
        retryInitialization,
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
        loading, error, initialLoadComplete, initializationError, retryInitialization,
        rollingWeekStats, getCaloriesForDateRange,
        getNutritionForDateRange, getStepsForDateRange, getMealCache, stepsLoading, stepsError,
        stepsConnected, retryStepsConnection,
    ]);

    return (
        <FoodContext.Provider value={contextValue}>
            <StepDisplay
                ref={stepsDisplayRef}
                onStepsUpdate={updateDailySteps}
                onStepsHistory={handleStepsHistory}
                onStepsError={handleStepsError}
                onStepsLoading={handleStepsLoading}
                onConnectedChange={handleStepsConnectedChange}
            />
            {children}
        </FoodContext.Provider>
    );
};

export default FoodProvider;
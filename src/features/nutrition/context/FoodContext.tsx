import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { formatDate } from '../utils/dateUtils';
import { diffSteps, persistDailySteps } from '../helpers/stepsSyncService';
import type { User } from 'firebase/auth';
import type {
    DailySteps, DateInput, EnhancedLearningData, FoodCategories, FoodDetailFood, FrequentFood, LoggedFood,
    MealGroup, MealType, MealsByType, NutritionTotals, UserData, WeightInWeek,
} from '../../../shared/types';

const MEAL_CACHE_KEY_PREFIX = 'meal_cache_v2_';
const MEAL_CACHE_TTL        = 30 * 60 * 1000;
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
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

const persistMealCache = async (uid: string, meals: MealGroup[]) => {
    try {
        await AsyncStorage.setItem(
            `${MEAL_CACHE_KEY_PREFIX}${uid}`,
            JSON.stringify({ meals, ts: Date.now() })
        );
    } catch {}
};

const loadPersistedMealCache = async (uid: string): Promise<MealGroup[] | null> => {
    try {
        const raw = await AsyncStorage.getItem(`${MEAL_CACHE_KEY_PREFIX}${uid}`);
        if (!raw) return null;
        const { meals, ts } = JSON.parse(raw) as { meals: MealGroup[]; ts: number };
        if (Date.now() - ts > MEAL_CACHE_TTL) return null;
        return meals;
    } catch {
        return null;
    }
};

const clearPersistedMealCache = async (uid: string) => {
    try {
        await AsyncStorage.removeItem(`${MEAL_CACHE_KEY_PREFIX}${uid}`);
    } catch {}
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

const buildCategoryData = (cache: MealCache): FoodCategories => {
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

    const foodUsageMap = new Map<string, FrequentFood>();
    allDays.forEach(({ date, meals }) => {
        MEAL_TYPES.forEach(mealType => {
            (meals[mealType] || []).forEach(food => {
                const key = `${food.id}_${mealType}`;
                if (!foodUsageMap.has(key)) {
                    foodUsageMap.set(key, { ...food, mealType, usageCount: 0, lastUsed: date });
                }
                const entry = foodUsageMap.get(key)!;
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

export const FoodProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser,         setCurrentUser]         = useState<User | null>(null);
    const [selectedDate,        setSelectedDate]        = useState(new Date());
    const [userProfile,         setUserProfile]         = useState<Partial<UserData> | null>(null);
    const [loading,             setLoading]             = useState(false);
    const [error,               setError]               = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
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
    const mealCache         = useRef(new MealCache());
    const mountedRef        = useRef(true);
    const operationQueues   = useRef(new Map<string, Promise<unknown>>());
    const selectedDateRef   = useRef(selectedDate);
    const stepsDisplayRef   = useRef<StepDisplayHandle | null>(null);
    const stepsBonusCheckedRef = useRef(false);
    const weeklyEvalCheckedRef = useRef(false);
    const currentUserRef    = useRef<User | null>(null);
    const pendingStepsRef   = useRef<DailySteps>({});
    const writtenStepsRef   = useRef<DailySteps>({});
    const flushingStepsRef  = useRef(false);
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

    const executeWithLock = useCallback((key: string, operation: () => Promise<unknown>): Promise<unknown> => {
        const previous = operationQueues.current.get(key) || Promise.resolve();
        const run = previous.then(operation, operation);
        operationQueues.current.set(key, run.catch(() => {}));
        return run;
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
        if (!uid || !ud || flushingStepsRef.current) return;
        const incoming = pendingStepsRef.current;
        if (!Object.keys(incoming).length) return;
        const stored  = { ...(ud.dailySteps || {}), ...writtenStepsRef.current };
        const toWrite = diffSteps(stored, incoming, formatDate(new Date()));
        pendingStepsRef.current = {};
        if (!Object.keys(toWrite).length) return;
        flushingStepsRef.current = true;
        try {
            await persistDailySteps(uid, toWrite);
            writtenStepsRef.current = { ...writtenStepsRef.current, ...toWrite };
        } catch (e) {
            console.error('persistDailySteps error:', e);
        } finally {
            flushingStepsRef.current = false;
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
        if (!mountedRef.current || mealCache.current.has(dateKey)) return;
        mealCache.current.set(dateKey, day);
    }, []);

    const handleAddMeal = useCallback(async (mealType: MealType, foods: LoggedFood[], mealDate?: DateInput): Promise<LoggedFood[]> => {
        if (!currentUser || !mealType || !foods?.length) throw new Error('Invalid meal parameters');
        const dateKey = formatDate(mealDate || selectedDateRef.current);
        const uid     = currentUser.uid;

        try {
            await ensureDayLoaded(dateKey, uid);
        } catch (error) {
            handleError(error, 'load meals');
            showSaveFailedAlert();
            throw error;
        }

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
    }, [currentUser, ensureDayLoaded, updateMealState, executeWithLock, handleError, serializeCacheForPersist, showSaveFailedAlert]);

    const handleDeleteMeal = useCallback(async (mealType: MealType, foodId: string): Promise<boolean> => {
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

    const updateMealInDatabase = useCallback(async (mealType: MealType, foodId: string, updatedFoodDetails: FoodDetailFood): Promise<void> => {
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
        ensureDayLoaded(dateKey, uid)
            .then(() => {
                if (!mountedRef.current || formatDate(selectedDateRef.current) !== dateKey) return;
                updateCurrentDayMeals(date);
                setCacheVersion(v => v + 1);
            })
            .catch(error => console.error('load day failed:', error));
    }, [updateCurrentDayMeals, ensureDayLoaded]);

    const initializeAppData = useCallback(async (user: User) => {
        if (initializationRef.current || !mountedRef.current) return;
        initializationRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const cachedMeals = await loadPersistedMealCache(user.uid);

            if (cachedMeals && mountedRef.current) {
                mealCache.current.buildFromMeals(cachedMeals);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                setInitialLoadComplete(true);
            }

            const last30DaysMeals = await fetchLast30DaysMeals(user.uid);

            if (mountedRef.current) {
                mealCache.current.buildFromMeals(last30DaysMeals);
                setFreshMealsLoaded(true);
                updateCurrentDayMeals(new Date());
                setCacheVersion(v => v + 1);
                if (!cachedMeals) setInitialLoadComplete(true);

                persistMealCache(user.uid, last30DaysMeals);
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
    }, [updateCurrentDayMeals, handleError]);

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
        if (!currentUser || !freshMealsLoaded || !userData || weeklyEvalCheckedRef.current) return;
        weeklyEvalCheckedRef.current = true;

        const runWeeklyEval = async () => {
            try {
                const adjustment = await checkAndRunWeeklyEval(currentUser.uid, userData, mealCache.current);
                if (adjustment && mountedRef.current) {
                    setUserProfile(prev => ({ ...prev, ...adjustment }));
                    await refreshUserData();
                }
            } catch (error) {
                console.error('Failed to run weekly evaluation:', error);
            }
        };
        runWeeklyEval();
    }, [currentUser, freshMealsLoaded, userData, refreshUserData]);

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
                setLoading(false);
                setInitialLoadComplete(false);
                setFreshMealsLoaded(false);
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
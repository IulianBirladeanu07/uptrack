import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { auth } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../../auth/context/AuthContext';
import StepDisplay from '../../../shared/components/StepDisplay/StepDisplay';
import type { StepDisplayHandle } from '../../../shared/components/StepDisplay/StepDisplay';

import {
    consolidateFoodData, buildAddUndo, applyAddUndo, fetchRawMealsForDate,
} from '../services/mealService';
import { checkAndCompleteLearning, calculateLearningStats, checkAndRunWeeklyEval, checkAndBackfillStepsBonus } from '../helpers/learningCompletionService';
import useDailyNutrition from '../helpers/useDailyNutrition';
import MealCache from './cache/MealCache';
import {
    clearPersistedMealCache,
    persistMealCache,
} from './cache/mealCacheStorage';
import { loadInitializationMeals } from './loadInitializationMeals';
import { handleFoodAuthStateChange } from './foodAuthStateChange';
import { AsyncOperationQueue } from './AsyncOperationQueue';
import { buildCategoryData } from './categoryData';
import { persistOptimisticMealWrite } from './optimisticMealWrite';
import {
    getCaloriesForDateRange as summarizeCaloriesForDateRange,
    getCurrentWeekRollingStats,
    getNutritionForDateRange as summarizeNutritionForDateRange,
    getStepsForDateRange as summarizeStepsForDateRange,
    type DayCalories,
} from './nutritionSummaries';
import { handleSelectedDateChange } from './selectedDateMealChange';
import { formatDate } from '../utils/dateUtils';
import { isCurrentUserRequest } from '../utils/userRequest';
import { StepsFlusher } from './StepsFlusher';
import type { User } from 'firebase/auth';
import type {
    DailySteps, DateInput, EnhancedLearningData, FoodCategories, FoodDetailFood, LoggedFood,
    MealGroup, MealType, MealsByType, NutritionTotals, UserData,
} from '../../../shared/types';

const REQUIRED_LEARNING_DAYS = 7;

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
    hasTargets:               boolean;
    learningData:             EnhancedLearningData;
    remainingCalories:        number;
    dailyNutrition:           NutritionTotals;
    userMacros:               ReturnType<typeof useDailyNutrition>['userMacros'];
    handleAddMeal:            (mealType: MealType, foods: LoggedFood[], mealDate?: DateInput) => Promise<LoggedFood[]>;
    handleDeleteMeal:         (mealType: MealType, foodId: string) => Promise<boolean>;
    updateMealInDatabase:     (mealType: MealType, foodId: string, updatedFoodDetails: FoodDetailFood) => Promise<void>;
    dailySteps:               number;
    updateDailySteps:         (steps: number, dateKey?: string) => void;
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

export const FoodProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser,         setCurrentUser]         = useState<User | null>(null);
    const [selectedDate,        setSelectedDate]        = useState(new Date());
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
    const userDataRef       = useRef<UserData | null>(null);
    const stepsFlusher      = useRef(new StepsFlusher({
        getUid:        () => currentUserRef.current?.uid,
        getUserData:   () => userDataRef.current,
        getGeneration: () => userGenerationRef.current,
    }));

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
        summarizeCaloriesForDateRange(mealCache.current, startDate, endDate),
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

    const flushSteps = useCallback(() => stepsFlusher.current.flush(), []);

    const handleStepsHistory = useCallback((entries: DailySteps) => {
        stepsFlusher.current.queue(entries);
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

    const getNutritionForDateRange = useCallback((startDate: DateInput, endDate: DateInput) =>
        summarizeNutritionForDateRange(mealCache.current, startDate, endDate),
    []);

    const getStepsForDateRange = useCallback((startDate: DateInput, endDate: DateInput) =>
        summarizeStepsForDateRange(mealCache.current, startDate, endDate),
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

    const writeMealOptimistically = useCallback((
        uid: string,
        mealType: MealType,
        dateKey: string,
        nextFoods: LoggedFood[],
        rollback: (currentFoods: LoggedFood[]) => LoggedFood[] | null,
    ) => persistOptimisticMealWrite({
        uid,
        mealType,
        dateKey,
        nextFoods,
        getCurrentFoods: () => mealCache.current.get(dateKey)[mealType],
        updateFoods: foods => updateMealState(mealType, foods, dateKey),
        persistCache: () => { void persistMealCache(uid, serializeCacheForPersist()); },
        isCurrentRequest: () => mountedRef.current && currentUserRef.current?.uid === uid,
        rollback,
    }), [updateMealState, serializeCacheForPersist]);

    const reportMealFailure = useCallback((uid: string, context: string, error: unknown) => {
        if (currentUserRef.current?.uid !== uid) return;
        handleError(error, context);
        showSaveFailedAlert();
    }, [handleError, showSaveFailedAlert]);

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
            reportMealFailure(uid, 'load meals', error);
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
                await writeMealOptimistically(uid, mealType, dateKey, consolidated, currentFoods => applyAddUndo(currentFoods, undoSpecs));
                return consolidated;
            });
        } catch (error) {
            reportMealFailure(uid, 'add meal', error);
            throw error;
        }
    }, [currentUser, ensureDayLoaded, writeMealOptimistically, executeWithLock, reportMealFailure]);

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
                await writeMealOptimistically(uid, mealType, dateKey, updated, () => existing);
                return true;
            });
        } catch (error) {
            reportMealFailure(uid, 'delete meal item', error);
            return false;
        }
    }, [currentUser, writeMealOptimistically, executeWithLock, reportMealFailure]);

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
                await writeMealOptimistically(uid, mealType, dateKey, updated, currentFoods =>
                    currentFoods.some(food => food.id === foodId) ? existing : null
                );
            });
        } catch (error) {
            reportMealFailure(uid, 'update meal item', error);
            throw error;
        }
    }, [currentUser, writeMealOptimistically, executeWithLock, reportMealFailure]);

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
        handleSelectedDateChange(date, {
            selectDate: selectedDate => {
                setSelectedDate(selectedDate);
                updateCurrentDayMeals(selectedDate);
            },
            getCurrentUserUid: () => currentUserRef.current?.uid,
            hasCachedMeals: dateKey => mealCache.current.has(dateKey),
            ensureDayLoaded,
            isCurrentRequest: (uid, dateKey) =>
                mountedRef.current &&
                currentUserRef.current?.uid === uid &&
                formatDate(selectedDateRef.current) === dateKey,
            onLoaded: selectedDate => {
                updateCurrentDayMeals(selectedDate);
                setCacheVersion(v => v + 1);
            },
        });
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
            await loadInitializationMeals({
                uid: user.uid,
                isCurrentRequest,
                onCachedMeals: cachedMeals => {
                    mealCache.current.buildFromMeals(cachedMeals);
                    updateCurrentDayMeals(new Date());
                    setCacheVersion(v => v + 1);
                    setInitialLoadComplete(true);
                },
                onFreshMeals: (freshMeals, hadCachedMeals) => {
                    mealCache.current.buildFromMeals(freshMeals);
                    setFreshMealsLoaded(true);
                    updateCurrentDayMeals(new Date());
                    setCacheVersion(v => v + 1);
                    if (!hadCachedMeals) setInitialLoadComplete(true);

                    persistMealCache(user.uid, freshMeals);
                    setInitializationError(null);
                },
            });
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
                    ) await refreshUserData();
                } catch (error) {
                    console.error('Failed to complete learning phase:', error);
                    if (isCurrentUserRequest(request, currentUserRef.current?.uid, userGenerationRef.current)) {
                        handleError(error, 'complete learning phase');
                    }
                }
            }
        };
        checkLearningCompletion();
    }, [currentUser, enhancedLearningData.isLearningComplete, nutritionHookData.hasTargets, selectedDate, handleError, refreshUserData]);

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
        const unsubscribe = onAuthStateChanged(auth, user => {
            handleFoodAuthStateChange(user, {
                isMounted: () => mountedRef.current,
                getCurrentUser: () => currentUserRef.current,
                resetAccountState: user => {
                    userGenerationRef.current++;
                    initializationRef.current = false;
                    stepsBonusCheckedRef.current = false;
                    weeklyEvalCheckedRef.current = false;
                    stepsFlusher.current.reset();
                    mealCache.current.clear();
                    setCategoryData({ recentMeals: [], frequentFoods: [], favoriteFoods: [] });
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
                },
                setCurrentUserRef: currentUser => { currentUserRef.current = currentUser; },
                setCurrentUser,
                initializeAppData: user => { void initializeAppData(user); },
                clearPersistedMealCache: uid => { void clearPersistedMealCache(uid); },
                setLoading,
            });
        });
        return () => unsubscribe();
    }, [initializeAppData]);

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
        hasTargets:       nutritionHookData.hasTargets,
        learningData:     enhancedLearningData,
        remainingCalories,
        dailyNutrition:   nutritionHookData.dailyNutrition,
        userMacros:       nutritionHookData.userMacros,
        handleAddMeal,
        handleDeleteMeal,
        updateMealInDatabase,
        dailySteps,
        updateDailySteps,
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
        nutritionHookData.hasTargets, enhancedLearningData,
        remainingCalories, nutritionHookData.dailyNutrition, nutritionHookData.userMacros,
        handleAddMeal, handleDeleteMeal, updateMealInDatabase, updateMealState,
        dailySteps, updateDailySteps,
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
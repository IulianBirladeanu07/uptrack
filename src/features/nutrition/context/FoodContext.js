import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { auth } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthContext } from '../../auth/context/AuthContext';

import { fetchFrequentFoods, fetchRecentMeals, fetchFavoriteFoods } from '../handlers/NutritionHandler';
import { addMeal, deleteMealItem, updateMealItem, fetchLast30DaysMeals } from '../services/mealService';
import { getCurrentWeekRollingStats } from '../helpers/weightTrackerUtils';
import useDailyNutrition from '../helpers/useDailyNutrition';
import { checkAndCompleteLearning, calculateLearningStats, checkAndRunWeeklyEval, hasEnoughDataForAdjustment } from '../helpers/learningCompletionService';
import MealCache from './cache/MealCache';
import { formatDate } from '../utils/dateUtils';

const FoodContext = createContext();

export const useFoodContext = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFoodContext must be used within a FoodProvider');
  }
  return context;
};

export const FoodProvider = ({ children, initialUserData }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState(initialUserData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [dailySteps, setDailySteps] = useState(0);

  const [mealState, setMealState] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  const [categoryData, setCategoryData] = useState({
    recentMeals: [],
    frequentFoods: [],
    favoriteFoods: []
  });

  const initializationRef = useRef(false);
  const mealCache = useRef(new MealCache());
  const mountedRef = useRef(true);
  const pendingOps = useRef(new Set());

  const { userData, refreshUserData } = useContext(AuthContext);

  const nutritionHookData = useDailyNutrition(
    mealState.breakfast,
    mealState.lunch,
    mealState.dinner,
    mealState.snacks,
    selectedDate,
    userProfile
  );

  const enhancedLearningData = useMemo(() => {
    if (nutritionHookData.hasTargets) {
      return nutritionHookData.learningData;
    }

    const learningStats = calculateLearningStats(mealCache.current, selectedDate, nutritionHookData.REQUIRED_LEARNING_DAYS);

    return {
      daysLogged: learningStats.daysLogged,
      weeklyAvgCalories: learningStats.averages.calories,
      isLearningComplete: learningStats.isComplete,
      averages: learningStats.averages
    };
  }, [nutritionHookData, selectedDate, mealState]);

  const remainingCalories = useMemo(() => {
    const target = nutritionHookData.userMacros?.targetCalories || 2000;
    const consumed = nutritionHookData.dailyNutrition?.calories || 0;
    return Math.max(0, target - consumed);
  }, [nutritionHookData.userMacros?.targetCalories, nutritionHookData.dailyNutrition?.calories]);

  const rollingWeekStats = useMemo(() => {
    return getCurrentWeekRollingStats(mealCache.current, userData?.weightIns);
  }, [mealState, dailySteps, userData?.weightIns]);

  const getCaloriesForDateRange = useCallback((startDate, endDate) => {
    return mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => ({
      date,
      calories: Object.values(meals ?? {})
        .flat()
        .reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
    }));
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    if (mountedRef.current) {
      setError(`Failed to ${context}. Please try again.`);
    }
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setError(null);
        }
      }, 5000);
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

    setMealState(prev => ({
      ...prev,
      [mealType]: foods
    }));

    mealCache.current.updateMealType(dateKey, mealType, foods);
  }, [selectedDate]);

  const updateDailySteps = useCallback((steps, dateKey) => {
    if (!mountedRef.current) return;
    const key = dateKey || formatDate(selectedDate);
    if (key === formatDate(selectedDate)) {
      setDailySteps(steps);
    }
    mealCache.current.setSteps(key, steps);
  }, [selectedDate]);

  const getWeeklyAvgSteps = useCallback(() => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const data = mealCache.current.getStepsRange(startDate, endDate);
    const todayKey = formatDate(selectedDate);
    const isToday = todayKey === formatDate(new Date());

    const completedDays = isToday
      ? data.filter(d => d.date !== todayKey)
      : data;

    const total = completedDays.reduce((sum, d) => sum + d.steps, 0);
    return completedDays.length > 0 ? Math.round(total / completedDays.length) : 0;
  }, [selectedDate]);

  const getNutritionForDateRange = useCallback((startDate, endDate) => {
      return mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => {
          const foods = Object.values(meals ?? {}).flat();
          return {
              date,
              calories: foods.reduce((s, f) => s + (Number(f?.calories) || 0), 0),
              protein:  foods.reduce((s, f) => s + (Number(f?.protein)  || 0), 0),
              carbs:    foods.reduce((s, f) => s + (Number(f?.carbs)    || 0), 0),
              fat:      foods.reduce((s, f) => s + (Number(f?.fat)      || 0), 0),
          };
      });
  }, []);
  
  const getStepsForDateRange = useCallback((startDate, endDate) => {
      return mealCache.current.getStepsRange(startDate, endDate);
  }, []);

  const updateCaches = useCallback(({
    frequentFoods: newFrequentFoods,
    recentMeal: newRecentMeal
  }) => {
    if (!mountedRef.current) return;

    setCategoryData(prev => {
      const updates = { ...prev };

      if (newFrequentFoods?.length) {
        const updatedFrequent = [...prev.frequentFoods];
        newFrequentFoods.forEach(food => {
          const existingIndex = updatedFrequent.findIndex(f => f.id === food.id);
          if (existingIndex >= 0) {
            updatedFrequent[existingIndex] = {
              ...updatedFrequent[existingIndex],
              usageCount: (updatedFrequent[existingIndex].usageCount || 0) + 1
            };
          } else {
            updatedFrequent.push({ ...food, usageCount: 1 });
          }
        });
        updates.frequentFoods = updatedFrequent
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, 50);
      }

      if (newRecentMeal) {
        const filtered = prev.recentMeals.filter(meal =>
          !(meal.date === newRecentMeal.date && meal.mealType === newRecentMeal.mealType)
        );
        updates.recentMeals = [newRecentMeal, ...filtered].slice(0, 30);
      }

      return updates;
    });
  }, []);

  const handleAddMeal = useCallback(async (mealType, foods, mealDate) => {
    if (!currentUser || !mealType || !foods?.length) {
      throw new Error('Invalid meal parameters');
    }

    const formattedDate = formatDate(mealDate || selectedDate);
    const operationKey = `add-meal-${formattedDate}-${mealType}`;

    return executeWithLock(operationKey, async () => {
      try {
        const consolidatedFoods = await addMeal(currentUser.uid, mealType, foods, formattedDate);

        if (mountedRef.current) {
          updateMealState(mealType, consolidatedFoods);
          updateCaches({
            frequentFoods: foods,
            recentMeal: {
              id: `${formattedDate}_${mealType}_${Date.now()}`,
              mealType,
              foods,
              date: formattedDate,
              timestamp: new Date()
            }
          });
        }

        return consolidatedFoods;
      } catch (error) {
        handleError(error, 'add meal');
        throw error;
      }
    });
  }, [currentUser, selectedDate, updateMealState, updateCaches, executeWithLock, handleError]);

  const handleDeleteMeal = useCallback(async (mealType, foodId) => {
    if (!currentUser || !mealType || !foodId) return false;

    const formattedDate = formatDate(selectedDate);
    const operationKey = `delete-meal-${formattedDate}-${mealType}-${foodId}`;

    return executeWithLock(operationKey, async () => {
      try {
        const updatedFoods = await deleteMealItem(currentUser.uid, mealType, foodId, formattedDate);
        if (mountedRef.current) {
          updateMealState(mealType, updatedFoods);
        }
        return true;
      } catch (error) {
        handleError(error, 'delete meal item');
        return false;
      }
    }) || false;
  }, [currentUser, selectedDate, updateMealState, executeWithLock, handleError]);

  const updateMealInDatabase = useCallback(async (mealType, foodId, updatedFoodDetails) => {
    if (!currentUser || !mealType || !foodId || !updatedFoodDetails) {
      throw new Error('Invalid update parameters');
    }

    const formattedDate = formatDate(selectedDate);
    const operationKey = `update-meal-${formattedDate}-${mealType}-${foodId}`;

    return executeWithLock(operationKey, async () => {
      try {
        const updatedFoods = await updateMealItem(currentUser.uid, mealType, foodId, updatedFoodDetails, formattedDate);
        if (mountedRef.current) {
          updateMealState(mealType, updatedFoods);
        }
      } catch (error) {
        handleError(error, 'update meal item');
        throw error;
      }
    });
  }, [currentUser, selectedDate, updateMealState, executeWithLock, handleError]);

  const loadCategoryData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const results = await Promise.allSettled([
        fetchRecentMeals(),
        fetchFrequentFoods(),
        fetchFavoriteFoods()
      ]);

      if (mountedRef.current) {
        setCategoryData({
          recentMeals: results[0].status === 'fulfilled' ? results[0].value : [],
          frequentFoods: results[1].status === 'fulfilled' ? results[1].value : [],
          favoriteFoods: results[2].status === 'fulfilled' ? results[2].value : []
        });
      }
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  }, []);

  const updateCurrentDayMeals = useCallback((date) => {
    if (!mountedRef.current) return;

    const dateKey = formatDate(date);
    const dayMeals = mealCache.current.get(dateKey);
    const daySteps = mealCache.current.getSteps(dateKey);

    setMealState({
      breakfast: dayMeals.breakfast || [],
      lunch: dayMeals.lunch || [],
      dinner: dayMeals.dinner || [],
      snacks: dayMeals.snacks || []
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

    try {
      const last30DaysMeals = await fetchLast30DaysMeals(user.uid);

      if (mountedRef.current) {
        setUserProfile(initialUserData);
        mealCache.current.buildFromMeals(last30DaysMeals);
        updateCurrentDayMeals(new Date());
        setInitialLoadComplete(true);

        setTimeout(() => {
          if (mountedRef.current) {
            loadCategoryData();
          }
        }, 100);

        setTimeout(async () => {
          if (!mountedRef.current) return;
          const currentUserData = initialUserData;
          if (currentUserData && hasEnoughDataForAdjustment(currentUserData)) {
            const adjustment = await checkAndRunWeeklyEval(user.uid, currentUserData, mealCache.current);
            if (adjustment && mountedRef.current) {
              setUserProfile(prev => ({ ...prev, ...adjustment }));
              await refreshUserData();
            }
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to initialize app data:', err);
      if (mountedRef.current) {
        handleError(err, 'load application data');
        initializationRef.current = false;
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [initialUserData, loadCategoryData, updateCurrentDayMeals, handleError, refreshUserData]);

  useEffect(() => {
    const checkLearningCompletion = async () => {
      if (currentUser && enhancedLearningData.isLearningComplete && !nutritionHookData.hasTargets) {
        try {
          const newTargets = await checkAndCompleteLearning(
            currentUser.uid,
            mealCache.current,
            selectedDate,
            nutritionHookData.hasTargets
          );

          if (newTargets) {
            setUserProfile(prev => ({
              ...prev,
              ...newTargets
            }));
          }
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
        initializationRef.current = false;
        mealCache.current.clear();
        setCategoryData({
          recentMeals: [],
          frequentFoods: [],
          favoriteFoods: []
        });
        setUserProfile(null);
        setMealState({
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        });
        setDailySteps(0);
        setError(null);
        setLoading(false);
        setInitialLoadComplete(false);
      }
    });
    return () => unsubscribe();
  }, [initializeAppData]);

  const getTrendData = useCallback((days = 7) => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days + 1);

    const daily = mealCache.current.getDateRange(startDate, endDate).map(({ date, meals }) => {
      const calories = Object.values(meals ?? {})
        .flat()
        .reduce((sum, food) => sum + (Number(food?.calories) || 0), 0);

      return { date, calories };
    });

    const total = daily.reduce((sum, d) => sum + d.calories, 0);
    const average = daily.length ? total / daily.length : 0;

    return { daily, total, average };
  }, [selectedDate]);

  const contextValue = useMemo(() => ({
    breakfastFoods: mealState.breakfast,
    lunchFoods: mealState.lunch,
    dinnerFoods: mealState.dinner,
    snacksFoods: mealState.snacks,
    selectedDate,
    setSelectedDate: handleDateChange,
    recentMeals: categoryData.recentMeals,
    frequentFoods: categoryData.frequentFoods,
    favoriteFoods: categoryData.favoriteFoods,
    userProfile,
    hasTargets: nutritionHookData.hasTargets,
    learningData: enhancedLearningData,
    remainingCalories,
    dailyNutrition: nutritionHookData.dailyNutrition,
    userMacros: nutritionHookData.userMacros,
    handleAddMeal,
    handleDeleteMeal,
    updateMealInDatabase,
    updateFoods: updateMealState,
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
    loading, error, initialLoadComplete, rollingWeekStats, getCaloriesForDateRange, getNutritionForDateRange, getStepsForDateRange
  ]);

  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
};

export default FoodProvider;
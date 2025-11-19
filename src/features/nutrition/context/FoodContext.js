import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { auth, db } from '../../auth/services/firebaseConfigService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fetchFrequentFoods, fetchRecentMeals, fetchFavoriteFoods } from '../handlers/NutritionHandler';
import { addMeal, deleteMealItem, updateMealItem, fetchLast30DaysMeals } from '../services/mealService';
import useDailyNutrition from '../helpers/useDailyNutrition';
import { checkAndCompleteLearning, calculateLearningStats } from '../helpers/learningCompletionService'

const FoodContext = createContext();

export const useFoodContext = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFoodContext must be used within a FoodProvider');
  }
  return context;
};

// Enhanced cache with better memory management
class MealCache {
  constructor(maxSize = 30) {
    this.data = new Map();
    this.accessOrder = new Map();
    this.maxSize = maxSize;
    this.defaultMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  }
  
  get(key) { 
    if (this.data.has(key)) {
      this.accessOrder.delete(key);
      this.accessOrder.set(key, Date.now());
      return this.data.get(key);
    }
    return { ...this.defaultMeals }; 
  }
  
  set(key, value) { 
    if (this.data.size >= this.maxSize && !this.data.has(key)) {
      const oldestKey = this.accessOrder.keys().next().value;
      this.data.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
    
    this.data.set(key, value);
    this.accessOrder.set(key, Date.now());
  }
  
  has(key) { 
    return this.data.has(key); 
  }
  
  clear() { 
    this.data.clear();
    this.accessOrder.clear();
  }
  
  updateMealType(dateKey, mealType, foods) {
    const dayMeals = this.get(dateKey);
    dayMeals[mealType] = foods;
    this.set(dateKey, dayMeals);
    return dayMeals;
  }
  
  buildFromMeals(meals) {
    this.clear();
    const groupedMeals = new Map();
    
    meals.forEach(meal => {
      const dateKey = meal.date;
      if (!groupedMeals.has(dateKey)) {
        groupedMeals.set(dateKey, { ...this.defaultMeals });
      }
      groupedMeals.get(dateKey)[meal.mealType] = meal.foods || [];
    });
    
    groupedMeals.forEach((meals, date) => {
      this.set(date, meals);
    });
  }

  getDateRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDate(d);
      const meals = this.get(dateKey);
      results.push({ date: dateKey, meals });
    }
    
    return results;
  }
}

// Utility functions
const formatDate = (date) => {
  return (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
};

export const FoodProvider = ({ children }) => {
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Meal state
  const [mealState, setMealState] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  
  // Category data state
  const [categoryData, setCategoryData] = useState({
    recentMeals: [],
    frequentFoods: [],
    favoriteFoods: []
  });

  // Refs and utilities
  const initializationRef = useRef(false);
  const mealCache = useRef(new MealCache());
  const mountedRef = useRef(true);
  const pendingOps = useRef(new Set());
  
  // Custom hook for nutrition calculations with enhanced learning data
  const nutritionHookData = useDailyNutrition(
    mealState.breakfast, 
    mealState.lunch, 
    mealState.dinner, 
    mealState.snacks,
    selectedDate,
    userProfile // Pass userProfile so it can use updated targets
  );

  // Enhanced learning data calculation using cache
  const enhancedLearningData = useMemo(() => {
    if (nutritionHookData.hasTargets) {
      return nutritionHookData.learningData;
    }

    const learningStats = calculateLearningStats(mealCache.current, selectedDate, nutritionHookData.REQUIRED_LEARNING_DAYS);
    
    return {
      daysLogged: learningStats.daysLogged,
      weeklyAvgCalories: learningStats.averages.calories,
      isLearningComplete: learningStats.isComplete,
      averages: learningStats.averages // Include all averages for potential use
    };
  }, [nutritionHookData, selectedDate, mealState]);
  
  // Calculate remaining calories
  const remainingCalories = useMemo(() => {
    const target = nutritionHookData.userMacros?.targetCalories || 2000;
    const consumed = nutritionHookData.dailyNutrition?.calories || 0;
    return Math.max(0, target - consumed);
  }, [nutritionHookData.userMacros?.targetCalories, nutritionHookData.dailyNutrition?.calories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced error handling
  const handleError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    if (mountedRef.current) {
      setError(`Failed to ${context}. Please try again.`);
    }
  }, []);

  // Clear error after timeout
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

  // Async operation lock
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

  // Enhanced meal state management
  const updateMealState = useCallback((mealType, foods) => {
    if (!mountedRef.current) return;
    
    const dateKey = formatDate(selectedDate);
    
    setMealState(prev => ({
      ...prev,
      [mealType]: foods
    }));

    mealCache.current.updateMealType(dateKey, mealType, foods);
  }, [selectedDate]);

  // Cache update functions
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

  // Main meal operations
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

  // User profile management
  const fetchUserProfile = useCallback(async (uid) => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', uid));
      return profileDoc.exists() ? profileDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Data loading
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

  // Date and meal management
  const updateCurrentDayMeals = useCallback((date) => {
    if (!mountedRef.current) return;
    
    const dateKey = formatDate(date);
    const dayMeals = mealCache.current.get(dateKey);
    
    setMealState({
      breakfast: dayMeals.breakfast || [],
      lunch: dayMeals.lunch || [],
      dinner: dayMeals.dinner || [],
      snacks: dayMeals.snacks || []
    });
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    updateCurrentDayMeals(date);
  }, [updateCurrentDayMeals]);

  // Initialization
  const initializeAppData = useCallback(async (user) => {
    if (initializationRef.current || !mountedRef.current) return;
    initializationRef.current = true;
    
    setLoading(true);
    setError(null);
    
    try {
      const [userProfileData, last30DaysMeals] = await Promise.all([
        fetchUserProfile(user.uid),
        fetchLast30DaysMeals(user.uid)
      ]);

      if (mountedRef.current) {
        setUserProfile(userProfileData);
        mealCache.current.buildFromMeals(last30DaysMeals);
        updateCurrentDayMeals(new Date());
        setInitialLoadComplete(true);
        
        // Load category data in background
        setTimeout(() => {
          if (mountedRef.current) {
            loadCategoryData();
          }
        }, 100);
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
  }, [fetchUserProfile, loadCategoryData, updateCurrentDayMeals, handleError]);

  // Check and complete learning when 7 days are reached
  useEffect(() => {
    const checkLearningCompletion = async () => {
      if (currentUser && enhancedLearningData.isLearningComplete && !nutritionHookData.hasTargets) {
        try {
          console.log('Learning phase complete, setting user targets...');
          const newTargets = await checkAndCompleteLearning(
            currentUser.uid, 
            mealCache.current, 
            selectedDate, 
            nutritionHookData.hasTargets
          );
          
          if (newTargets) {
            // Update local user profile to reflect new targets
            setUserProfile(prev => ({
              ...prev,
              ...newTargets
            }));
            console.log('User targets set successfully:', newTargets);
          }
        } catch (error) {
          console.error('Failed to complete learning phase:', error);
          handleError(error, 'complete learning phase');
        }
      }
    };

    checkLearningCompletion();
  }, [currentUser, enhancedLearningData.isLearningComplete, nutritionHookData.hasTargets, selectedDate, handleError]);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!mountedRef.current) return;
      
      setCurrentUser(user);
      if (user && !initializationRef.current) {
        initializeAppData(user);
      } else if (!user) {
        // Reset state when user logs out
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
        setError(null);
        setLoading(false);
        setInitialLoadComplete(false);
      }
    });
    return () => unsubscribe();
  }, [initializeAppData]);

  // Trend data utility
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

  // Context value
  const contextValue = useMemo(() => ({
    // Meal data
    breakfastFoods: mealState.breakfast,
    lunchFoods: mealState.lunch,
    dinnerFoods: mealState.dinner,
    snacksFoods: mealState.snacks,
    
    // Date management
    selectedDate,
    setSelectedDate: handleDateChange,
    
    // Category data
    recentMeals: categoryData.recentMeals,
    frequentFoods: categoryData.frequentFoods,
    favoriteFoods: categoryData.favoriteFoods,
    
    // User data
    userProfile,
    hasTargets: nutritionHookData.hasTargets,
    learningData: enhancedLearningData,
    
    // Nutrition
    remainingCalories,
    dailyNutrition: nutritionHookData.dailyNutrition,
    userMacros: nutritionHookData.userMacros,
    
    // Actions
    handleAddMeal,
    handleDeleteMeal,
    updateMealInDatabase,
    updateFoods: updateMealState,
    
    // Advanced features
    getTrendData,
    
    // State
    loading,
    error,
    initialLoadComplete,
  }), [
    mealState, selectedDate, handleDateChange, categoryData,
    userProfile, nutritionHookData.hasTargets, enhancedLearningData,
    remainingCalories, nutritionHookData.dailyNutrition, nutritionHookData.userMacros,
    handleAddMeal, handleDeleteMeal, updateMealInDatabase, updateMealState,
    getTrendData, loading, error, initialLoadComplete
  ]);
  
  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
};

export default FoodProvider;
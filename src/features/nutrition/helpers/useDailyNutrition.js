import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';

const useDailyNutrition = (breakfastFoods, lunchFoods, dinnerFoods, snacksFoods, selectedDate, mealCacheRef) => {
  const { userData } = useContext(AuthContext);
  
  // Constants for learning mode
  const REQUIRED_LEARNING_DAYS = 7;

  // Check if user has targets set (not in learning mode)
  const hasTargets = !!(userData?.targetCalories && userData?.maintenanceCalories);
  
  const userMacros = useMemo(() => hasTargets
    ? {
        targetCalories: userData.targetCalories,
        targetProtein: userData.targetProtein || 0,
        targetCarbs: userData.targetCarbs || 0,
        targetFats: userData.targetFats || 0,
        maintenanceCalories: userData.maintenanceCalories || 0,
      }
    : {
        targetCalories: 0,
        targetProtein: 0,
        targetCarbs: 0,
        targetFats: 0,
        maintenanceCalories: 0,
      }, [hasTargets, userData]);

  // Calculate current day's nutrition (memoized for performance)
  const dailyNutrition = useMemo(() => {
    const allFoods = [...breakfastFoods, ...lunchFoods, ...dinnerFoods, ...(snacksFoods || [])];
    return allFoods.reduce((totals, food) => ({
      calories: totals.calories + (Number(food.calories) || 0),
      protein: totals.protein + (Number(food.protein) || 0),
      carbs: totals.carbs + (Number(food.carbohydrates) || 0),
      fat: totals.fat + (Number(food.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

  // Calculate learning progress using cached meal data
  const learningData = useMemo(() => {
    if (hasTargets) {
      return {
        daysLogged: REQUIRED_LEARNING_DAYS,
        weeklyAvgCalories: userData.maintenanceCalories || 0,
        isLearningComplete: true,
      };
    }

    if (!mealCacheRef?.current) {
      return {
        daysLogged: 0,
        weeklyAvgCalories: 0,
        isLearningComplete: false,
      };
    }

    // Use cached meal data instead of making new API calls
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - REQUIRED_LEARNING_DAYS + 1);

    const weekData = mealCacheRef.current.getDateRange(startDate, endDate);
    
    // Count days with logged meals
    const daysWithMeals = weekData.filter(({ meals }) => {
      const totalFoods = Object.values(meals || {})
        .flat()
        .filter(food => food && food.calories > 0).length;
      return totalFoods > 0;
    }).length;

    // Calculate average calories for days with data
    const daysWithCalories = weekData
      .map(({ meals }) => {
        const dailyCalories = Object.values(meals || {})
          .flat()
          .reduce((sum, food) => sum + (Number(food?.calories) || 0), 0);
        return dailyCalories;
      })
      .filter(calories => calories > 0);

    const avgCalories = daysWithCalories.length > 0 
      ? daysWithCalories.reduce((sum, cal) => sum + cal, 0) / daysWithCalories.length 
      : 0;

    return {
      daysLogged: Math.min(daysWithMeals, REQUIRED_LEARNING_DAYS),
      weeklyAvgCalories: Math.round(avgCalories),
      isLearningComplete: daysWithMeals >= REQUIRED_LEARNING_DAYS,
    };
  }, [hasTargets, userData, selectedDate, mealCacheRef, REQUIRED_LEARNING_DAYS]);

  return {
    dailyNutrition,
    userMacros,
    hasTargets,
    learningData,
    REQUIRED_LEARNING_DAYS,
  };
};

export default useDailyNutrition;
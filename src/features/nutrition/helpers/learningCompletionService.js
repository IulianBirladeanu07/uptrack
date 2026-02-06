import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';

const DEFAULT_MACRO_DISTRIBUTION = {
  protein: 0.25,
  carbs: 0.45, 
  fat: 0.30
};

const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9
};

export const calculateMacroTargets = (maintenanceCalories, distribution = DEFAULT_MACRO_DISTRIBUTION) => {
  const proteinCalories = maintenanceCalories * distribution.protein;
  const carbCalories = maintenanceCalories * distribution.carbs;
  const fatCalories = maintenanceCalories * distribution.fat;

  return {
    targetProtein: Math.round(proteinCalories / CALORIES_PER_GRAM.protein),
    targetCarbs: Math.round(carbCalories / CALORIES_PER_GRAM.carbs),
    targetFats: Math.round(fatCalories / CALORIES_PER_GRAM.fat)
  };
};

export const calculateLearningStats = (mealCache, endDate, days = 7) => {
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - days + 1);

  const weekData = mealCache.getDateRange(startDate, endDate);  
  const dailyStats = weekData.map(({ date, meals }) => {
    const dayTotals = Object.values(meals || {})
      .flat()
      .reduce((totals, food) => ({
        calories: totals.calories + (Number(food?.calories) || 0),
        protein: totals.protein + (Number(food?.protein) || 0),
        carbs: totals.carbs + (Number(food?.carbohydrates) || 0),
        fat: totals.fat + (Number(food?.fats) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      date,
      ...dayTotals,
      hasData: dayTotals.calories > 0
    };
  });

  const daysWithData = dailyStats.filter(day => day.hasData);
  const daysLogged = daysWithData.length;

  if (daysLogged === 0) {
    return {
      daysLogged: 0,
      averages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      isComplete: false
    };
  }

  const totals = daysWithData.reduce((sum, day) => ({
    calories: sum.calories + day.calories,
    protein: sum.protein + day.protein,
    carbs: sum.carbs + day.carbs,
    fat: sum.fat + day.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const averages = {
    calories: Math.round(totals.calories / daysLogged),
    protein: Math.round(totals.protein / daysLogged),
    carbs: Math.round(totals.carbs / daysLogged),
    fat: Math.round(totals.fat / daysLogged),
  };

  return {
    daysLogged,
    averages,
    isComplete: daysLogged >= days,
    dailyStats: daysWithData
  };
};

export const completeLearningPhase = async (userId, learningStats, customDistribution) => {
  if (!userId || !learningStats.isComplete) {
    throw new Error('Invalid parameters for completing learning phase');
  }

  const { averages } = learningStats;
  const maintenanceCalories = averages.calories;
  
  const macroTargets = calculateMacroTargets(maintenanceCalories, customDistribution);
  
  const userTargets = {
    targetCalories: maintenanceCalories,
    maintenanceCalories: maintenanceCalories,
    ...macroTargets,
    
    learningCompletedAt: new Date().toISOString(),
    learningData: {
      daysAnalyzed: learningStats.daysLogged,
      averageIntake: averages
    }
  };

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userTargets);
    
    return userTargets;
  } catch (error) {
    console.error('Error completing learning phase:', error);
    throw error;
  }
};

export const checkAndCompleteLearning = async (userId, mealCache, currentDate, hasTargets) => {
  if (!userId || hasTargets) {
    return null;
  }

  const learningStats = calculateLearningStats(mealCache, currentDate, 7);
  
  if (learningStats.isComplete) {
    try {
      const newTargets = await completeLearningPhase(userId, learningStats);
      return newTargets;
    } catch (error) {
      console.error('Failed to complete learning phase:', error);
      return null;
    }
  }

  return null;
};

export default {
  calculateMacroTargets,
  calculateLearningStats,
  completeLearningPhase,
  checkAndCompleteLearning,
  DEFAULT_MACRO_DISTRIBUTION,
  CALORIES_PER_GRAM
};
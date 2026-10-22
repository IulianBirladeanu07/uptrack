import type {
  DateInput,
  NutritionTotals,
  WeightInWeek,
} from '../../../shared/types';
import { getLocalWeekStart } from '../helpers/weightTrackerUtils';
import { getRollingWeekStats } from '../helpers/learningCompletionService';
import MealCache from './cache/MealCache';

export type DayCalories = { date: string; calories: number };

export const getCurrentWeekRollingStats = (
  mealCache: MealCache | null,
  weightIns?: WeightInWeek[],
  today = new Date(),
) => {
  if (!mealCache) {
    return { avgCalories: 0, avgSteps: 0, avgWeight: null, prevAvgWeight: null };
  }

  const weekStartStr = getLocalWeekStart(today);
  const [year, month, day] = weekStartStr.split('-').map(Number);
  const weekStartDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const nutritionStats = getRollingWeekStats(mealCache, weekStartDate, todayEnd);

  const prevWeekDate = new Date(year, month - 1, day - 7);
  const prevWeekStr = getLocalWeekStart(prevWeekDate);
  const weekEntry = weightIns?.find(week => week.weekStart === weekStartStr);
  const prevWeekEntry = weightIns?.find(week => week.weekStart === prevWeekStr);
  const daysLoggedWeight = weekEntry?.days
    ? Object.values(weekEntry.days).filter(weight => weight != null && !isNaN(Number(weight))).length
    : 0;

  return {
    avgCalories: nutritionStats.avgCalories,
    avgProtein: nutritionStats.avgProtein,
    avgCarbs: nutritionStats.avgCarbs,
    avgFats: nutritionStats.avgFats,
    avgSteps: nutritionStats.avgSteps,
    avgWeight: weekEntry?.average ?? null,
    prevAvgWeight: prevWeekEntry?.average ?? null,
    daysLoggedNutrition: nutritionStats.daysLoggedNutrition,
    daysLoggedSteps: nutritionStats.daysLoggedSteps,
    daysLoggedWeight,
  };
};

export const getCaloriesForDateRange = (
  mealCache: MealCache,
  startDate: DateInput,
  endDate: DateInput,
): DayCalories[] =>
  mealCache.getDateRange(startDate, endDate).map(({ date, meals }) => ({
    date,
    calories: Object.values(meals ?? {}).flat()
      .reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
  }));

export const getNutritionForDateRange = (
  mealCache: MealCache,
  startDate: DateInput,
  endDate: DateInput,
): ({ date: string } & NutritionTotals)[] =>
  mealCache.getDateRange(startDate, endDate).map(({ date, meals }) => {
    const foods = Object.values(meals ?? {}).flat();
    return {
      date,
      calories: foods.reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
      protein: foods.reduce((sum, food) => sum + (Number(food?.protein) || 0), 0),
      carbs: foods.reduce((sum, food) => sum + (Number(food?.carbohydrates) || 0), 0),
      fat: foods.reduce((sum, food) => sum + (Number(food?.fats) || 0), 0),
    };
  });

export const getLoggedNutritionDays = (
  mealCache: MealCache,
  startDate: DateInput,
  endDate: DateInput,
): { date: string; calories: number; protein: number }[] =>
  mealCache.getDateRange(startDate, endDate).flatMap(({ date, meals }) => {
    const foods = Object.values(meals ?? {}).flat();
    if (foods.length === 0) return [];
    return [{
      date,
      calories: foods.reduce((sum, food) => sum + (Number(food?.calories) || 0), 0),
      protein: foods.reduce((sum, food) => sum + (Number(food?.protein) || 0), 0),
    }];
  });

export const getStepsForDateRange = (
  mealCache: MealCache,
  startDate: DateInput,
  endDate: DateInput,
): { date: string; steps: number }[] => mealCache.getStepsRange(startDate, endDate);

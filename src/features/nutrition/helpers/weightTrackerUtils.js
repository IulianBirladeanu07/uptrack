// weightTrackerUtils.js
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import { Animated, Vibration } from 'react-native';

/**
 * Validates if the given value is a valid weight (numeric, > 0, <= 1000).
 */
export const validateWeight = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue > 0 && numValue <= 1000;
};

/**
 * Helper to get the start of the week (Monday).
 */
export const getWeekStartDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Helper to get day key for database storage.
 */
export const getDayKey = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Calculates the average of non-null/undefined weights in a weekly object.
 */
export const calculateWeeklyAverage = (weeklyWeights) => {
  const weights = Object.values(weeklyWeights).filter(w => w !== null && w !== undefined);
  if (weights.length === 0) return null;
  const sum = weights.reduce((acc, curr) => acc + curr, 0);
  return parseFloat((sum / weights.length).toFixed(2));
};

/**
 * Formats a Date object into a readable string.
 */
export const formatDate = (date) => {
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Simplified function to load user weight data without weightIns processing.
 * The InputView component now handles weightIns fetching directly.
 */
export const loadUserWeightData = async (
  userId,
  currentDate,
  setCurrentWeight,
  setWeight,
  setWeeklyData,
  setWeeklyAverage,
  setLastWeekAverage,
  setTrendData
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const weightIns = data.weightIns || [];

      // Set current weight and input field
      setCurrentWeight(data.currentWeight);
      setWeight(data.currentWeight ? data.currentWeight.toString() : '');

      // Process current week data
      const today = new Date(currentDate);
      const weekStartDate = getWeekStartDate(today).toISOString().split('T')[0];
      const currentWeek = weightIns.find(entry => entry.weekStart === weekStartDate);
      setWeeklyData(currentWeek);
      setWeeklyAverage(currentWeek?.average);

      // Process last week data
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartDate = getWeekStartDate(lastWeekStart).toISOString().split('T')[0];
      const lastWeek = weightIns.find(entry => entry.weekStart === lastWeekStartDate);
      setLastWeekAverage(lastWeek?.average);

      // Calculate trend data (last 7 days)
      const last7Days = [];
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);
        const weekStart = getWeekStartDate(currentDay).toISOString().split('T')[0];
        const dayKey = getDayKey(currentDay);
        const weekData = weightIns.find(entry => entry.weekStart === weekStart);
        const weight = weekData?.days?.[dayKey] || null;
        
        last7Days.push({
          date: currentDay.toISOString(),
          weight: weight,
        });
      }
      setTrendData(last7Days);

      console.log('Weight data loaded successfully:', {
        currentWeight: data.currentWeight,
        weeklyDataCount: weightIns.length,
        currentWeekAverage: currentWeek?.average,
        lastWeekAverage: lastWeek?.average
      });
    }
  } catch (error) {
    console.error('Error loading weight data:', error);
  }
};

export const fetchWeeklyAverageWeight = async (userId, weekStartDate) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const weightIns = data.weightIns || [];
      const weekData = weightIns.find(entry => entry.weekStart === weekStartDate);
      
      if (weekData) {
        return weekData.average || null;
      }
    }
    return null;
  } catch (error) {
     console.error('Error fetching weekly average weight:', error);
    return null;
  }
}

export const fetchWeightInsByDate = async (userId, date) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const weightIns = data.weightIns || [];
      const weekStartDate = getWeekStartDate(new Date(date)).toISOString().split('T')[0];
      const weekData = weightIns.find(entry => entry.weekStart === weekStartDate);
      
      return weekData ? weekData.days : {};
    }
    return {};
  } catch (error) {
    console.error('Error fetching weight ins by date:', error);         
    return {};
  }
};  
/**
 * Enhanced save logic that triggers data reload.
 */
export const handleSaveLogic = async (
  userId,
  weightValue,
  currentDate,
  setCurrentWeight,
  setWeeklyAverage,
  loadDataCallback
) => {
  try {
    const today = new Date(currentDate);
    const weekStartDate = getWeekStartDate(today).toISOString().split('T')[0];
    const dayKey = getDayKey(today);

    const userDocRef = doc(db, 'users', userId);  
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};

    const weightIns = Array.isArray(currentData.weightIns) ? currentData.weightIns : [];

    let currentWeekIndex = weightIns.findIndex(entry => entry.weekStart === weekStartDate);
    let updatedWeightIns = [...weightIns];

    if (currentWeekIndex >= 0) {
      updatedWeightIns[currentWeekIndex] = {
        ...updatedWeightIns[currentWeekIndex],
        days: {
          ...updatedWeightIns[currentWeekIndex].days,
          [dayKey]: weightValue
        }
      };
    } else {
      updatedWeightIns.push({
        weekStart: weekStartDate,
        days: { [dayKey]: weightValue },
        createdAt: new Date().toISOString(),
      });
      currentWeekIndex = updatedWeightIns.length - 1;
    }

    const currentWeekEntry = updatedWeightIns[currentWeekIndex];
    const currentWeekAverage = calculateWeeklyAverage(currentWeekEntry.days);
    currentWeekEntry.average = currentWeekAverage;

    updatedWeightIns.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));

    let weeklyTrend = null;
    if (updatedWeightIns.length >= 2) {
      const currentWeekAvg = currentWeekAverage;
      const lastWeekEntry = updatedWeightIns[updatedWeightIns.length - 2];
      if (lastWeekEntry && lastWeekEntry.average !== null && lastWeekEntry.average !== undefined && currentWeekAvg !== null && currentWeekAvg !== undefined) {
        weeklyTrend = parseFloat((currentWeekAvg - lastWeekEntry.average).toFixed(2));
      }
    }

    await setDoc(userDocRef, {
      currentWeight: weightValue,
      weightIns: updatedWeightIns,
      lastWeightUpdate: new Date().toISOString(),
      weeklyTrend: weeklyTrend,
    }, { merge: true });

    const cacheData = {
      ...currentData,
      currentWeight: weightValue,
      weightIns: updatedWeightIns,
      weeklyTrend: weeklyTrend,
    };
    await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(cacheData));

    setCurrentWeight(weightValue);
    setWeeklyAverage(currentWeekAverage);

    // Reload all data to ensure UI is updated
    await loadDataCallback();

    console.log('Weight saved successfully:', {
      weight: weightValue,
      weekStart: weekStartDate,
      dayKey: dayKey,
      weekAverage: currentWeekAverage,
      totalWeeks: updatedWeightIns.length
    });

  } catch (error) {
    console.error('Error saving weight: ', error);
    throw error;
  }
};

export async function addWeightDataToFirestore(userId) {
  // Weight data to add to existing user profile
  const newWeightIns = [
    // Week 1 (July 7-13, 2025)
    {
      average: 88.54,
      createdAt: "2025-07-07T00:00:00.000Z",
      days: {
        sunday: 88.95,
        monday: 88.65,
        tuesday: 88.45,
        wednesday: 88.00,
        thursday: 88.80,
        friday: 88.70,
        saturday: 88.20
      },
      weekStart: "2025-07-07"
    },
    // Week 2 (July 14-20, 2025)
    {
      average: 87.89,
      createdAt: "2025-07-14T00:00:00.000Z",
      days: {
        sunday: 88.40,
        monday: 88.70,
        tuesday: 88.75,
        wednesday: 87.45,
        thursday: 87.35,
        friday: 87.25,
        saturday: 87.35
      },
      weekStart: "2025-07-14"
    },
    // Week 3 (July 21-27, 2025)
    {
      average: 87.2,
      createdAt: "2025-07-21T00:00:00.000Z",
      days: {
        sunday: 87.75,
        monday: 87.75,
        tuesday: 87.6,
        wednesday: 87.25,
        thursday: 87,
        friday: 86.3,
        saturday: 86.75
      },
      weekStart: "2025-07-21"
    },
    // Week 4 (July 28 - Aug 3, 2025)
    {
      average: 85.88,
      createdAt: "2025-07-28T00:00:00.000Z",
      days: {
        sunday: 86.2,
        monday: 86.25,
        tuesday: 86,
        wednesday: 85.8,
        thursday: 85.8,
        friday: 85.6,
        saturday: 85.5
      },
      weekStart: "2025-07-28"
    },
    // Week 5 (Aug 4-10, 2025)
    {
      average: 85.09,
      createdAt: "2025-08-04T00:00:00.000Z",
      days: {
        sunday: 85.75,
        monday: 85.75,
        tuesday: 85.00,
        wednesday: 84.95,
        thursday: 85.10,
        friday: 84.55,
        saturday: 84.55
      },
      weekStart: "2025-08-04"
    },
    // Week 6 (Aug 11-17, 2025) - Incomplete week
    {
      average: 84.52,
      createdAt: "2025-08-11T00:00:00.000Z",
      days: {
        sunday: 84.95,
        monday: 84.55,
        tuesday: 84.55,
        wednesday: 84.75,
        thursday: 83.85,
        friday: 84.45
      },
      weekStart: "2025-08-11"
    }
  ];

  try {
    // Get current user data
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const currentData = userDoc.data();

    // Add new weight data to existing weightIns array
    const existingWeightIns = currentData.weightIns || [];
    const updatedWeightIns = [...existingWeightIns, ...newWeightIns];

    // Update user document with new weight data
    await setDoc(userDocRef, {
      ...currentData,
      weightIns: updatedWeightIns,
      currentWeight: 84.45, // Most recent weight
      lastWeightUpdate: "2025-08-16T00:00:00.000Z"
    }, { merge: true });

    console.log('Weight data successfully added to Firestore');
    return { success: true, addedWeeks: newWeightIns.length };

  } catch (error) {
    console.error('Error adding weight data to Firestore:', error);
    throw error;
  }
}

/**
 * Utility function to process weightIns data for display in components.
 * This can be used by any component that needs to display weight entries.
 */
export const processWeightInsForDisplay = (weightIns, limit = 20) => {
  if (!weightIns || !Array.isArray(weightIns) || weightIns.length === 0) {
    return [];
  }

  const entries = [];
  
  // Process each week's data
  weightIns.forEach(week => {
    if (!week.days || !week.weekStart) return;
    
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    dayKeys.forEach((dayKey, dayIndex) => {
      const weight = week.days[dayKey];
      if (weight !== null && weight !== undefined && !isNaN(weight)) {
        const weekStartDate = new Date(week.weekStart);
        const entryDate = new Date(weekStartDate);
        entryDate.setDate(weekStartDate.getDate() + dayIndex);
        
        entries.push({
          date: entryDate,
          weight: parseFloat(weight),
          weekStart: week.weekStart,
          dayKey: dayKey,
          weekAverage: week.average,
          formattedDate: formatDisplayDate(entryDate)
        });
      }
    });
  });

  // Sort by date (most recent first) and limit results
  entries.sort((a, b) => b.date - a.date);
  return entries.slice(0, limit);
};

/**
 * Helper function to format dates for display.
 */
const formatDisplayDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const entryDateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (entryDateStr === todayStr) {
    return "Today";
  } else if (entryDateStr === yesterdayStr) {
    return "Yesterday";
  } else {
    const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 7) {
      return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Adjusts weight value by increment within bounds.
 */
export const adjustWeight = (currentWeight, increment) => {
  const currentVal = parseFloat(currentWeight) || 0;
  return Math.max(0, Math.min(1000, currentVal + increment)).toFixed(1);
};

/**
 * Shows success notification with animation.
 */
export const showSuccessNotification = (setShowSuccess, successAnim) => {
  setShowSuccess(true);
  Animated.sequence([
    Animated.spring(successAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }),
    Animated.delay(2000),
    Animated.timing(successAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start(() => {
    setShowSuccess(false);
  });
};

/**
 * Handles tab navigation animation.
 */
export const handleTabPress = (tab, setActiveTab, tabIndicatorAnim) => {
  setActiveTab(tab);
  const tabIndex = ['input', 'week', 'trend'].indexOf(tab);
  Animated.timing(tabIndicatorAnim, {
    toValue: tabIndex,
    duration: 200,
    useNativeDriver: true,
  }).start();
};

/**
 * Gets color based on weight change relative to average.
 */
export const getWeightChangeColor = (weight, average) => {
  if (weight === null || weight === undefined || average === null || average === undefined) {
    return '#64748B';
  }
  const diff = weight - average;
  if (diff > 0.2) return '#EF4444';
  if (diff < -0.2) return '#22C55E';
  return '#94A3B8';
};

/**
 * Returns week days configuration.
 */
export const getWeekDays = () => ({
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dayKeys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
});

/**
 * Calculates trend statistics from weight data.
 */
export const calculateTrendStats = (trendData) => {
  if (!trendData || trendData.length === 0) {
    return {
      totalChange: 0,
      avgWeight: 0,
      minWeight: 0,
      maxWeight: 0,
      weightRange: 0,
      trendDirection: 'stable',
    };
  }

  const weights = trendData.map(d => d.weight).filter(w => w !== null && w !== undefined);
  if (weights.length === 0) {
     return {
      totalChange: 0,
      avgWeight: 0,
      minWeight: 0,
      maxWeight: 0,
      weightRange: 0,
      trendDirection: 'stable',
    };
  }

  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];

  const totalChange = parseFloat((lastWeight - firstWeight).toFixed(2));
  const avgWeight = parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = parseFloat((maxWeight - minWeight).toFixed(2));

  let trendDirection = 'stable';
  if (totalChange > 0.1) {
    trendDirection = 'up';
  } else if (totalChange < -0.1) {
    trendDirection = 'down';
  }

  if (weights.length >= 5) {
      const windowSize = Math.floor(weights.length * 0.3);
      const firstWindowAvg = weights.slice(0, Math.max(1, windowSize)).reduce((a, b) => a + b, 0) / Math.max(1, windowSize);
      const lastWindowAvg = weights.slice(-Math.max(1, windowSize)).reduce((a, b) => a + b, 0) / Math.max(1, windowSize);

      const windowDiff = parseFloat((lastWindowAvg - firstWindowAvg).toFixed(2));
      if (windowDiff > 0.1) {
          trendDirection = 'up';
      } else if (windowDiff < -0.1) {
          trendDirection = 'down';
      } else {
          trendDirection = 'stable';
      }
  }

  return {
    totalChange,
    avgWeight,
    minWeight,
    maxWeight,
    weightRange,
    trendDirection,
  };
};
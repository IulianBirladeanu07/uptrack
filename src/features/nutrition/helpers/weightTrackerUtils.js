import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import { Animated } from 'react-native';

export const validateWeight = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue > 0 && numValue <= 1000;
};

export const getWeekStartDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getDayKey = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

export const calculateWeeklyAverage = (weeklyWeights) => {
  const weights = Object.values(weeklyWeights).filter(w => w !== null && w !== undefined);
  if (weights.length === 0) return null;
  const sum = weights.reduce((acc, curr) => acc + curr, 0);
  return parseFloat((sum / weights.length).toFixed(2));
};

export const formatDate = (date) => {
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

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

      setCurrentWeight(data.currentWeight);
      setWeight(data.currentWeight ? data.currentWeight.toString() : '');

      const today = new Date(currentDate);
      const weekStartDate = getWeekStartDate(today).toISOString().split('T')[0];
      const currentWeek = weightIns.find(entry => entry.weekStart === weekStartDate);
      setWeeklyData(currentWeek);
      setWeeklyAverage(currentWeek?.average);

      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartDate = getWeekStartDate(lastWeekStart).toISOString().split('T')[0];
      const lastWeek = weightIns.find(entry => entry.weekStart === lastWeekStartDate);
      setLastWeekAverage(lastWeek?.average);

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

    await loadDataCallback();
  } catch (error) {
    console.error('Error saving weight: ', error);
    throw error;
  }
};

export const processWeightInsForDisplay = (weightIns, limit = 20) => {
  if (!weightIns || !Array.isArray(weightIns) || weightIns.length === 0) {
    return [];
  }

  const entries = [];
  
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

  entries.sort((a, b) => b.date - a.date);
  return entries.slice(0, limit);
};

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

export const adjustWeight = (currentWeight, increment) => {
  const currentVal = parseFloat(currentWeight) || 0;
  return Math.max(0, Math.min(1000, currentVal + increment)).toFixed(1);
};

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

export const handleTabPress = (tab, setActiveTab, tabIndicatorAnim) => {
  setActiveTab(tab);
  const tabIndex = ['input', 'week', 'trend'].indexOf(tab);
  Animated.timing(tabIndicatorAnim, {
    toValue: tabIndex,
    duration: 200,
    useNativeDriver: true,
  }).start();
};

export const getWeightChangeColor = (weight, average) => {
  if (weight === null || weight === undefined || average === null || average === undefined) {
    return '#64748B';
  }
  const diff = weight - average;
  if (diff > 0.2) return '#EF4444';
  if (diff < -0.2) return '#22C55E';
  return '#94A3B8';
};

export const getWeekDays = () => ({
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dayKeys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
});

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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import { Animated } from 'react-native';
import {
  evaluateWeeklyProgress,
  snapshotPreviousWeek,
  deriveStartWeight,
  getRollingWeekStats,
  checkAndRunWeeklyEval,
} from '../helpers/learningCompletionService';
import WeightService from '../services/weightService';

export const validateWeight = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 1000;
};

export const getWeekStartDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getLocalWeekStart = (date) => {
  const d = getWeekStartDate(date);
  d.setHours(0, 0, 0, 0);
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDayKey = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

export const calculateWeeklyAverage = (weeklyWeights) => {
  const weights = Object.values(weeklyWeights).filter(w => w != null && !isNaN(w));
  if (!weights.length) return null;
  return parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
};

export const formatDate = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const parseWeekStart = (weekStartStr) => {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  return { y, m, d };
};

export const loadUserWeightData = async (
  userId,
  currentDate,
  setCurrentWeight,
  setWeight,
  setWeeklyData,
  setWeeklyAverage,
  setLastWeekAverage,
  setTrendData,
  setWeightIns,
  setStartWeight,
  setGoalWeight,
  setGoalSwitchDate
) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const data      = userDoc.data();
    const weightIns = data.weightIns || [];

    setCurrentWeight(data.currentWeight);
    setWeight(data.currentWeight ? data.currentWeight.toString() : '');
    setWeightIns(weightIns);
    setStartWeight(data.startWeight ?? null);
    setGoalWeight(data.targetWeight ?? null);
    setGoalSwitchDate(data.goalSwitchDate ?? null);

    const today         = new Date(currentDate);
    const weekStartDate = getLocalWeekStart(today);
    const currentWeek   = weightIns.find(e => e.weekStart === weekStartDate);
    setWeeklyData(currentWeek);
    setWeeklyAverage(currentWeek?.average ?? null);

    const lastWeekStart     = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekStartDate = getLocalWeekStart(lastWeekStart);
    const lastWeek          = weightIns.find(e => e.weekStart === lastWeekStartDate);
    setLastWeekAverage(lastWeek?.average ?? null);

    const dayKeys    = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const allEntries = [];

    weightIns.forEach(week => {
      if (!week.days || !week.weekStart) return;
      const { y, m, d } = parseWeekStart(week.weekStart);
      dayKeys.forEach((dayKey, dayIndex) => {
        const weight = week.days[dayKey];
        if (weight == null || isNaN(weight)) return;
        const entryDate = new Date(y, m - 1, d + dayIndex);
        allEntries.push({
          date:   entryDate.toISOString(),
          weight: parseFloat(weight),
        });
      });
    });

    setTrendData(allEntries);
  } catch (error) {
    console.error('loadUserWeightData error:', error);
  }
};

export const handleSaveLogic = async (
  userId,
  weightValue,
  currentDate,
  setCurrentWeight,
  setWeeklyAverage,
  loadDataCallback,
  mealCache = null
) => {
  try {
    const today         = new Date(currentDate);
    const weekStartDate = getLocalWeekStart(today);
    const dayKey        = getDayKey(today);

    const userDocRef  = doc(db, 'users', userId);
    const userDoc     = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};

    const weightIns = Array.isArray(currentData.weightIns) ? [...currentData.weightIns] : [];

    let currentWeekIndex = weightIns.findIndex(e => e.weekStart === weekStartDate);

    if (currentWeekIndex >= 0) {
      weightIns[currentWeekIndex] = {
        ...weightIns[currentWeekIndex],
        days: { ...weightIns[currentWeekIndex].days, [dayKey]: weightValue },
      };
    } else {
      weightIns.push({
        weekStart: weekStartDate,
        days:      { [dayKey]: weightValue },
        createdAt: new Date().toISOString(),
      });
      currentWeekIndex = weightIns.length - 1;
    }

    const currentWeekEntry  = weightIns[currentWeekIndex];
    currentWeekEntry.average = calculateWeeklyAverage(currentWeekEntry.days);

    weightIns.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));

    const sortedIndex    = weightIns.findIndex(e => e.weekStart === weekStartDate);
    let weeklyTrend      = null;
    let lastWeekAverage  = null;

    if (sortedIndex > 0) {
      const prev = weightIns[sortedIndex - 1];
      if (prev?.average != null && currentWeekEntry.average != null) {
        lastWeekAverage = prev.average;
        weeklyTrend     = parseFloat((currentWeekEntry.average - prev.average).toFixed(2));
      }
    }

    const startWeight = currentData.startWeight ?? deriveStartWeight(weightIns);
    const isCurrentWeek = weekStartDate === getLocalWeekStart(new Date());
    const isNewWeek   = isCurrentWeek && sortedIndex > 0 && weightIns[sortedIndex - 1]?.weekStart !== currentData.lastSnapshotWeek;

    const dayKeyOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let latestEntryDate = null;
    weightIns.forEach(week => {
      if (!week.days || !week.weekStart) return;
      const [wy, wm, wd] = week.weekStart.split('-').map(Number);
      dayKeyOrder.forEach((dk, dayIndex) => {
        if (week.days[dk] == null) return;
        const entryDate = new Date(wy, wm - 1, wd + dayIndex);
        if (!latestEntryDate || entryDate > latestEntryDate) latestEntryDate = entryDate;
      });
    });

    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);
    const isMostRecentEntry = !latestEntryDate || todayDateOnly.getTime() >= latestEntryDate.getTime();

    const updateData = {
      weightIns,
      lastWeightUpdate: new Date().toISOString(),
      weeklyTrend,
      ...(isMostRecentEntry ? { currentWeight: weightValue } : {}),
      ...(startWeight && !currentData.startWeight ? { startWeight } : {}),
    };

    await setDoc(userDocRef, updateData, { merge: true });

    let updatedUserData = { ...currentData, ...updateData };

    if (mealCache && isNewWeek) {
      const prevWeekEntry = weightIns[sortedIndex - 1];
      const snapshot      = await snapshotPreviousWeek(userId, prevWeekEntry, mealCache, updatedUserData);

      if (snapshot) {
        updatedUserData = {
          ...updatedUserData,
          weeksSinceCutStart: snapshot.weeksSinceCutStart ?? updatedUserData.weeksSinceCutStart,
          weeklyNutrition: [
            ...(updatedUserData.weeklyNutrition || []).filter(w => w.weekStart !== snapshot.weekStart),
            snapshot,
          ].sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart)),
          lastSnapshotWeek: prevWeekEntry.weekStart,
        };

        await setDoc(userDocRef, { lastSnapshotWeek: prevWeekEntry.weekStart }, { merge: true });
      }

      const adjustment = await evaluateWeeklyProgress(userId, updatedUserData, mealCache, today);
      if (adjustment) {
        updatedUserData = { ...updatedUserData, ...adjustment };
      }
    }

    // Keep WeightService memory + AsyncStorage in sync so readers never see stale data
    await WeightService.setCachedUserData(userId, updatedUserData);

    if (isMostRecentEntry) {
      setCurrentWeight(weightValue);
    }
    setWeeklyAverage(currentWeekEntry.average);

    await loadDataCallback();
  } catch (error) {
    console.error('handleSaveLogic error:', error);
    throw error;
  }
};

export { checkAndRunWeeklyEval };

export const processWeightInsForDisplay = (weightIns, limit = 20) => {
  if (!weightIns?.length) return [];

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const entries = [];

  weightIns.forEach(week => {
    if (!week.days || !week.weekStart) return;
    const [y, m, d] = week.weekStart.split('-').map(Number);
    dayKeys.forEach((dayKey, dayIndex) => {
      const weight = week.days[dayKey];
      if (weight == null || isNaN(weight)) return;
      const entryDate = new Date(y, m - 1, d + dayIndex);
      entries.push({
        date:          entryDate,
        weight:        parseFloat(weight),
        weekStart:     week.weekStart,
        dayKey,
        dateKey:       entryDate.toISOString().split('T')[0],
        weekAverage:   week.average,
        formattedDate: formatDisplayDate(entryDate),
      });
    });
  });

  return entries.sort((a, b) => b.date - a.date).slice(0, limit);
};

const formatDisplayDate = (date) => {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString())     return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const daysAgo = Math.floor((today - date) / 86400000);
  if (daysAgo <= 7) return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const adjustWeight = (currentWeight, increment) =>
  Math.max(0, Math.min(1000, (parseFloat(currentWeight) || 0) + increment)).toFixed(1);

export const showSuccessNotification = (setShowSuccess, successAnim) => {
  setShowSuccess(true);
  Animated.sequence([
    Animated.spring(successAnim,  { toValue: 1, duration: 300, useNativeDriver: true, tension: 100, friction: 8 }),
    Animated.delay(2000),
    Animated.timing(successAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
  ]).start(() => setShowSuccess(false));
};

export const handleTabPress = (tab, setActiveTab, tabIndicatorAnim) => {
  setActiveTab(tab);
  Animated.timing(tabIndicatorAnim, {
    toValue:         ['input', 'week', 'trend'].indexOf(tab),
    duration:        200,
    useNativeDriver: true,
  }).start();
};

export const getWeightChangeColor = (weight, average) => {
  if (weight == null || average == null) return '#64748B';
  const diff = weight - average;
  if (diff >  0.2) return '#EF4444';
  if (diff < -0.2) return '#22C55E';
  return '#94A3B8';
};

export const getWeekDays = () => ({
  days:    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dayKeys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
});

export const calculateTrendStats = (trendData) => {
  if (!trendData?.length) return { totalChange: 0, avgWeight: 0, minWeight: 0, maxWeight: 0, weightRange: 0, trendDirection: 'stable' };

  const weights = trendData.map(d => d.weight).filter(w => w != null);
  if (!weights.length) return { totalChange: 0, avgWeight: 0, minWeight: 0, maxWeight: 0, weightRange: 0, trendDirection: 'stable' };

  const totalChange = parseFloat((weights[weights.length - 1] - weights[0]).toFixed(2));
  const avgWeight   = parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
  const minWeight   = Math.min(...weights);
  const maxWeight   = Math.max(...weights);
  const weightRange = parseFloat((maxWeight - minWeight).toFixed(2));

  let trendDirection = 'stable';
  if (weights.length >= 5) {
    const windowSize = Math.max(1, Math.floor(weights.length * 0.3));
    const firstAvg   = weights.slice(0, windowSize).reduce((a, b) => a + b, 0) / windowSize;
    const lastAvg    = weights.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    const diff       = parseFloat((lastAvg - firstAvg).toFixed(2));
    trendDirection   = diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'stable';
  } else {
    trendDirection = totalChange > 0.1 ? 'up' : totalChange < -0.1 ? 'down' : 'stable';
  }

  return { totalChange, avgWeight, minWeight, maxWeight, weightRange, trendDirection };
};
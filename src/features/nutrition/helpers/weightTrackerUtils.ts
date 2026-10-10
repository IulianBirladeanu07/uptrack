import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Animated } from 'react-native';
import { db } from '../../auth/services/firebaseConfigService';
import {
  evaluateWeeklyProgress,
  snapshotPreviousWeek,
  deriveStartWeight,
  checkAndRunWeeklyEval,
} from '../helpers/learningCompletionService';
import WeightService from '../services/weightService';
import type { DateInput, DayKey, MealCacheLike, Numeric, UserData, WeeklySnapshot, WeightInWeek } from '../../../shared/types';

type Setter<T> = (value: T) => void;
type WeightTab = 'input' | 'week' | 'trend';
type TrendEntry = { date: string; weight: number };
type TrendStats = {
  totalChange: number;
  avgWeight: number;
  minWeight: number;
  maxWeight: number;
  weightRange: number;
  trendDirection: 'up' | 'down' | 'stable';
};
export type DisplayEntry = {
  date: Date;
  weight: number;
  weekStart: string;
  dayKey: DayKey;
  dateKey: string;
  weekAverage: number | null | undefined;
  formattedDate: string;
};

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SUNDAY_FIRST: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const EMPTY_STATS: TrendStats = { totalChange: 0, avgWeight: 0, minWeight: 0, maxWeight: 0, weightRange: 0, trendDirection: 'stable' };

export const validateWeight = (value: string | number): boolean => {
  const num = parseFloat(String(value));
  return !isNaN(num) && num > 0 && num <= 1000;
};

export const getWeekStartDate = (date: DateInput): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getLocalWeekStart = (date: DateInput): string => {
  const d = getWeekStartDate(date);
  d.setHours(0, 0, 0, 0);
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDayKey = (date: Date): DayKey => SUNDAY_FIRST[date.getDay()];

export const calculateWeeklyAverage = (weeklyWeights: NonNullable<WeightInWeek['days']>): number | null => {
  const weights = Object.values(weeklyWeights).filter((w): w is Numeric => w != null && !isNaN(Number(w))).map(Number);
  if (!weights.length) return null;
  return parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
};

export const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const parseWeekStart = (weekStartStr: string) => {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  return { y, m, d };
};

export const loadUserWeightData = async (
  userId: string,
  currentDate: DateInput,
  setCurrentWeight: Setter<Numeric | null | undefined>,
  setWeight: Setter<string>,
  setWeeklyData: Setter<WeightInWeek | undefined>,
  setWeeklyAverage: Setter<number | null>,
  setLastWeekAverage: Setter<number | null>,
  setTrendData: Setter<TrendEntry[]>,
  setWeightIns: Setter<WeightInWeek[]>,
  setStartWeight: Setter<Numeric | null>,
  setGoalWeight: Setter<Numeric | null>,
  setGoalSwitchDate: Setter<string | null>,
): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const data      = userDoc.data() as UserData;
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

    const allEntries: TrendEntry[] = [];

    weightIns.forEach(week => {
      if (!week.days || !week.weekStart) return;
      const { y, m, d } = parseWeekStart(week.weekStart);
      DAY_KEYS.forEach((dayKey, dayIndex) => {
        const weight = week.days?.[dayKey];
        if (weight == null || isNaN(Number(weight))) return;
        const entryDate = new Date(y, m - 1, d + dayIndex);
        allEntries.push({
          date:   entryDate.toISOString(),
          weight: parseFloat(String(weight)),
        });
      });
    });

    setTrendData(allEntries);
  } catch (error) {
    console.error('loadUserWeightData error:', error);
  }
};

export const handleSaveLogic = async (
  userId: string,
  weightValue: number,
  currentDate: DateInput,
  setCurrentWeight: Setter<number>,
  setWeeklyAverage: Setter<number | null>,
  loadDataCallback: () => Promise<void> | void,
  mealCache: MealCacheLike | null = null,
): Promise<void> => {
  try {
    const today         = new Date(currentDate);
    const weekStartDate = getLocalWeekStart(today);
    const dayKey        = getDayKey(today);

    const userDocRef  = doc(db, 'users', userId);
    const userDoc     = await getDoc(userDocRef);
    const currentData = (userDoc.exists() ? userDoc.data() : {}) as UserData;

    const weightIns: WeightInWeek[] = Array.isArray(currentData.weightIns) ? [...currentData.weightIns] : [];

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
    currentWeekEntry.average = calculateWeeklyAverage(currentWeekEntry.days ?? {});

    weightIns.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    const sortedIndex = weightIns.findIndex(e => e.weekStart === weekStartDate);
    let weeklyTrend: number | null = null;

    if (sortedIndex > 0) {
      const prev = weightIns[sortedIndex - 1];
      if (prev?.average != null && currentWeekEntry.average != null) {
        weeklyTrend = parseFloat((currentWeekEntry.average - prev.average).toFixed(2));
      }
    }

    const startWeight = currentData.startWeight ?? deriveStartWeight(weightIns);
    const isCurrentWeek = weekStartDate === getLocalWeekStart(new Date());
    const isNewWeek   = isCurrentWeek && sortedIndex > 0 && weightIns[sortedIndex - 1]?.weekStart !== currentData.lastSnapshotWeek;

    let latestEntryDate: Date | null = null;
    for (const week of weightIns) {
      if (!week.days || !week.weekStart) continue;
      const [wy, wm, wd] = week.weekStart.split('-').map(Number);
      for (let dayIndex = 0; dayIndex < DAY_KEYS.length; dayIndex++) {
        if (week.days[DAY_KEYS[dayIndex]] == null) continue;
        const entryDate = new Date(wy, wm - 1, wd + dayIndex);
        if (!latestEntryDate || entryDate > latestEntryDate) latestEntryDate = entryDate;
      }
    }

    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);
    const isMostRecentEntry = !latestEntryDate || todayDateOnly.getTime() >= latestEntryDate.getTime();

    const updateData: Partial<UserData> = {
      weightIns,
      lastWeightUpdate: new Date().toISOString(),
      weeklyTrend,
      ...(isMostRecentEntry ? { currentWeight: weightValue } : {}),
      ...(startWeight && !currentData.startWeight ? { startWeight } : {}),
    };

    await setDoc(userDocRef, updateData, { merge: true });

    let updatedUserData: UserData = { ...currentData, ...updateData };

    if (mealCache && isNewWeek) {
      const prevWeekEntry = weightIns[sortedIndex - 1];
      const snapshot      = await snapshotPreviousWeek(userId, prevWeekEntry, mealCache, updatedUserData);

      if (snapshot) {
        const merged: WeeklySnapshot[] = [
          ...(updatedUserData.weeklyNutrition || []).filter(w => w.weekStart !== snapshot.weekStart),
          snapshot,
        ].sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

        updatedUserData = {
          ...updatedUserData,
          weeksSinceCutStart: snapshot.weeksSinceCutStart ?? updatedUserData.weeksSinceCutStart,
          weeklyNutrition: merged,
          lastSnapshotWeek: prevWeekEntry.weekStart,
        };

        await setDoc(userDocRef, { lastSnapshotWeek: prevWeekEntry.weekStart }, { merge: true });
      }

      const adjustment = await evaluateWeeklyProgress(userId, updatedUserData, mealCache, today);
      if (adjustment) {
        updatedUserData = { ...updatedUserData, ...adjustment };
      }
    }

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

const formatDisplayDate = (date: Date): string => {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString())     return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const daysAgo = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (daysAgo <= 7) return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const processWeightInsForDisplay = (weightIns: WeightInWeek[] | null | undefined, limit = 20): DisplayEntry[] => {
  if (!weightIns?.length) return [];

  const entries: DisplayEntry[] = [];

  weightIns.forEach(week => {
    if (!week.days || !week.weekStart) return;
    const [y, m, d] = week.weekStart.split('-').map(Number);
    DAY_KEYS.forEach((dayKey, dayIndex) => {
      const weight = week.days?.[dayKey];
      if (weight == null || isNaN(Number(weight))) return;
      const entryDate = new Date(y, m - 1, d + dayIndex);
      entries.push({
        date:          entryDate,
        weight:        parseFloat(String(weight)),
        weekStart:     week.weekStart,
        dayKey,
        dateKey:       entryDate.toISOString().split('T')[0],
        weekAverage:   week.average,
        formattedDate: formatDisplayDate(entryDate),
      });
    });
  });

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
};

export const getRollingAverageWeight = (weightIns: WeightInWeek[] | null | undefined, days = 7): number | null => {
  const entries: { date: Date; weight: number }[] = [];

  (weightIns || []).forEach(week => {
    if (!week.days || !week.weekStart) return;
    const [y, m, d] = week.weekStart.split('-').map(Number);
    DAY_KEYS.forEach((dayKey, dayIndex) => {
      const weight = week.days?.[dayKey];
      if (weight == null || isNaN(Number(weight))) return;
      entries.push({
        date:   new Date(y, m - 1, d + dayIndex),
        weight: parseFloat(String(weight)),
      });
    });
  });

  if (!entries.length) return null;

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  const recent = entries.slice(-days);

  return parseFloat((recent.reduce((sum, e) => sum + e.weight, 0) / recent.length).toFixed(2));
};

export const adjustWeight = (currentWeight: string | number | null | undefined, increment: number): string =>
  Math.max(0, Math.min(1000, (parseFloat(String(currentWeight)) || 0) + increment)).toFixed(1);

export const showSuccessNotification = (setShowSuccess: Setter<boolean>, successAnim: Animated.Value): void => {
  setShowSuccess(true);
  Animated.sequence([
    Animated.spring(successAnim,  { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
    Animated.delay(2000),
    Animated.timing(successAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
  ]).start(() => setShowSuccess(false));
};

export const handleTabPress = (tab: WeightTab, setActiveTab: Setter<WeightTab>, tabIndicatorAnim: Animated.Value): void => {
  setActiveTab(tab);
  Animated.timing(tabIndicatorAnim, {
    toValue:         ['input', 'week', 'trend'].indexOf(tab),
    duration:        200,
    useNativeDriver: true,
  }).start();
};

export const getWeightChangeColor = (weight: number | null | undefined, average: number | null | undefined): string => {
  if (weight == null || average == null) return '#64748B';
  const diff = weight - average;
  if (diff >  0.2) return '#EF4444';
  if (diff < -0.2) return '#22C55E';
  return '#94A3B8';
};

export const getWeekDays = () => ({
  days:    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dayKeys: [...DAY_KEYS],
});

export const calculateTrendStats = (trendData: { weight: number | null | undefined }[] | null | undefined): TrendStats => {
  if (!trendData?.length) return { ...EMPTY_STATS };

  const weights = trendData.map(d => d.weight).filter((w): w is number => w != null);
  if (!weights.length) return { ...EMPTY_STATS };

  const totalChange = parseFloat((weights[weights.length - 1] - weights[0]).toFixed(2));
  const avgWeight   = parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
  const minWeight   = Math.min(...weights);
  const maxWeight   = Math.max(...weights);
  const weightRange = parseFloat((maxWeight - minWeight).toFixed(2));

  let trendDirection: TrendStats['trendDirection'] = 'stable';
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

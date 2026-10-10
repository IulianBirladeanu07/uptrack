import type { DayKey, StatusBadge, TrendPoint, WeightEntry, WeightInWeek } from '../../../shared/types';

const EMA_ALPHA = 0.1;
const PLATEAU_THRESHOLD_PERCENT = 0.0015;
const DAY_KEYS_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const flattenWeightInsChronological = (weightIns: WeightInWeek[] | null | undefined): WeightEntry[] => {
  if (!weightIns?.length) return [];

  const entries: WeightEntry[] = [];
  weightIns.forEach(week => {
    const days = week.days;
    if (!days || !week.weekStart) return;
    const [y, m, d] = week.weekStart.split('-').map(Number);
    DAY_KEYS_ORDER.forEach((dayKey, index) => {
      const weight = days[dayKey];
      if (weight == null || isNaN(Number(weight))) return;
      const date = new Date(y, m - 1, d + index);
      entries.push({ date, weight: parseFloat(String(weight)) });
    });
  });

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const computeEmaSeries = (chronologicalEntries: WeightEntry[], alpha: number = EMA_ALPHA): TrendPoint[] => {
  let trend: number | null = null;

  return chronologicalEntries.map(entry => {
    trend = trend == null ? entry.weight : trend + alpha * (entry.weight - trend);
    return { date: entry.date, rawWeight: entry.weight, trendWeight: parseFloat(trend.toFixed(2)) };
  });
};

export const buildWeightTrendSeries = (weightIns: WeightInWeek[] | null | undefined, alpha: number = EMA_ALPHA): TrendPoint[] =>
  computeEmaSeries(flattenWeightInsChronological(weightIns), alpha);

export const getCurrentTrendWeight = (weightIns: WeightInWeek[] | null | undefined): number | null => {
  const series = buildWeightTrendSeries(weightIns);
  return series.length ? series[series.length - 1].trendWeight : null;
};

export const getRecentAverageWeight = (weightIns: WeightInWeek[] | null | undefined, days = 7, minEntries = 3): number | null => {
  const entries = flattenWeightInsChronological(weightIns);
  if (!entries.length) return null;

  const cutoff = entries[entries.length - 1].date.getTime() - days * 86400000;
  const recent = entries.filter(e => e.date.getTime() > cutoff);
  if (recent.length < minEntries) return null;

  return parseFloat((recent.reduce((sum, e) => sum + e.weight, 0) / recent.length).toFixed(2));
};

export const shiftWeekStart = (weekStart: string, n: number): string => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d + 7 * n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getWeekAverageWeight = (weightIns: WeightInWeek[] | null | undefined, weekStart: string, minEntries = 3): number | null => {
  const days = (weightIns || []).find(w => w.weekStart === weekStart)?.days;
  if (!days) return null;
  const v = DAY_KEYS_ORDER.map(k => days[k]).filter((x): x is number | string => x != null && !isNaN(Number(x))).map(x => parseFloat(String(x)));
  if (v.length < minEntries) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
};

export const getWindowRateKgPerWeek = (weightIns: WeightInWeek[] | null | undefined, firstWeekStart: string, weeks: number): number | null => {
  const before = getWeekAverageWeight(weightIns, shiftWeekStart(firstWeekStart, -1));
  const last = getWeekAverageWeight(weightIns, shiftWeekStart(firstWeekStart, weeks - 1));
  if (before == null || last == null) return null;
  return parseFloat(((last - before) / weeks).toFixed(3));
};

export const calculateWeeklyRateOfChange = (trendSeries: TrendPoint[] | null | undefined, windowDays = 14): number | null => {
  if (!trendSeries || trendSeries.length < 4) return null;

  const cutoff = trendSeries[trendSeries.length - 1].date.getTime() - windowDays * 86400000;
  const windowed = trendSeries.filter(p => p.date.getTime() >= cutoff);
  if (windowed.length < 4) return null;

  const t0 = windowed[0].date.getTime();
  const xs = windowed.map(p => (p.date.getTime() - t0) / 86400000);
  const ys = windowed.map(p => p.trendWeight);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slopePerDay = (n * sumXY - sumX * sumY) / denom;
  return slopePerDay * 7;
};

export const detectPlateau = (actualWeeklyRateKg: number | null | undefined, currentWeight: number | null | undefined): boolean => {
  if (actualWeeklyRateKg == null || !currentWeight) return false;
  const threshold = currentWeight * PLATEAU_THRESHOLD_PERCENT;
  return Math.abs(actualWeeklyRateKg) < threshold;
};

export const isGoalReached = (currentTrendWeight: number | null | undefined, targetWeight: number | null | undefined, toleranceKg = 0.5, planType: string | null = null): boolean => {
  if (currentTrendWeight == null || targetWeight == null) return false;
  if (planType === 'weight_loss') return currentTrendWeight <= targetWeight + toleranceKg;
  if (planType === 'muscle_gain') return currentTrendWeight >= targetWeight - toleranceKg;
  return Math.abs(currentTrendWeight - targetWeight) <= toleranceKg;
};

export const isSuspiciousWeightEntry = (newWeight: number, currentTrendWeight: number | null | undefined, maxPercentDelta = 0.05): boolean => {
  if (currentTrendWeight == null) return false;
  const delta = Math.abs(newWeight - currentTrendWeight);
  return delta > currentTrendWeight * maxPercentDelta;
};

const PHASE_LABEL: Record<string, string> = {
  weight_loss: 'Cutting',
  muscle_gain: 'Bulking',
  maintenance: 'Maintaining',
};

export const getPhaseLabel = (planType: string | null | undefined): string => (planType ? PHASE_LABEL[planType] : undefined) ?? 'Maintaining';

export const getWeightPhaseStatus = (weightDeltaKg: number | null | undefined, targetRateKgPerWeek: number | null | undefined, toleranceBand = 0.15): StatusBadge | null => {
  if (weightDeltaKg == null || targetRateKgPerWeek == null) return null;

  const sameDirection =
    (targetRateKgPerWeek < 0 && weightDeltaKg <= 0) ||
    (targetRateKgPerWeek > 0 && weightDeltaKg >= 0) ||
    (targetRateKgPerWeek === 0 && Math.abs(weightDeltaKg) < toleranceBand);

  if (!sameDirection) {
    return {
      type: 'bad',
      icon: 'alert-circle',
      label: 'Off track',
      message: `Trending opposite to your ${targetRateKgPerWeek > 0 ? '+' : ''}${targetRateKgPerWeek.toFixed(2)} kg/wk goal`,
    };
  }

  const diff = Math.abs(weightDeltaKg) - Math.abs(targetRateKgPerWeek);

  if (Math.abs(diff) < toleranceBand) {
    return {
      type: 'good',
      icon: 'checkmark-circle',
      label: 'On track',
      message: `${weightDeltaKg > 0 ? '+' : ''}${weightDeltaKg.toFixed(2)} kg this week, right on pace`,
    };
  }

  if (diff < 0) {
    return {
      type: 'warn',
      icon: 'time',
      label: 'Behind pace',
      message: `Trending slower than your ${targetRateKgPerWeek > 0 ? '+' : ''}${targetRateKgPerWeek.toFixed(2)} kg/wk goal`,
    };
  }

  return {
    type: 'good',
    icon: 'trending-up',
    label: 'Ahead of pace',
    message: `Trending faster than your ${targetRateKgPerWeek > 0 ? '+' : ''}${targetRateKgPerWeek.toFixed(2)} kg/wk goal`,
  };
};

const STRENGTH_STATUS_TABLE: Record<string, Record<'up' | 'flat' | 'down', StatusBadge>> = {
  muscle_gain: {
    up: { type: 'good', icon: 'trending-up', label: 'Working', message: 'Surplus is converting to strength' },
    flat: { type: 'warn', icon: 'remove-circle', label: 'Stalling', message: 'Weight is up but strength is flat — mostly fat, not muscle' },
    down: { type: 'bad', icon: 'trending-down', label: 'Losing strength', message: 'Losing strength on a surplus — check recovery and programming' },
  },
  weight_loss: {
    up: { type: 'good', icon: 'trending-up', label: 'Bonus gains', message: 'Getting stronger on a deficit' },
    flat: { type: 'good', icon: 'shield-checkmark', label: 'Holding', message: 'Strength holding steady through the cut' },
    down: { type: 'bad', icon: 'trending-down', label: 'Losing muscle', message: 'Strength dropping fast — the deficit may be too aggressive' },
  },
  maintenance: {
    up: { type: 'good', icon: 'trending-up', label: 'Free progress', message: 'Getting stronger while holding weight steady' },
    flat: { type: 'good', icon: 'remove', label: 'Steady', message: 'Strength holding steady' },
    down: { type: 'warn', icon: 'time', label: 'Slipping', message: 'Strength trending down while maintaining' },
  },
};

export const getStrengthPhaseStatus = (e1rmDeltaKg: number | null | undefined, planType: string | null | undefined, currentE1rmKg: number | null = null, toleranceBand = 1.5): StatusBadge | null => {
  if (e1rmDeltaKg == null) return null;

  const band = currentE1rmKg != null ? Math.max(toleranceBand, currentE1rmKg * 0.02) : toleranceBand;
  const direction = Math.abs(e1rmDeltaKg) < band ? 'flat' : e1rmDeltaKg > 0 ? 'up' : 'down';

  return ((planType ? STRENGTH_STATUS_TABLE[planType] : undefined) ?? STRENGTH_STATUS_TABLE.maintenance)[direction];
};

export const getPlanConfidence = (trendSeries: TrendPoint[], weeklyCalorieData: { daysLogged?: number }[] | null | undefined): 'calibrated' | 'estimated' => {
  const MIN_WINDOW_DAYS = 14;
  const MIN_LOGGED_DAYS = 10;

  const cutoff = Date.now() - MIN_WINDOW_DAYS * 86400000;
  const recentWeightDays = trendSeries.filter(p => p.date.getTime() >= cutoff).length;
  const recentCalorieDays = (weeklyCalorieData || []).reduce((sum, w) => sum + (w.daysLogged || 0), 0);

  return (recentWeightDays >= MIN_LOGGED_DAYS && recentCalorieDays >= MIN_LOGGED_DAYS) ? 'calibrated' : 'estimated';
};
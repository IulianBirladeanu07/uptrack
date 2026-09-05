const EMA_ALPHA = 0.1;
const PLATEAU_THRESHOLD_PERCENT = 0.0015;
const DAY_KEYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const flattenWeightInsChronological = (weightIns) => {
  if (!weightIns?.length) return [];

  const entries = [];
  weightIns.forEach(week => {
    if (!week.days || !week.weekStart) return;
    const [y, m, d] = week.weekStart.split('-').map(Number);
    DAY_KEYS_ORDER.forEach((dayKey, index) => {
      const weight = week.days[dayKey];
      if (weight == null || isNaN(weight)) return;
      const date = new Date(y, m - 1, d + index);
      entries.push({ date, weight: parseFloat(weight) });
    });
  });

  return entries.sort((a, b) => a.date - b.date);
};

export const computeEmaSeries = (chronologicalEntries, alpha = EMA_ALPHA) => {
  let trend = null;

  return chronologicalEntries.map(entry => {
    trend = trend == null ? entry.weight : trend + alpha * (entry.weight - trend);
    return { date: entry.date, rawWeight: entry.weight, trendWeight: parseFloat(trend.toFixed(2)) };
  });
};

export const buildWeightTrendSeries = (weightIns, alpha = EMA_ALPHA) =>
  computeEmaSeries(flattenWeightInsChronological(weightIns), alpha);

export const getCurrentTrendWeight = (weightIns) => {
  const series = buildWeightTrendSeries(weightIns);
  return series.length ? series[series.length - 1].trendWeight : null;
};

export const calculateWeeklyRateOfChange = (trendSeries, windowDays = 14) => {
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

export const detectPlateau = (actualWeeklyRateKg, currentWeight) => {
  if (actualWeeklyRateKg == null || !currentWeight) return false;
  const threshold = currentWeight * PLATEAU_THRESHOLD_PERCENT;
  return Math.abs(actualWeeklyRateKg) < threshold;
};

export const isGoalReached = (currentTrendWeight, targetWeight, toleranceKg = 0.5) => {
  if (currentTrendWeight == null || targetWeight == null) return false;
  return Math.abs(currentTrendWeight - targetWeight) <= toleranceKg;
};

export const isSuspiciousWeightEntry = (newWeight, currentTrendWeight, maxPercentDelta = 0.05) => {
  if (currentTrendWeight == null) return false;
  const delta = Math.abs(newWeight - currentTrendWeight);
  return delta > currentTrendWeight * maxPercentDelta;
};

export const getPlanConfidence = (trendSeries, weeklyCalorieData) => {
  const MIN_WINDOW_DAYS = 14;
  const MIN_LOGGED_DAYS = 10;

  const cutoff = Date.now() - MIN_WINDOW_DAYS * 86400000;
  const recentWeightDays = trendSeries.filter(p => p.date.getTime() >= cutoff).length;
  const recentCalorieDays = (weeklyCalorieData || []).reduce((sum, w) => sum + (w.daysLogged || 0), 0);

  return (recentWeightDays >= MIN_LOGGED_DAYS && recentCalorieDays >= MIN_LOGGED_DAYS) ? 'calibrated' : 'estimated';
};
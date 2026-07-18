const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export const buildWeightIns = (startDateStr, dailyWeights) => {
  const weeks = [];
  for (let i = 0; i < dailyWeights.length; i += 7) {
    const weekWeights = dailyWeights.slice(i, i + 7);
    const days = {};
    weekWeights.forEach((w, idx) => {
      if (w != null) days[DAY_KEYS[idx]] = w;
    });
    weeks.push({ weekStart: addDays(startDateStr, i), days });
  }
  return weeks;
};

export const buildDailyWeights = (startWeight, dailyRateKg, numDays, noisePattern = [0]) => {
  const out = [];
  for (let i = 0; i < numDays; i++) {
    const base = startWeight + dailyRateKg * i;
    const noise = noisePattern[i % noisePattern.length];
    out.push(parseFloat((base + noise).toFixed(1)));
  }
  return out;
};

export const REALISTIC_DAILY_NOISE = [0.3, -0.1, 0.1, -0.4, 0.2, 0.4, -0.5];

export const buildWeeklyCalorieData = (weeks) => weeks.map(w => ({
  daysLogged: w.daysLogged ?? 6,
  avgCalories: w.avgCalories,
  avgSteps: w.avgSteps ?? 0,
}));
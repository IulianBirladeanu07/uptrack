import type { DailySteps, WeeklySnapshot } from '../../../shared/types';
import { formatLocalDateKey } from '../../../shared/utils/localDateKey';

export type StepStats = { days: number; total: number; avg: number };

export type StepSnapshot = {
  weekStart?: string;
  daysLoggedSteps?: number | null;
  avgSteps?: number | null;
  totalSteps?: number | null;
};

export type WeeklyStepSnapshotUpdate = {
  weeklyNutrition: WeeklySnapshot[];
  changed: Record<string, StepStats>;
};

export const MIN_VALID_STEPS = 1000;
export const MIN_STEP_DAYS = 4;

const toKey = (d: Date): string => formatLocalDateKey(d);

export const weekDayKeys = (weekStart: string): string[] => {
  const [y, m, d] = String(weekStart).split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => toKey(new Date(y, m - 1, d + i)));
};

export const weekStepStats = (
  dailySteps: DailySteps | null | undefined,
  weekStart: string,
  skipKey?: string | null,
): StepStats => {
  const vals = weekDayKeys(weekStart)
    .filter(k => k !== skipKey)
    .map(k => Number(dailySteps?.[k]) || 0)
    .filter(v => v >= MIN_VALID_STEPS);
  const total = vals.reduce((s, v) => s + v, 0);
  return { days: vals.length, total, avg: vals.length ? Math.round(total / vals.length) : 0 };
};

export const recomputeChangedWeeklySteps = (
  weeklyNutrition: WeeklySnapshot[] | null | undefined,
  dailySteps: DailySteps,
  changedDates: string[],
): WeeklyStepSnapshotUpdate | null => {
  if (!weeklyNutrition?.length || !changedDates.length) return null;
  const changedDateKeys = new Set(changedDates);
  const changed: Record<string, StepStats> = {};
  const updated = weeklyNutrition.map(snapshot => {
    if (!weekDayKeys(snapshot.weekStart).some(date => changedDateKeys.has(date))) return snapshot;
    const stats = weekStepStats(dailySteps, snapshot.weekStart);
    if (
      snapshot.daysLoggedSteps === stats.days &&
      snapshot.avgSteps === stats.avg &&
      snapshot.totalSteps === stats.total
    ) return snapshot;
    changed[snapshot.weekStart] = stats;
    return {
      ...snapshot,
      daysLoggedSteps: stats.days,
      avgSteps: stats.avg,
      totalSteps: stats.total,
    };
  });
  return Object.keys(changed).length ? { weeklyNutrition: updated, changed } : null;
};

export const overlayWeekSteps = <T extends StepSnapshot | null | undefined>(
  snap: T,
  dailySteps: DailySteps | null | undefined,
): T | (NonNullable<T> & StepSnapshot) => {
  if (!snap?.weekStart || !dailySteps) return snap;
  const s = weekStepStats(dailySteps, snap.weekStart);
  if (
    s.days === (snap.daysLoggedSteps || 0) &&
    s.avg === (snap.avgSteps || 0) &&
    s.total === (snap.totalSteps || 0)
  ) return snap;
  return { ...snap, daysLoggedSteps: s.days, avgSteps: s.avg, totalSteps: s.total };
};

export const diffPastSteps = (
  stored: DailySteps | null | undefined,
  incoming: Record<string, unknown> | null | undefined,
  todayKey?: string | null,
): DailySteps => {
  const out: DailySteps = {};
  const s = stored || {};
  Object.entries(incoming || {}).forEach(([k, v]) => {
    if (todayKey && k >= todayKey) return;
    if (v == null) return;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 0) return;
    if (s[k] == null) {
      if (n >= MIN_VALID_STEPS) out[k] = n;
    } else if (n !== s[k]) {
      out[k] = n;
    }
  });
  return out;
};

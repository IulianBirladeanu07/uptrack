import type { DailySteps } from '../../../shared/types';

export type StepStats = { days: number; total: number; avg: number };

export type StepSnapshot = {
  weekStart?: string;
  daysLoggedSteps?: number | null;
  avgSteps?: number | null;
  totalSteps?: number | null;
};

export const MIN_VALID_STEPS = 1000;
export const MIN_STEP_DAYS = 4;

const pad = (n: number): string => String(n).padStart(2, '0');
const toKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const weekDayKeys = (weekStart: string): string[] => {
  const [y, m, d] = String(weekStart).split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => toKey(new Date(y, m - 1, d + i)));
};

export const weekStepStats = (
  dailySteps: DailySteps | null | undefined,
  weekStart: string,
  getExtra?: ((k: string) => number | string | null | undefined) | null,
  skipKey?: string | null,
): StepStats => {
  const vals = weekDayKeys(weekStart)
    .filter(k => k !== skipKey)
    .map(k => Math.max(Number(dailySteps?.[k]) || 0, Number(getExtra?.(k)) || 0))
    .filter(v => v >= MIN_VALID_STEPS);
  const total = vals.reduce((s, v) => s + v, 0);
  return { days: vals.length, total, avg: vals.length ? Math.round(total / vals.length) : 0 };
};

export const overlayWeekSteps = <T extends StepSnapshot | null | undefined>(
  snap: T,
  dailySteps: DailySteps | null | undefined,
): T | (NonNullable<T> & StepSnapshot) => {
  if (!snap?.weekStart || !dailySteps) return snap;
  const s = weekStepStats(dailySteps, snap.weekStart);
  if (s.days <= (snap.daysLoggedSteps || 0)) return snap;
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
    const n = Math.round(Number(v));
    if (!(n >= MIN_VALID_STEPS)) return;
    if (s[k] == null || n > s[k]) out[k] = n;
  });
  return out;
};

import { flattenWeightInsChronological, shiftWeekStart } from './weightTrendEngine';
import { MIN_STEP_DAYS } from '../../nutrition/helpers/stepStats';
import type { MaintenanceEstimate, WeekStats, WeightEntry, WeightInWeek } from '../../../shared/types';

type MaybeWeek = WeekStats | null | undefined;
type Pt = { x: number; y: number };
type Fit = { slope: number; se: number; df: number };

export const KCAL_PER_KG = 7700;
export const REGRESSION_MIN_WEEKS = 4;
export const REGRESSION_MAX_WEEKS = 4;
export const REGRESSION_MIN_LOGGED_DAYS = 4;
export const REGRESSION_STEPS_SHIFT = 0.25;

const DAY_MS = 86400000;
const MIN_WEIGHINS_PER_WEEK = 2;
const T_CRIT = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086];

const tCrit = (df: number): number | null => (df < 1 ? null : df <= T_CRIT.length ? T_CRIT[df - 1] : df <= 40 ? 2.04 : 1.98);

const parseKey = (k: string): Date => {
  const [y, m, d] = String(k).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;

const stepsOf = (w: WeekStats): number | null => {
  const s = w.avgSteps;
  return s != null && s > 0 && (w.daysLoggedSteps == null || w.daysLoggedSteps >= MIN_STEP_DAYS) ? s : null;
};

const isUsable = (w: MaybeWeek): w is WeekStats => !!(w && w.weekStart && w.daysLogged >= REGRESSION_MIN_LOGGED_DAYS && w.avgCalories > 0);

const toKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isComplete = (weekStart: string, now: Date): boolean => shiftWeekStart(weekStart, 1) <= toKey(now);

const contiguousRun = (weeks: MaybeWeek[], now: Date): WeekStats[] => {
  const done = weeks.filter((w): w is WeekStats => !!(w?.weekStart && isComplete(w.weekStart, now)));
  let run: WeekStats[] = [];
  for (let i = done.length - 1; i >= 0 && run.length < REGRESSION_MAX_WEEKS; i--) {
    if (!isUsable(done[i])) break;
    if (run.length && shiftWeekStart(done[i].weekStart, 1) !== run[0].weekStart) break;
    run = [done[i], ...run];
  }
  return run;
};

const stableRun = (run: WeekStats[]): WeekStats[] | null => {
  if (run.length < REGRESSION_MIN_WEEKS) return null;
  const steps = run.map(stepsOf).filter((v): v is number => v != null);
  if (!steps.length) return run;
  const ref = mean(steps);
  const latest = stepsOf(run[run.length - 1]);
  if (latest != null && Math.abs(latest - ref) / ref > REGRESSION_STEPS_SHIFT) return null;
  return run;
};

const fitLine = (pts: Pt[]): Fit | null => {
  const n = pts.length;
  if (n < 3) return null;
  const mx = mean(pts.map(p => p.x));
  const my = mean(pts.map(p => p.y));
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
  const intercept = my - slope * mx;
  const ss = pts.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const df = n - 2;
  return { slope, se: Math.sqrt(ss / df / sxx), df };
};

const fitWindow = (entries: WeightEntry[], run: WeekStats[], n: number): MaintenanceEstimate | null => {
  const weeks = run.slice(-n);
  const start = parseKey(weeks[0].weekStart);
  const end = parseKey(shiftWeekStart(weeks[n - 1].weekStart, 1));
  const pts: Pt[] = entries
    .filter(e => e.date >= start && e.date < end)
    .map(e => ({ x: Math.round((e.date.getTime() - start.getTime()) / DAY_MS), y: e.weight }));
  if (pts.length < MIN_WEIGHINS_PER_WEEK * n) return null;
  const fit = fitLine(pts);
  if (!fit) return null;
  const t = tCrit(fit.df);
  if (t == null) return null;

  const logged = weeks.reduce((s, w) => s + w.daysLogged, 0);
  const intake = weeks.reduce((s, w) => s + w.avgCalories * w.daysLogged, 0) / logged;
  const se = fit.se * KCAL_PER_KG;
  return {
    maintenance: Math.round(intake - fit.slope * KCAL_PER_KG),
    se: Math.round(se),
    margin: Math.round(t * se),
    weeksUsed: n,
    avgCalories: Math.round(intake),
    rateKgPerWeek: parseFloat((fit.slope * 7).toFixed(3)),
    weighIns: pts.length,
    windowed: true,
  };
};

export const estimateMaintenanceRegression = (
  weightIns: WeightInWeek[] | null | undefined,
  weeks: MaybeWeek[] | null | undefined,
  now: Date = new Date(),
): MaintenanceEstimate | null => {
  const entries: WeightEntry[] = flattenWeightInsChronological(weightIns);
  if (!entries.length || !weeks?.length) return null;

  const run = stableRun(contiguousRun(weeks, now));
  if (!run) return null;

  return fitWindow(entries, run, run.length);
};

export const maintenanceSeries = (
  weightIns: WeightInWeek[] | null | undefined,
  weeks: MaybeWeek[],
  now: Date = new Date(),
): (number | null)[] =>
  weeks.map((w, i) => {
    if (!w?.weekStart) return null;
    const weekEnd = parseKey(shiftWeekStart(w.weekStart, 1));
    const r = estimateMaintenanceRegression(weightIns, weeks.slice(0, i + 1), weekEnd < now ? weekEnd : now);
    return r ? r.maintenance : null;
  });

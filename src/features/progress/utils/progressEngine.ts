import { calculateRealTDEE, KCAL_PER_KG } from '../../profile/utils/nutritionPlanEngine';
import { estimateMaintenanceRegression, maintenanceSeries } from '../../profile/utils/maintenanceEstimator';
import { getPhaseLabel, isGoalReached } from '../../profile/utils/weightTrendEngine';
import { overlayWeekSteps } from '../../nutrition/helpers/stepStats';
import type { StepSnapshot } from '../../nutrition/helpers/stepStats';
import type { DailySteps, PlanType, UserData, WeekStats, WeightInWeek } from '../../../shared/types';

type Maybe = number | null | undefined;
type Slot = { e: number | null; r: number | null };
type TsLike = { toDate: () => Date };

export type NutritionSnap = StepSnapshot & {
  daysLoggedNutrition?: number;
  avgCalories?: number;
  avgProtein?: number;
};
export type ExerciseDoc = {
  exerciseName?: string;
  muscleGroup?: string;
  sets?: { weight?: number | string | null; reps?: number | string | null }[];
};
export type WorkoutDoc = { timestamp?: unknown; exercises?: ExerciseDoc[] };
export type NutritionDay = { date: string; calories: number; protein: number };
export type StepDay = { date: string; steps: number };
export type BuildSource = {
  weightIns?: WeightInWeek[];
  weeklyNutrition?: NutritionSnap[];
  dailySteps?: DailySteps;
  workouts?: WorkoutDoc[];
  getNutrition?: (from: Date, to: Date) => NutritionDay[];
  getSteps?: (from: Date, to: Date) => StepDay[];
  calc1RM: (kg: number, reps: number) => number;
};

export type WeekRow = {
  i: number;
  key: string;
  monday: Date;
  isCurrent: boolean;
  w: number | null;
  kcal: number | null;
  protein: number | null;
  steps: number | null;
  nd: number;
  sessions: number;
  sets: Record<string, number>;
  setsTotal: number;
  prs: number;
};
export type RatedWeek = WeekRow & {
  delta: number | null;
  gap: number | null;
  dw: number | null;
  chg: number | null;
  rate: number | null;
};
export type Lift = { name: string; loaded: boolean; values: (number | null)[] };

export type PhaseInfo = {
  type: PlanType;
  dir: number;
  label: string;
  tab: string;
  goal: number | null;
  latest: number | null;
  remaining: number | null;
  reached: boolean;
  phaseStart: Date | null;
  phaseWeeks: number;
  planRate: number | null;
  target: number | null;
};

export type PaceStatus = 'reached' | 'steady' | 'drift' | 'ahead' | 'slightly-ahead' | 'behind' | 'on';
export type PaceModel = {
  slots: { v: number | null; monday: Date; gap: number | null; avg: number | null; cur: boolean }[];
  plan: number | null;
  diff: number | null;
  rate: number | null;
  rate4: number | null;
  total: number;
  lastRate: number;
  spike: boolean;
  status: PaceStatus;
  eta: Date | null;
  reached: boolean;
  count: number;
};

export type EnergyModel = {
  slots: { monday: Date; cur: boolean }[];
  eat: (number | null)[];
  maint: (number | null)[];
  bal: (number | null)[];
  target: number | null;
  targetBal: number | null;
  eatNow: number | null;
  maintNow: number;
  balance: number;
  balNote: string;
  realRate: number | null;
  atTarget: number | null;
  gapToTarget: number | null;
  statsWeeks: number;
  margin: number | null;
};

export type StrengthModel = {
  slots: { monday: Date }[];
  strength: (number | null)[];
  weight: (number | null)[];
  sNow: number | null;
  wNow: number | null;
  perKg: number | null;
  lifts: number;
};

export type PhaseRecap = {
  type: PlanType;
  tab: string;
  dir: number;
  weeks: number;
  startDate: Date | null;
  startWeight: number;
  endWeight: number;
  change: number;
  rate: number;
  avgKcal: number | null;
  strengthPct: number | null;
  weightPct: number | null;
  perKg: number | null;
  maintenance: number | null;
  measured: boolean;
};

export type SetsModel = {
  rows: { name: string; cells: number[]; avg: number | null; shown: number }[];
  total: number;
  delta: number | null;
  low: string[];
  high: string[];
  first: Date;
};

export type MonthRow = {
  key: string;
  name: string;
  year: number;
  count: number;
  partial: boolean;
  wEnd: number | null;
  change: number | null;
  kcal: number | null;
  protein: number | null;
  steps: number | null;
  sessions: number;
  sessionsDone: number;
  planDone: number | null;
  sets: number;
  setsPerWeek: number | null;
  prs: number;
  hasData: boolean;
  d: { kcal: number | null; protein: number | null; steps: number | null; setsPerWeek: number | null } | null;
};

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_WEEKS = 26;
export const SETS_LOW = 10;
export const SETS_HIGH = 20;
export const MIN_LOGGED_DAYS = 4;
export const MIN_CURRENT_DAYS = 3;
export const MIN_CURRENT_FOOD_DAYS = 2;
export const GOAL_TOL = 0;
export const RECAP_MIN_WEEKS = 4;
export const MIN_LIFT_WEEKS = 4;
export const STALL_DROP = 0.03;

const MAX_HISTORY_WEEKS = 104;
const LIVE_WEEKS = 10;
const RATE_WINDOW = 12;
const TDEE_WINDOW = 4;
const MUSCLE_ORDER = ['Back', 'Chest', 'Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstring', 'Glutes', 'Calves', 'Core'];
const MUSCLE_ALIAS: Record<string, string> = {
  Shoulders: 'Delts',
  Shoulder: 'Delts',
  Hamstrings: 'Hamstring',
  Quadriceps: 'Quads',
  Glute: 'Glutes',
  Calf: 'Calves',
  Abs: 'Core',
};
const MUSCLE_SKIP = ['Legs', 'Full Body', 'Other', 'Cardio'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number): string => String(n).padStart(2, '0');

export const toKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseKey = (k: string): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const mondayOf = (d: Date): Date => {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const nums = (a: Maybe[]): number[] => a.filter((v): v is number => v != null && !Number.isNaN(v));

export const sum = (a: Maybe[]): number => nums(a).reduce((s, v) => s + v, 0);

export const mean = (a: Maybe[]): number | null => {
  const n = nums(a);
  return n.length ? n.reduce((s, v) => s + v, 0) / n.length : null;
};

const median = (a: Maybe[]): number | null => {
  const n = nums(a).sort((x, y) => x - y);
  if (!n.length) return null;
  const m = n.length >> 1;
  return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2;
};

export const fmt1 = (v: Maybe): string => (v == null ? '--' : v.toFixed(1));

export const sg = (v: number, d = 1): string => {
  const a = Math.abs(v).toFixed(d);
  if (Number(a) === 0) return '0';
  return `${v < 0 ? '-' : '+'}${a}`;
};

export const kfmt = (v: Maybe): string => (v == null ? '--' : Math.round(v).toLocaleString('en-US'));

export const shortDate = (d: Date): string => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

const isTsLike = (t: unknown): t is TsLike => typeof (t as Partial<TsLike>).toDate === 'function';

const tsDate = (t: unknown): Date | null => {
  if (!t) return null;
  if (isTsLike(t)) return t.toDate();
  const d = t instanceof Date ? t : new Date(t as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normMuscle = (raw: unknown): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const m = MUSCLE_ALIAS[t] || t;
  return MUSCLE_SKIP.includes(m) ? null : m;
};

export const dirOf = (type: string | null | undefined): number => (type === 'muscle_gain' ? 1 : type === 'weight_loss' ? -1 : 0);

export const buildWeeks = (src: BuildSource, now: Date = new Date()): { weeks: WeekRow[]; lifts: Lift[] } => {
  const { weightIns = [], weeklyNutrition = [], dailySteps, workouts = [], getNutrition, getSteps, calc1RM } = src;
  const wMap = new Map<string, WeightInWeek>();
  const nMap = new Map<string, NutritionSnap>();
  const byWeek = new Map<string, WorkoutDoc[]>();

  weightIns.forEach(e => e?.weekStart && wMap.set(e.weekStart, e));
  weeklyNutrition.forEach(e => e?.weekStart && nMap.set(e.weekStart, e));
  workouts.forEach(doc => {
    const d = tsDate(doc?.timestamp);
    if (!d) return;
    const k = toKey(mondayOf(d));
    const list = byWeek.get(k) || [];
    if (!byWeek.has(k)) byWeek.set(k, list);
    list.push(doc);
  });

  const keys = [...wMap.keys(), ...nMap.keys(), ...byWeek.keys()].sort();
  if (!keys.length) return { weeks: [], lifts: [] };
  const firstNutrition = [...nMap.keys()].sort()[0] ?? null;
  const best = new Map<string, number>();

  const cur = mondayOf(now);
  const count = Math.min(MAX_HISTORY_WEEKS, Math.max(1, Math.round((cur.getTime() - parseKey(keys[0]).getTime()) / WEEK_MS) + 1));
  const start = addDays(cur, -(count - 1) * 7);
  const todayKey = toKey(now);
  const raw = new Map<string, { loaded: boolean; wk: Map<number, Slot> }>();

  const weeks: WeekRow[] = Array.from({ length: count }, (_, i) => {
    const monday = addDays(start, i * 7);
    const key = toKey(monday);
    const isCurrent = i === count - 1;
    const sunday = endOfDay(addDays(monday, 6));

    const we = wMap.get(key);
    const wVals = we?.days ? Object.values(we.days).filter(v => v != null && !Number.isNaN(Number(v))).map(Number) : [];
    const wDays = wVals.length || (we?.average != null ? 1 : 0);
    const wAvg = we ? (we.average ?? mean(wVals)) : null;
    const w = wAvg != null && wDays >= (isCurrent ? MIN_CURRENT_DAYS : 1) ? Number(wAvg) : null;

    let kcal: number | null = null;
    let protein: number | null = null;
    let steps: number | null = null;
    let nd = 0;
    const snap = overlayWeekSteps(nMap.get(key), dailySteps);
    if (snap && !isCurrent) {
      nd = snap.daysLoggedNutrition || 0;
      kcal = snap.avgCalories || null;
      protein = snap.avgProtein || null;
      steps = snap.avgSteps || null;
    } else if (getNutrition && (i >= count - LIVE_WEEKS || (!snap && firstNutrition != null && key >= firstNutrition))) {
      const days = getNutrition(monday, sunday).filter(d => d.calories > 0 && !(isCurrent && d.date === todayKey));
      nd = days.length;
      kcal = nd ? mean(days.map(d => d.calories)) : null;
      protein = nd ? mean(days.map(d => d.protein)) : null;
      if (getSteps) {
        const sd = getSteps(monday, sunday).filter(d => d.steps > 0 && !(isCurrent && d.date === todayKey));
        steps = sd.length ? mean(sd.map(d => d.steps)) : null;
      }
    }
    const okDays = nd >= (isCurrent ? MIN_CURRENT_FOOD_DAYS : MIN_LOGGED_DAYS);
    if (!okDays) {
      kcal = null;
      protein = null;
    }

    const docs = (byWeek.get(key) || []).sort((a, b) => (tsDate(a.timestamp)?.getTime() ?? 0) - (tsDate(b.timestamp)?.getTime() ?? 0));
    const sets: Record<string, number> = {};
    let prs = 0;
    docs.forEach(doc => {
      const sess = new Map<string, Slot>();
      (doc.exercises || []).forEach(ex => {
        const valid = (ex.sets || []).filter(s => parseInt(String(s.reps), 10) > 0);
        if (!valid.length) return;
        const m = normMuscle(ex.muscleGroup);
        if (m) sets[m] = (sets[m] || 0) + valid.length;
        const name = ex.exerciseName;
        if (!name) return;
        const sb: Slot = sess.get(name) || { e: null, r: null };
        valid.forEach(s => {
          const kg = parseFloat(String(s.weight)) || 0;
          const r = parseInt(String(s.reps), 10);
          if (kg > 0) {
            const e = calc1RM(kg, r);
            sb.e = sb.e == null ? e : Math.max(sb.e, e);
          }
          sb.r = sb.r == null ? r : Math.max(sb.r, r);
        });
        sess.set(name, sb);
        if (!raw.has(name)) raw.set(name, { loaded: false, wk: new Map() });
        const lf = raw.get(name)!;
        const slot: Slot = lf.wk.get(i) || { e: null, r: null };
        valid.forEach(s => {
          const kg = parseFloat(String(s.weight)) || 0;
          const r = parseInt(String(s.reps), 10);
          if (kg > 0) {
            lf.loaded = true;
            const e = calc1RM(kg, r);
            slot.e = slot.e == null ? e : Math.max(slot.e, e);
          }
          slot.r = slot.r == null ? r : Math.max(slot.r, r);
        });
        lf.wk.set(i, slot);
      });
      sess.forEach((sb, name) => {
        const v = sb.e ?? sb.r ?? 0;
        const prev = best.get(name);
        if (prev != null && v > prev + 0.01) prs += 1;
        if (prev == null || v > prev) best.set(name, v);
      });
    });

    return {
      i,
      key,
      monday,
      isCurrent,
      w,
      kcal,
      protein,
      steps: okDays ? steps : null,
      nd,
      sessions: docs.length,
      sets,
      setsTotal: sum(Object.values(sets)),
      prs,
    };
  });

  const lifts: Lift[] = [...raw.entries()]
    .map(([name, lf]) => ({
      name,
      loaded: lf.loaded,
      values: weeks.map((_, i) => {
        const s = lf.wk.get(i);
        if (!s) return null;
        return lf.loaded ? s.e : s.r;
      }),
    }))
    .filter(lf => nums(lf.values).length >= 3);

  return { weeks, lifts };
};

export const withRates = (weeks: WeekRow[], dir: number): RatedWeek[] => {
  let prev: { i: number; w: number } | null = null;
  return weeks.map((wk, i): RatedWeek => {
    const blank: RatedWeek = { ...wk, delta: null, gap: null, dw: null, chg: null, rate: null };
    if (wk.w == null) return blank;
    if (!prev) {
      prev = { i, w: wk.w };
      return blank;
    }
    const gap = i - prev.i;
    const delta = wk.w - prev.w;
    prev = { i, w: wk.w };
    const chg = dir === 0 ? Math.abs(delta) : dir * delta;
    return { ...wk, delta, gap, dw: delta / gap, chg, rate: chg / gap };
  });
};

const lastWeight = (weeks: WeekRow[]): number | null => {
  for (let i = weeks.length - 1; i >= 0; i--) if (weeks[i].w != null) return weeks[i].w;
  return null;
};

export const phaseInfo = (userData: UserData | null | undefined, weeks: WeekRow[], now: Date = new Date()): PhaseInfo => {
  const plan = userData?.weightChangePlan;
  const type: PlanType = plan?.type ?? 'maintenance';
  const dir = dirOf(type);
  const goalRaw = userData?.targetWeight ?? plan?.goalWeight ?? null;
  const goal = goalRaw == null ? null : Number(goalRaw);
  const gs = userData?.goalSwitchDate ? new Date(userData.goalSwitchDate) : null;
  const hasSwitch = gs && !Number.isNaN(gs.getTime()) && gs < now;
  const phaseStart = hasSwitch ? gs : null;
  const phaseWeeks = gs && hasSwitch ? Math.max(1, Math.ceil((now.getTime() - gs.getTime()) / WEEK_MS)) : Math.max(1, weeks.length);
  const planRate = plan?.ratePerWeek != null && plan.ratePerWeek !== 0 ? Math.abs(plan.ratePerWeek) : null;
  const latest = lastWeight(weeks);
  let remaining: number | null = null;
  if (goal != null && latest != null) {
    remaining = dir > 0 ? Math.max(0, goal - latest) : dir < 0 ? Math.max(0, latest - goal) : Math.abs(latest - goal);
  }
  return {
    type,
    dir,
    label: getPhaseLabel(type),
    tab: dir > 0 ? 'Bulk' : dir < 0 ? 'Cut' : 'Phase',
    goal,
    latest,
    remaining,
    reached: isGoalReached(latest, goal, GOAL_TOL, type),
    phaseStart,
    phaseWeeks,
    planRate,
    target: userData?.targetCalories ?? null,
  };
};

export const rangeOptions = (info: PhaseInfo): { key: string; label: string; n: number }[] => {
  const out = [
    { key: '8W', label: '8W', n: 8 },
    { key: '12W', label: '12W', n: 12 },
  ];
  if (info.phaseWeeks >= RECAP_MIN_WEEKS) out.unshift({ key: 'PHASE', label: info.tab, n: Math.min(info.phaseWeeks, MAX_WEEKS) });
  return out;
};

export const paceModel = (weeks: RatedWeek[], n: number, info: PhaseInfo, now: Date = new Date()): PaceModel | null => {
  const slots = weeks.slice(-n);
  const win = slots.filter((w): w is RatedWeek & { rate: number } => w.rate != null);
  if (win.length < 2) return null;

  const rate = mean(win.map(w => w.rate));
  const rate4 = mean(win.slice(-4).map(w => w.rate));
  const total = sum(win.map(w => w.chg));
  const lastRate = win[win.length - 1].rate;
  const rest = win.slice(0, -1).map(w => w.rate);
  const restMean = mean(rest) ?? 0;
  const spike = win.length >= 4 && lastRate >= 1.8 * restMean && lastRate - restMean >= 0.3;

  const rateNum = rate ?? 0;
  const done = info.dir !== 0 && info.reached;
  const plan = info.dir === 0 || done ? null : info.planRate;
  const diff = plan != null ? rateNum - plan : null;
  let status: PaceStatus = 'on';
  if (done) status = 'reached';
  else if (info.dir === 0) status = rateNum < 0.25 ? 'steady' : 'drift';
  else if (diff != null && diff > 0.15) status = 'ahead';
  else if (diff != null && diff > 0.05) status = 'slightly-ahead';
  else if (diff != null && diff < -0.05) status = 'behind';

  const roll = new Map<number, number | null>();
  win.forEach((w, k) => {
    const trail = win.slice(Math.max(0, k - 3), k + 1);
    roll.set(w.i, trail.length >= 3 ? mean(trail.map(x => x.rate)) : null);
  });
  const rate12 = mean(weeks.filter(w => w.rate != null).slice(-RATE_WINDOW).map(w => w.rate));
  let eta: Date | null = null;
  let reached = false;
  if (info.dir !== 0 && info.remaining != null) {
    if (info.reached) reached = true;
    else if (rate12 != null && rate12 > 0.05) eta = new Date(now.getTime() + (info.remaining / rate12) * WEEK_MS);
  }

  return {
    slots: slots.map(w => ({ v: w.rate, monday: w.monday, gap: w.gap, avg: roll.get(w.i) ?? null, cur: w.isCurrent })),
    plan,
    diff,
    rate,
    rate4,
    total,
    lastRate,
    spike,
    status,
    eta,
    reached,
    count: win.length,
  };
};

export const paceTip = (m: PaceModel, info: PhaseInfo): string => {
  if (m.status === 'reached') return '';
  const word = info.dir > 0 ? 'bulk' : 'cut';
  if (info.dir === 0) {
    return m.status === 'steady'
      ? `Weight is holding steady, drifting ${fmt1(m.rate)} kg a week on average.`
      : `Weight is drifting ${fmt1(m.rate)} kg a week while the goal is to hold. Check calories against maintenance.`;
  }
  if (m.spike) {
    const s = info.dir < 0 ? '-' : '+';
    return `Last week's ${s}${fmt1(m.lastRate)} kg looks like water. Judge the ${word} by the ${fmt1(m.rate)} kg/wk average, not the spike.`;
  }
  if (m.status === 'behind') {
    const tail = m.eta ? ` At this pace the goal lands around ${shortDate(m.eta)}.` : '';
    return `Averaging ${fmt1(m.rate)} kg/wk against a ${fmt1(m.plan)} plan.${tail}`;
  }
  if (m.status === 'ahead') {
    return info.dir < 0
      ? 'Faster than plan. Check the strength card to make sure it is fat coming off, not muscle.'
      : 'Faster than plan. More of the extra gain is likely fat.';
  }
  return `Right on plan over ${m.count} weeks.`;
};

type FullWeek = RatedWeek & { kcal: number; dw: number };

const tdeeWindow = (weeks: RatedWeek[], end: number): FullWeek[] =>
  weeks.slice(Math.max(0, end - TDEE_WINDOW + 1), end + 1).filter((w): w is FullWeek => w.kcal != null && w.dw != null);

const maintSeries = (weeks: RatedWeek[]): (number | null)[] =>
  weeks.map((_, i) => {
    const win = tdeeWindow(weeks, i);
    if (win.length < 2) return null;
    return calculateRealTDEE(mean(win.map(w => w.kcal)), mean(win.map(w => w.dw)) ?? 0);
  });

export const balanceNote = (balance: number, weeks: number): string => {
  const side = Math.abs(balance) < 50 ? 'around' : balance < 0 ? 'below' : 'above';
  return `${side} maintenance \u00b7 ${weeks}-week avg`;
};

const estimatorWeeks = (weeks: RatedWeek[]): WeekStats[] =>
  weeks.map(w => ({ weekStart: w.key, daysLogged: w.nd, avgCalories: w.kcal ?? 0, avgSteps: w.steps }));

export const energyModel = (weeks: RatedWeek[], n: number, info: PhaseInfo, weightIns: WeightInWeek[] | null | undefined, now: Date = new Date()): EnergyModel | null => {
  const legacy = maintSeries(weeks);
  const ew = weightIns?.length ? estimatorWeeks(weeks) : null;
  const measured = ew ? maintenanceSeries(weightIns, ew, now) : null;
  const series = measured ? measured.map((v, i) => v ?? legacy[i]) : legacy;
  const firstData = weeks.findIndex(w => w.kcal != null);
  if (firstData < 0) return null;
  const from = Math.max(firstData, weeks.length - n);
  const slots = weeks.slice(from);
  const eat = slots.map(w => w.kcal);
  const maint = series.slice(from);
  const both = slots.filter((_, i) => eat[i] != null && maint[i] != null).length;
  if (both < 3) return null;

  const win = tdeeWindow(weeks, weeks.length - 1);
  if (win.length < 3) return null;

  const reg = ew ? estimateMaintenanceRegression(weightIns, ew, now) : null;
  const eatNow = reg ? reg.avgCalories : mean(win.map(w => w.kcal));
  const maintNow = reg ? reg.maintenance : calculateRealTDEE(eatNow, mean(win.map(w => w.dw)) ?? 0);
  if (maintNow == null) return null;

  const eatNum = eatNow ?? 0;
  const balance = eatNum - maintNow;
  const bal = eat.map((v, i) => {
    const mi = maint[i];
    return v != null && mi != null ? v - mi : null;
  });
  const realRate = reg ? (info.dir === 0 ? Math.abs(reg.rateKgPerWeek) : info.dir * reg.rateKgPerWeek) : mean(win.map(w => w.rate));
  const target = info.target;
  let atTarget: number | null = null;
  if (target != null && info.dir !== 0) {
    const raw = info.dir < 0 ? (maintNow - target) : (target - maintNow);
    atTarget = Math.max(0, (raw * 7) / KCAL_PER_KG);
  }

  const keep = bal.map((v, i) => (v != null ? i : -1)).filter(i => i >= 0);

  return {
    slots: keep.map(i => ({ monday: slots[i].monday, cur: slots[i].isCurrent })),
    eat: keep.map(i => eat[i]),
    maint: keep.map(i => maint[i]),
    bal: keep.map(i => bal[i]),
    target,
    targetBal: target != null ? target - maintNow : null,
    eatNow,
    maintNow,
    balance,
    balNote: balanceNote(balance, reg ? reg.weeksUsed : win.length),
    realRate,
    atTarget,
    gapToTarget: target != null ? target - eatNum : null,
    statsWeeks: reg ? reg.weeksUsed : win.length,
    margin: reg ? reg.margin : null,
  };
};

export const energyTip = (m: EnergyModel, info: PhaseInfo): string => {
  const verb = info.dir > 0 ? 'gain' : info.dir < 0 ? 'lose' : 'change';
  const plan = info.planRate;
  if (plan != null && (m.realRate ?? 0) < plan * 0.8) {
    const need = info.dir < 0 ? m.maintNow - (plan * KCAL_PER_KG) / 7 : m.maintNow + (plan * KCAL_PER_KG) / 7;
    return `You ${verb} ${fmt1(m.realRate)} kg/wk against a ${fmt1(plan)} plan. Your real maintenance looks like ${kfmt(m.maintNow)} kcal, so plan pace needs about ${kfmt(need)}.`;
  }
  const gap = m.gapToTarget ?? 0;
  const adverse = info.dir < 0 ? gap < 0 : info.dir > 0 ? gap > 0 : true;
  if (adverse && m.target != null && m.atTarget != null && Math.abs(gap) > m.target * 0.05) {
    const side = gap > 0 ? 'under' : 'over';
    return `You eat ~${kfmt(Math.abs(gap))} kcal ${side} the ${kfmt(m.target)} target. At target you would ${verb} about ${fmt1(m.atTarget)} kg/wk, at ${kfmt(m.eatNow)} you ${verb} ${fmt1(m.realRate)}.`;
  }
  return '';
};

const relDrop = (loaded: boolean, top: number, best: number, wBest: number | null, wNow: number | null): number => {
  if (!loaded || !wBest || !wNow) return 1 - top / best;
  return 1 - top / wNow / (best / wBest);
};

export const liftSpan = (info: PhaseInfo): number => Math.max(8, Math.min(info.phaseWeeks, MAX_WEEKS));

export const liftStats = (weeks: WeekRow[], lifts: Lift[], span: number = MAX_WEEKS): { up: number; flat: number; stalled: { name: string; weeks: number }[] } => {
  const L = weeks.length;
  const s = Math.max(0, L - span);
  const wAt = (i: number): number | null => {
    for (let k = i; k >= 0; k--) if (weeks[k].w != null) return weeks[k].w;
    for (let k = i + 1; k < L; k++) if (weeks[k].w != null) return weeks[k].w;
    return null;
  };
  const wNow = wAt(L - 1);
  let up = 0;
  let flat = 0;
  const stalled: { name: string; weeks: number }[] = [];
  lifts.forEach(lf => {
    const v = lf.values.slice(s);
    const n = v.length;
    if (nums(v).length < MIN_LIFT_WEEKS) return;
    const recent = nums(v.slice(Math.max(0, n - 4)));
    const prior = nums(v.slice(Math.max(0, n - 8), Math.max(0, n - 4)));
    if (!recent.length || !prior.length) return;
    let best = -Infinity;
    let pr = -1;
    v.forEach((x, i) => {
      if (x != null && x > best) {
        best = x;
        pr = i;
      }
    });
    const since = n - 1 - pr;
    const top = Math.max(...recent);
    const ch = top / Math.max(...prior) - 1;
    if (since <= 3 || ch >= 0.02) up += 1;
    else if (since >= 6 && relDrop(lf.loaded, top, best, wAt(s + pr), wNow) > STALL_DROP) stalled.push({ name: lf.name, weeks: since });
    else flat += 1;
  });
  stalled.sort((a, b) => b.weeks - a.weeks);
  return { up, flat, stalled };
};

export const strengthModel = (weeks: WeekRow[], lifts: Lift[], n: number): StrengthModel | null => {
  const L = weeks.length;
  const s = Math.max(0, L - n);
  const curves: (number | null)[][] = [];
  lifts.forEach(lf => {
    const obs: number[] = [];
    for (let i = s; i < L; i++) if (lf.values[i] != null) obs.push(i);
    if (obs.length < 3) return;
    const sm = obs.map((_, k) => mean(obs.slice(Math.max(0, k - 2), k + 1).map(i => lf.values[i])));
    const base = sm[1];
    if (!base) return;
    const c: (number | null)[] = new Array(L).fill(null);
    let k = 1;
    for (let i = obs[1]; i < L; i++) {
      while (k + 1 < obs.length && obs[k + 1] <= i) k += 1;
      c[i] = (sm[k] ?? 0) / base;
    }
    curves.push(c);
  });
  if (curves.length < 2) return null;

  const slots = weeks.slice(s);
  const idx = slots.map((_, j) => median(curves.map(c => c[s + j])));
  const b = slots.findIndex((w, j) => idx[j] != null && w.w != null);
  if (b < 0) return null;

  const first = idx[b];
  const w0 = slots[b].w;
  if (first == null || w0 == null) return null;
  const strength = idx.map((v, j) => (j >= b && v != null ? (v / first - 1) * 100 : null));
  const weight = slots.map((w, j) => (j >= b && w.w != null ? (w.w / w0 - 1) * 100 : null));
  const lastOf = (a: (number | null)[]): number | null => {
    for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i];
    return null;
  };
  const sNow = lastOf(strength);
  const wNow = lastOf(weight);

  return {
    slots: slots.map(w => ({ monday: w.monday })),
    strength,
    weight,
    sNow,
    wNow,
    perKg: sNow != null && wNow != null ? ((1 + sNow / 100) / (1 + wNow / 100) - 1) * 100 : null,
    lifts: curves.length,
  };
};

export const strengthTip = (m: StrengthModel, info: PhaseInfo): string => {
  if (m.sNow == null) return '';
  if (info.dir < 0) {
    if (m.sNow >= 1) return 'A good sign the cut is taking fat, not muscle.';
    if (m.sNow > -2) return 'Strength is holding through the cut.';
    if (m.wNow != null && m.sNow > m.wNow) return '';
    return 'Strength is slipping. Check protein, sleep, and whether the deficit is too steep.';
  }
  if (info.dir > 0) {
    if (m.sNow >= 2) return 'The surplus is turning into strength.';
    return 'Strength is not keeping up with the weight gain. Check recovery and programming.';
  }
  return m.sNow >= 0 ? 'Getting stronger at a steady weight.' : 'Strength is trending down at maintenance.';
};

export const phaseRecap = (
  userData: UserData | null | undefined,
  weeks: RatedWeek[],
  info: PhaseInfo,
  energy: EnergyModel | null | undefined,
  strength: StrengthModel | null | undefined,
): PhaseRecap | null => {
  if (info.dir === 0 || !info.reached || info.phaseWeeks < RECAP_MIN_WEEKS) return null;

  const inPhase = weeks.slice(-info.phaseWeeks);
  const rated = inPhase.filter((w): w is RatedWeek & { w: number; delta: number } => w.delta != null);
  if (!rated.length) return null;

  const endWeight = rated[rated.length - 1].w;
  const change = sum(rated.map(w => w.delta));
  const span = sum(rated.map(w => w.gap));
  const avgKcal = mean(inPhase.filter(w => !w.isCurrent).map(w => w.kcal));

  const sNow = strength?.sNow ?? null;
  const wNow = strength?.wNow ?? null;
  const hasStrength = sNow != null && wNow != null;
  const perKg = sNow != null && wNow != null ? ((1 + sNow / 100) / (1 + wNow / 100) - 1) * 100 : null;

  const measured = energy?.maintNow ?? null;
  const base = measured ?? userData?.maintenanceCalories ?? userData?.weightChangePlan?.tdee ?? null;

  return {
    type: info.type,
    tab: info.tab,
    dir: info.dir,
    weeks: info.phaseWeeks,
    startDate: info.phaseStart,
    startWeight: endWeight - change,
    endWeight,
    change,
    rate: Math.abs(change) / span,
    avgKcal,
    strengthPct: hasStrength ? sNow : null,
    weightPct: hasStrength ? wNow : null,
    perKg,
    maintenance: base != null ? Math.round(base) : null,
    measured: measured != null,
  };
};

export const recapTip = (r: PhaseRecap): string => {
  if (r.maintenance == null) return 'Set a new goal in Profile to start the next phase.';
  const basis = r.measured ? 'Your measured maintenance is' : 'Your estimated maintenance is';
  return `${basis} about ${kfmt(r.maintenance)} kcal. Switching makes it your target and starts a new phase at ${fmt1(r.endWeight)} kg.`;
};

export const recapEntry = (r: PhaseRecap, now: Date = new Date()) => ({
  type: r.type,
  startDate: r.startDate ? r.startDate.toISOString() : null,
  endDate: now.toISOString(),
  weeks: r.weeks,
  startWeight: Number(r.startWeight.toFixed(1)),
  endWeight: Number(r.endWeight.toFixed(1)),
  avgKcal: r.avgKcal != null ? Math.round(r.avgKcal) : null,
  strengthPct: r.strengthPct != null ? Number(r.strengthPct.toFixed(1)) : null,
  weightPct: r.weightPct != null ? Number(r.weightPct.toFixed(1)) : null,
});

export const setsModel = (weeks: WeekRow[], n: number): SetsModel | null => {
  const slots = weeks.slice(-n);
  const names = new Set<string>();
  slots.forEach(w => Object.keys(w.sets).forEach(k => names.add(k)));
  const done = weeks.filter(w => !w.isCurrent);
  if (!names.size || !done.length) return null;

  const order = [
    ...MUSCLE_ORDER.filter(m => names.has(m)),
    ...[...names].filter(m => !MUSCLE_ORDER.includes(m)).sort(),
  ];
  const last4 = done.slice(-4);
  const prev4 = done.slice(-8, -4);
  const rows = order.map(name => {
    const avg = mean(last4.map(w => w.sets[name] || 0));
    return { name, cells: slots.map(w => w.sets[name] || 0), avg, shown: Math.round(avg ?? 0) };
  });
  const total = sum(rows.map(r => r.avg));
  const prevTotal = prev4.length ? sum(order.map(name => mean(prev4.map(w => w.sets[name] || 0)))) : null;
  const delta = prevTotal ? (total / prevTotal - 1) * 100 : null;
  const low = rows.filter(r => r.shown < SETS_LOW).map(r => r.name);
  const high = rows.filter(r => r.shown > SETS_HIGH).map(r => r.name);

  return { rows, total, delta, low, high, first: slots[0].monday };
};

const joinNames = (a: string[]): string => (a.length === 1 ? a[0] : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export const setsTip = (m: SetsModel): string => {
  if (m.low.length) {
    if (m.low.length > 3) return `${m.low.length} muscles sit under ${SETS_LOW} hard sets a week.`;
    const verb = m.low.length === 1 ? 'sits' : 'sit';
    const rest = m.high.length ? '' : ' The rest are in range.';
    return `${joinNames(m.low)} ${verb} under ${SETS_LOW} hard sets a week.${rest}`;
  }
  if (m.high.length) return `${joinNames(m.high)} run above ${SETS_HIGH} hard sets a week. Recovery may be the limit.`;
  return `Every muscle is inside the ${SETS_LOW}-${SETS_HIGH} range.`;
};

export const monthsModel = (weeks: RatedWeek[], planned: number | null = null): MonthRow[] => {
  const g = new Map<string, { key: string; month: number; year: number; ws: RatedWeek[] }>();
  weeks.forEach(w => {
    const k = `${w.monday.getFullYear()}-${pad(w.monday.getMonth() + 1)}`;
    let entry = g.get(k);
    if (!entry) {
      entry = { key: k, month: w.monday.getMonth(), year: w.monday.getFullYear(), ws: [] };
      g.set(k, entry);
    }
    entry.ws.push(w);
  });

  const list = [...g.values()]
    .map(({ key, month, year, ws }) => {
      const wl = ws.filter(w => w.w != null);
      const done = ws.filter(w => !w.isCurrent);
      return {
        key,
        name: MONTHS[month],
        year,
        count: ws.length,
        partial: ws.some(w => w.isCurrent),
        wEnd: wl.length ? wl[wl.length - 1].w : null,
        change: nums(ws.map(w => w.delta)).length ? sum(ws.map(w => w.delta)) : null,
        kcal: mean(ws.map(w => w.kcal)),
        protein: mean(ws.map(w => w.protein)),
        steps: mean(ws.map(w => w.steps)),
        sessions: sum(ws.map(w => w.sessions)),
        sessionsDone: sum(done.map(w => w.sessions)),
        planDone: planned != null ? planned * done.length : null,
        sets: sum(ws.map(w => w.setsTotal)),
        setsPerWeek: done.length ? sum(done.map(w => w.setsTotal)) / done.length : null,
        prs: sum(ws.map(w => w.prs)),
        hasData: wl.length > 0 || ws.some(w => w.kcal != null || w.sessions > 0),
      };
    })
    .filter(m => m.hasData)
    .reverse();

  return list.map((m, i): MonthRow => {
    const p = list[i + 1];
    const diff = (a: number | null, b: number | null): number | null => (a != null && b != null ? a - b : null);
    return {
      ...m,
      d: p
        ? {
            kcal: diff(m.kcal, p.kcal),
            protein: diff(m.protein, p.protein),
            steps: diff(m.steps, p.steps),
            setsPerWeek: diff(m.setsPerWeek, p.setsPerWeek),
          }
        : null,
    };
  });
};

export const countPlanned = (schedule: Record<string, { exercises?: unknown[] } | null | undefined> | null | undefined): number | null => {
  if (!schedule) return null;
  return Object.values(schedule).filter(d => (d?.exercises?.length ?? 0) > 0).length || null;
};

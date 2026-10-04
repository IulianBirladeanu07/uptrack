import { calculateRealTDEE, KCAL_PER_KG } from '../../profile/utils/nutritionPlanEngine';
import { getPhaseLabel, isGoalReached } from '../../profile/utils/weightTrendEngine';

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_WEEKS = 26;
export const SETS_LOW = 10;
export const SETS_HIGH = 20;
export const MIN_LOGGED_DAYS = 4;
export const MIN_CURRENT_DAYS = 3;
export const GOAL_TOL = 0;
export const RECAP_MIN_WEEKS = 4;

const MAX_HISTORY_WEEKS = 104;
const LIVE_WEEKS = 10;
const RATE_WINDOW = 12;
const TDEE_WINDOW = 4;
const MUSCLE_ORDER = ['Back', 'Chest', 'Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstring', 'Glutes', 'Calves', 'Core'];
const MUSCLE_ALIAS = {
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

const pad = n => String(n).padStart(2, '0');

export const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseKey = k => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const mondayOf = d => {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = d => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const nums = a => a.filter(v => v != null && !Number.isNaN(v));

export const sum = a => nums(a).reduce((s, v) => s + v, 0);

export const mean = a => {
  const n = nums(a);
  return n.length ? n.reduce((s, v) => s + v, 0) / n.length : null;
};

const median = a => {
  const n = nums(a).sort((x, y) => x - y);
  if (!n.length) return null;
  const m = n.length >> 1;
  return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2;
};

export const fmt1 = v => (v == null ? '--' : v.toFixed(1));

export const sg = (v, d = 1) => {
  const a = Math.abs(v).toFixed(d);
  if (Number(a) === 0) return '0';
  return `${v < 0 ? '-' : '+'}${a}`;
};

export const kfmt = v => (v == null ? '--' : Math.round(v).toLocaleString('en-US'));

export const shortDate = d => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

const tsDate = t => {
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate();
  const d = t instanceof Date ? t : new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normMuscle = raw => {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const m = MUSCLE_ALIAS[t] || t;
  return MUSCLE_SKIP.includes(m) ? null : m;
};

export const dirOf = type => (type === 'muscle_gain' ? 1 : type === 'weight_loss' ? -1 : 0);

export const buildWeeks = (src, now = new Date()) => {
  const { weightIns = [], weeklyNutrition = [], workouts = [], getNutrition, getSteps, calc1RM } = src;
  const wMap = new Map();
  const nMap = new Map();
  const byWeek = new Map();

  weightIns.forEach(e => e?.weekStart && wMap.set(e.weekStart, e));
  weeklyNutrition.forEach(e => e?.weekStart && nMap.set(e.weekStart, e));
  workouts.forEach(doc => {
    const d = tsDate(doc?.timestamp);
    if (!d) return;
    const k = toKey(mondayOf(d));
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(doc);
  });

  const keys = [...wMap.keys(), ...nMap.keys(), ...byWeek.keys()].sort();
  if (!keys.length) return { weeks: [], lifts: [] };

  const cur = mondayOf(now);
  const count = Math.min(MAX_HISTORY_WEEKS, Math.max(1, Math.round((cur - parseKey(keys[0])) / WEEK_MS) + 1));
  const start = addDays(cur, -(count - 1) * 7);
  const todayKey = toKey(now);
  const raw = new Map();

  const weeks = Array.from({ length: count }, (_, i) => {
    const monday = addDays(start, i * 7);
    const key = toKey(monday);
    const isCurrent = i === count - 1;
    const sunday = endOfDay(addDays(monday, 6));

    const we = wMap.get(key);
    const wVals = we?.days ? Object.values(we.days).filter(v => v != null && !Number.isNaN(Number(v))).map(Number) : [];
    const wDays = wVals.length || (we?.average != null ? 1 : 0);
    const wAvg = we ? (we.average ?? mean(wVals)) : null;
    const w = wAvg != null && wDays >= (isCurrent ? MIN_CURRENT_DAYS : 1) ? Number(wAvg) : null;

    let kcal = null;
    let protein = null;
    let steps = null;
    let nd = 0;
    const snap = nMap.get(key);
    if (snap && !isCurrent) {
      nd = snap.daysLoggedNutrition || 0;
      kcal = snap.avgCalories || null;
      protein = snap.avgProtein || null;
      steps = snap.avgSteps || null;
    } else if (getNutrition && i >= count - LIVE_WEEKS) {
      const days = getNutrition(monday, sunday).filter(d => d.calories > 0);
      nd = days.length;
      kcal = nd ? mean(days.map(d => d.calories)) : null;
      protein = nd ? mean(days.map(d => d.protein)) : null;
      if (getSteps) {
        const sd = getSteps(monday, sunday).filter(d => d.steps > 0 && !(isCurrent && d.date === todayKey));
        steps = sd.length ? mean(sd.map(d => d.steps)) : null;
      }
    }
    const okDays = nd >= (isCurrent ? MIN_CURRENT_DAYS : MIN_LOGGED_DAYS);
    if (!okDays) {
      kcal = null;
      protein = null;
    }

    const docs = byWeek.get(key) || [];
    const sets = {};
    let prs = 0;
    docs.forEach(doc => {
      (doc.exercises || []).forEach(ex => {
        const valid = (ex.sets || []).filter(s => parseInt(s.reps, 10) > 0);
        if (!valid.length) return;
        const m = normMuscle(ex.muscleGroup);
        if (m) sets[m] = (sets[m] || 0) + valid.length;
        if (valid.some(s => s.isPR)) prs += 1;
        const name = ex.exerciseName;
        if (!name) return;
        if (!raw.has(name)) raw.set(name, { loaded: false, wk: new Map() });
        const lf = raw.get(name);
        const slot = lf.wk.get(i) || { e: null, r: null };
        valid.forEach(s => {
          const kg = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps, 10);
          if (kg > 0) {
            lf.loaded = true;
            const e = calc1RM(kg, r);
            slot.e = slot.e == null ? e : Math.max(slot.e, e);
          }
          slot.r = slot.r == null ? r : Math.max(slot.r, r);
        });
        lf.wk.set(i, slot);
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

  const lifts = [...raw.entries()]
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

export const withRates = (weeks, dir) => {
  let prev = null;
  return weeks.map((wk, i) => {
    const blank = { ...wk, delta: null, gap: null, dw: null, chg: null, rate: null };
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

const lastWeight = weeks => {
  for (let i = weeks.length - 1; i >= 0; i--) if (weeks[i].w != null) return weeks[i].w;
  return null;
};

export const phaseInfo = (userData, weeks, now = new Date()) => {
  const plan = userData?.weightChangePlan;
  const type = plan?.type ?? 'maintenance';
  const dir = dirOf(type);
  const goal = userData?.targetWeight ?? plan?.goalWeight ?? null;
  const gs = userData?.goalSwitchDate ? new Date(userData.goalSwitchDate) : null;
  const hasSwitch = gs && !Number.isNaN(gs.getTime()) && gs < now;
  const phaseStart = hasSwitch ? gs : null;
  const phaseWeeks = hasSwitch ? Math.max(1, Math.ceil((now - gs) / WEEK_MS)) : Math.max(1, weeks.length);
  const planRate = plan?.ratePerWeek != null && plan.ratePerWeek !== 0 ? Math.abs(plan.ratePerWeek) : null;
  const latest = lastWeight(weeks);
  let remaining = null;
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

export const rangeOptions = info => {
  const out = [
    { key: '8W', label: '8W', n: 8 },
    { key: '12W', label: '12W', n: 12 },
  ];
  if (info.phaseWeeks > 12) out.push({ key: 'PHASE', label: info.tab, n: Math.min(info.phaseWeeks, MAX_WEEKS) });
  return out;
};

export const paceModel = (weeks, n, info, now = new Date()) => {
  const slots = weeks.slice(-n);
  const win = slots.filter(w => w.rate != null);
  if (win.length < 2) return null;

  const rate = mean(win.map(w => w.rate));
  const rate4 = mean(win.slice(-4).map(w => w.rate));
  const total = sum(win.map(w => w.chg));
  const lastRate = win[win.length - 1].rate;
  const rest = win.slice(0, -1).map(w => w.rate);
  const spike = win.length >= 4 && lastRate >= 1.8 * mean(rest) && lastRate - mean(rest) >= 0.3;

  const plan = info.dir === 0 ? null : info.planRate;
  const diff = plan != null ? rate - plan : null;
  let status = 'on';
  if (info.dir === 0) status = rate < 0.25 ? 'steady' : 'drift';
  else if (diff != null && diff > 0.15) status = 'ahead';
  else if (diff != null && diff > 0.05) status = 'slightly-ahead';
  else if (diff != null && diff < -0.05) status = 'behind';

  const rate12 = mean(weeks.filter(w => w.rate != null).slice(-RATE_WINDOW).map(w => w.rate));
  let eta = null;
  let reached = false;
  if (info.dir !== 0 && info.remaining != null) {
    if (info.reached) reached = true;
    else if (rate12 != null && rate12 > 0.05) eta = new Date(now.getTime() + (info.remaining / rate12) * WEEK_MS);
  }

  return {
    slots: slots.map(w => ({ v: w.rate, monday: w.monday, gap: w.gap })),
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

export const paceTip = (m, info) => {
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

const tdeeWindow = (weeks, end) =>
  weeks.slice(Math.max(0, end - TDEE_WINDOW + 1), end + 1).filter(w => w.kcal != null && w.dw != null);

const maintSeries = weeks =>
  weeks.map((_, i) => {
    const win = tdeeWindow(weeks, i);
    if (win.length < 2) return null;
    return calculateRealTDEE(mean(win.map(w => w.kcal)), mean(win.map(w => w.dw)));
  });

export const energyModel = (weeks, n, info) => {
  const series = maintSeries(weeks);
  const from = Math.max(0, weeks.length - n);
  const lead = weeks.slice(from).findIndex(w => w.kcal != null);
  if (lead < 0) return null;

  const start = from + lead;
  const slots = weeks.slice(start);
  const eat = slots.map(w => w.kcal);
  const maint = series.slice(start);
  const both = slots.filter((_, i) => eat[i] != null && maint[i] != null).length;
  if (both < 3) return null;

  const win = tdeeWindow(weeks, weeks.length - 1);
  if (win.length < 3) return null;

  const eatNow = mean(win.map(w => w.kcal));
  const maintNow = calculateRealTDEE(eatNow, mean(win.map(w => w.dw)));
  if (maintNow == null) return null;

  const balance = eatNow - maintNow;
  const realRate = mean(win.map(w => w.rate));
  const target = info.target;
  let atTarget = null;
  if (target != null && info.dir !== 0) {
    const raw = info.dir < 0 ? (maintNow - target) : (target - maintNow);
    atTarget = Math.max(0, (raw * 7) / KCAL_PER_KG);
  }

  return {
    slots: slots.map(w => ({ monday: w.monday })),
    eat,
    maint,
    target,
    eatNow,
    maintNow,
    balance,
    pillRate: (Math.abs(balance) * 7) / KCAL_PER_KG,
    realRate,
    atTarget,
    gapToTarget: target != null ? target - eatNow : null,
    statsWeeks: win.length,
  };
};

export const energyTip = (m, info) => {
  const verb = info.dir > 0 ? 'gain' : info.dir < 0 ? 'lose' : 'change';
  const plan = info.planRate;
  if (plan != null && m.realRate < plan * 0.8) {
    const need = info.dir < 0 ? m.maintNow - (plan * KCAL_PER_KG) / 7 : m.maintNow + (plan * KCAL_PER_KG) / 7;
    return `You ${verb} ${fmt1(m.realRate)} kg/wk against a ${fmt1(plan)} plan. Your real maintenance looks like ${kfmt(m.maintNow)} kcal, so plan pace needs about ${kfmt(need)}.`;
  }
  if (m.target != null && m.atTarget != null && Math.abs(m.gapToTarget) > m.target * 0.05) {
    const side = m.gapToTarget > 0 ? 'under' : 'over';
    return `You eat ~${kfmt(Math.abs(m.gapToTarget))} kcal ${side} the ${kfmt(m.target)} target. At target you would ${verb} about ${fmt1(m.atTarget)} kg/wk, at ${kfmt(m.eatNow)} you ${verb} ${fmt1(m.realRate)}.`;
  }
  return `Intake and weigh-ins agree. Your real maintenance is about ${kfmt(m.maintNow)} kcal.`;
};

export const liftStats = (weeks, lifts) => {
  const L = weeks.length;
  let up = 0;
  let flat = 0;
  const stalled = [];
  lifts.forEach(lf => {
    const v = lf.values;
    const recent = nums(v.slice(Math.max(0, L - 4)));
    const prior = nums(v.slice(Math.max(0, L - 8), Math.max(0, L - 4)));
    if (!recent.length || !prior.length) return;
    let best = -Infinity;
    let pr = -1;
    v.forEach((x, i) => {
      if (x != null && x > best) {
        best = x;
        pr = i;
      }
    });
    const since = L - 1 - pr;
    const ch = Math.max(...recent) / Math.max(...prior) - 1;
    if (since <= 3 || ch >= 0.02) up += 1;
    else if (since >= 6) stalled.push({ name: lf.name, weeks: since });
    else flat += 1;
  });
  stalled.sort((a, b) => b.weeks - a.weeks);
  return { up, flat, stalled };
};

export const strengthModel = (weeks, lifts, n) => {
  const L = weeks.length;
  const s = Math.max(0, L - n);
  const curves = [];
  lifts.forEach(lf => {
    const v = lf.values;
    if (nums(v.slice(s)).length < 2) return;
    let last = null;
    const locf = v.map(x => {
      if (x != null) last = x;
      return last;
    });
    const bi = locf.findIndex((x, i) => i >= s && x != null);
    const base = locf[bi];
    if (!base) return;
    curves.push(locf.map((x, i) => (i >= s && x != null ? x / base : null)));
  });
  if (curves.length < 2) return null;

  const idx = [];
  for (let i = s; i < L; i++) idx.push(median(curves.map(c => c[i])));
  const first = idx.find(v => v != null);
  if (first == null) return null;

  const slots = weeks.slice(s);
  const strength = idx.map(v => (v == null ? null : (v / first - 1) * 100));
  const w0 = slots.find(w => w.w != null)?.w;
  const weight = slots.map(w => (w.w != null && w0 ? (w.w / w0 - 1) * 100 : null));
  const lastOf = a => {
    for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i];
    return null;
  };

  return {
    slots: slots.map(w => ({ monday: w.monday })),
    strength,
    weight,
    sNow: lastOf(strength),
    wNow: lastOf(weight),
    lifts: curves.length,
  };
};

export const strengthTip = (m, info) => {
  if (m.sNow == null) return '';
  const wDir = m.wNow == null ? '' : m.wNow < 0 ? 'down' : 'up';
  const wTxt = m.wNow == null ? '' : `Weight ${wDir} ${Math.abs(m.wNow).toFixed(1)}% and strength ${sg(m.sNow, 1)}%. `;
  if (info.dir < 0) {
    if (m.sNow >= 1) return `${wTxt}A good sign the cut is taking fat, not muscle.`;
    if (m.sNow > -2) return `${wTxt}Strength is holding through the cut.`;
    return `${wTxt}Strength is slipping. Check protein, sleep, and whether the deficit is too steep.`;
  }
  if (info.dir > 0) {
    if (m.sNow >= 2) return `${wTxt}The surplus is turning into strength.`;
    return `${wTxt}Strength is not keeping up with the weight gain. Check recovery and programming.`;
  }
  return m.sNow >= 0 ? `${wTxt}Getting stronger at a steady weight.` : `${wTxt}Strength is trending down at maintenance.`;
};

export const phaseRecap = (userData, weeks, info, energy, strength) => {
  if (info.dir === 0 || !info.reached || info.phaseWeeks < RECAP_MIN_WEEKS) return null;

  const inPhase = weeks.slice(-info.phaseWeeks);
  const rated = inPhase.filter(w => w.delta != null);
  if (!rated.length) return null;

  const endWeight = rated[rated.length - 1].w;
  const change = sum(rated.map(w => w.delta));
  const span = sum(rated.map(w => w.gap));
  const avgKcal = mean(inPhase.filter(w => !w.isCurrent).map(w => w.kcal));

  const hasStrength = strength?.sNow != null && strength?.wNow != null;
  const perKg = hasStrength ? ((1 + strength.sNow / 100) / (1 + strength.wNow / 100) - 1) * 100 : null;

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
    strengthPct: hasStrength ? strength.sNow : null,
    weightPct: hasStrength ? strength.wNow : null,
    perKg,
    maintenance: base != null ? Math.round(base) : null,
    measured: measured != null,
  };
};

export const recapTip = r => {
  if (r.maintenance == null) return 'Set a new goal in Settings to start the next phase.';
  const basis = r.measured ? 'Your measured maintenance is' : 'Your estimated maintenance is';
  return `${basis} about ${kfmt(r.maintenance)} kcal. Switching makes it your target and starts a new phase at ${fmt1(r.endWeight)} kg.`;
};

export const recapEntry = (r, now = new Date()) => ({
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

export const setsModel = (weeks, n) => {
  const slots = weeks.slice(-n);
  const names = new Set();
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
    return { name, avg, shown: Math.round(avg) };
  });
  const total = sum(rows.map(r => r.avg));
  const prevTotal = prev4.length ? sum(order.map(name => mean(prev4.map(w => w.sets[name] || 0)))) : null;
  const delta = prevTotal ? (total / prevTotal - 1) * 100 : null;
  const low = rows.filter(r => r.shown < SETS_LOW).map(r => r.name);
  const high = rows.filter(r => r.shown > SETS_HIGH).map(r => r.name);

  return { rows, total, delta, low, high };
};

const joinNames = a => (a.length === 1 ? a[0] : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export const setsTip = m => {
  if (m.low.length) {
    const verb = m.low.length === 1 ? 'sits' : 'sit';
    const rest = m.high.length ? '' : ' The rest are in range.';
    return `${joinNames(m.low)} ${verb} under ${SETS_LOW} hard sets a week.${rest}`;
  }
  if (m.high.length) return `${joinNames(m.high)} run above ${SETS_HIGH} hard sets a week. Recovery may be the limit.`;
  return `Every muscle is inside the ${SETS_LOW}-${SETS_HIGH} range.`;
};

export const monthsModel = (weeks, planned = null) => {
  const g = new Map();
  weeks.forEach(w => {
    const k = `${w.monday.getFullYear()}-${pad(w.monday.getMonth() + 1)}`;
    if (!g.has(k)) g.set(k, { key: k, month: w.monday.getMonth(), year: w.monday.getFullYear(), ws: [] });
    g.get(k).ws.push(w);
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
        prs: sum(ws.map(w => w.prs)),
        hasData: wl.length > 0 || ws.some(w => w.kcal != null || w.sessions > 0),
      };
    })
    .filter(m => m.hasData)
    .reverse();

  return list.map((m, i) => {
    const p = list[i + 1];
    const diff = (a, b) => (a != null && b != null ? a - b : null);
    return {
      ...m,
      d: p
        ? {
            kcal: diff(m.kcal, p.kcal),
            protein: diff(m.protein, p.protein),
            steps: diff(m.steps, p.steps),
            setsPerWeek: diff(m.sets / m.count, p.sets / p.count),
          }
        : null,
    };
  });
};

export const countPlanned = schedule => {
  if (!schedule) return null;
  return Object.values(schedule).filter(d => (d?.exercises?.length ?? 0) > 0).length || null;
};

import {
  buildWeeks,
  withRates,
  phaseInfo,
  phaseRecap,
  recapTip,
  recapEntry,
  rangeOptions,
  paceModel,
  paceTip,
  energyModel,
  balanceNote,
  energyTip,
  liftStats,
  strengthModel,
  setsModel,
  setsTip,
  monthsModel,
  normMuscle,
  dirOf,
  countPlanned,
  toKey,
  mondayOf,
  addDays,
  sg,
} from './progressEngine';

const NOW = new Date(2026, 8, 20, 14, 0, 0);
const CUR = mondayOf(NOW);
const calc1RM = (w, r) => w / (1.0278 - 0.0278 * Math.min(Math.max(r, 1), 12));

const LOSS = [0.8, 0.7, 0.7, 0.6, 0.6, 0.5, 0.6, 0.4, 0.6, 0.5, 0.5, 0.5, 0.4, 0.5, 0.4, 0.5, 0.4, 0.4, 0.4, 1.1];
const KCAL = [3180, 3150, 3120, 3140, 3090, 3110, 3060, 3080, 3040, 3070, 3030, 3050, 3010, 3040, 3000, 3020, 2990, 3000, 3010, 3026];

const weekKey = i => toKey(addDays(CUR, -(20 - i) * 7));

const buildSrc = (over = {}) => {
  const W = [92.5];
  LOSS.forEach(l => W.push(W[W.length - 1] - l));
  const weightIns = W.map((avg, i) => ({
    weekStart: weekKey(i),
    average: avg,
    days: { monday: avg, tuesday: avg, wednesday: avg },
  }));
  const weeklyNutrition = LOSS.slice(0, 19).map((_, k) => ({
    weekStart: weekKey(k + 1),
    avgCalories: KCAL[k],
    avgProtein: 200,
    avgSteps: 14000,
    daysLoggedNutrition: 7,
  }));
  const workouts = [];
  for (let i = 1; i <= 20; i++) {
    for (let s = 0; s < 5; s++) {
      const d = addDays(addDays(CUR, -(20 - i) * 7), s);
      workouts.push({
        timestamp: { toDate: () => d },
        exercises: [
          {
            exerciseName: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [
              { weight: 60 + i, reps: 8, isPR: s === 0 && i % 2 === 0 },
              { weight: 60 + i, reps: 8 },
              { weight: 60 + i, reps: 7 },
            ],
          },
          {
            exerciseName: 'Ring Pull-ups',
            muscleGroup: 'Back',
            sets: [
              { weight: 0, reps: 10 },
              { weight: 0, reps: 9 },
            ],
          },
          {
            exerciseName: 'Squat',
            muscleGroup: 'Quads',
            sets: [{ weight: 80 + i * 2, reps: 6 }],
          },
        ],
      });
    }
  }
  const live = Array.from({ length: 7 }, (_, d) => ({ date: toKey(addDays(CUR, d)), calories: 3026, protein: 203, carbs: 400, fat: 67 }));
  return {
    weightIns,
    weeklyNutrition,
    workouts,
    getNutrition: () => live,
    getSteps: () => live.map(d => ({ date: d.date, steps: 14800 })),
    calc1RM,
    ...over,
  };
};

const userData = {
  weightChangePlan: { type: 'weight_loss', ratePerWeek: 0.5, goalWeight: 80 },
  targetWeight: 80,
  targetCalories: 3416,
};

describe('helpers', () => {
  test('dirOf maps plan types', () => {
    expect(dirOf('weight_loss')).toBe(-1);
    expect(dirOf('muscle_gain')).toBe(1);
    expect(dirOf('maintenance')).toBe(0);
    expect(dirOf(undefined)).toBe(0);
  });

  test('normMuscle aliases and skips generic groups', () => {
    expect(normMuscle('Shoulders')).toBe('Delts');
    expect(normMuscle('Hamstrings')).toBe('Hamstring');
    expect(normMuscle('Full Body')).toBeNull();
    expect(normMuscle(undefined)).toBeNull();
  });

  test('sg formats signed values and hides negative zero', () => {
    expect(sg(-1.14)).toBe('-1.1');
    expect(sg(2.66)).toBe('+2.7');
    expect(sg(-0.01)).toBe('0');
  });

  test('countPlanned counts days with exercises', () => {
    expect(countPlanned({ monday: { exercises: [1] }, tuesday: { exercises: [] }, thursday: { exercises: [1, 2] } })).toBe(2);
    expect(countPlanned({})).toBeNull();
    expect(countPlanned(null)).toBeNull();
  });
});

describe('buildWeeks', () => {
  test('returns empty for no data', () => {
    expect(buildWeeks({ calc1RM }, NOW)).toEqual({ weeks: [], lifts: [] });
  });

  test('builds contiguous Monday weeks ending at the current week', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    expect(weeks).toHaveLength(21);
    expect(weeks[20].isCurrent).toBe(true);
    expect(toKey(weeks[20].monday)).toBe(toKey(CUR));
    expect(weeks[19].isCurrent).toBe(false);
    expect(weeks[20].w).toBeCloseTo(81.4, 5);
  });

  test('uses snapshots for past weeks and live data for the current week', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    expect(weeks[19].kcal).toBe(KCAL[18]);
    expect(weeks[20].kcal).toBe(3026);
    expect(weeks[20].steps).toBe(14800);
  });

  test('drops nutrition from under-logged weeks', () => {
    const src = buildSrc();
    src.weeklyNutrition[5].daysLoggedNutrition = 2;
    const { weeks } = buildWeeks(src, NOW);
    expect(weeks[6].kcal).toBeNull();
  });

  test('ignores a current week with fewer than 3 weigh-ins', () => {
    const src = buildSrc();
    src.weightIns[20].days = { monday: 81.4 };
    const { weeks } = buildWeeks(src, NOW);
    expect(weeks[20].w).toBeNull();
  });

  test('counts sessions, sets by muscle and PRs per week', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    const w = weeks[10];
    expect(w.sessions).toBe(5);
    expect(w.sets.Chest).toBe(15);
    expect(w.sets.Back).toBe(10);
    expect(w.sets.Quads).toBe(5);
    expect(w.setsTotal).toBe(30);
    expect(w.prs).toBe(1);
  });

  test('extracts loaded lifts as e1RM and bodyweight lifts as reps', () => {
    const { lifts } = buildWeeks(buildSrc(), NOW);
    const bench = lifts.find(l => l.name === 'Bench Press');
    const pull = lifts.find(l => l.name === 'Ring Pull-ups');
    expect(bench.loaded).toBe(true);
    expect(pull.loaded).toBe(false);
    expect(pull.values[10]).toBe(10);
    expect(bench.values[20]).toBeGreaterThan(bench.values[10]);
  });
});

describe('withRates', () => {
  test('computes goal-direction rates for a cut', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    const r = withRates(weeks, -1);
    expect(r[0].rate).toBeNull();
    expect(r[1].rate).toBeCloseTo(0.8, 5);
    expect(r[20].rate).toBeCloseTo(1.1, 5);
    expect(r[20].dw).toBeCloseTo(-1.1, 5);
  });

  test('flips sign for a bulk and uses magnitude for maintenance', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    expect(withRates(weeks, 1)[1].rate).toBeCloseTo(-0.8, 5);
    expect(withRates(weeks, 0)[1].rate).toBeCloseTo(0.8, 5);
  });

  test('spreads a change across a logging gap', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    const gapped = weeks.map((w, i) => (i === 10 ? { ...w, w: null } : w));
    const r = withRates(gapped, -1);
    expect(r[10].rate).toBeNull();
    expect(r[11].gap).toBe(2);
    expect(r[11].rate).toBeCloseTo((LOSS[9] + LOSS[10]) / 2, 5);
  });
});

describe('paceModel', () => {
  const { weeks } = buildWeeks(buildSrc(), NOW);
  const rated = withRates(weeks, -1);
  const info = phaseInfo(userData, rated, NOW);

  test('12W pace is on plan and last week is flagged as a spike', () => {
    const m = paceModel(rated, 12, info, NOW);
    expect(m.rate).toBeCloseTo(0.5167, 3);
    expect(m.status).toBe('on');
    expect(m.spike).toBe(true);
    expect(m.total).toBeCloseTo(6.2, 5);
    expect(paceTip(m, info)).toMatch(/looks like water/);
  });

  test('eta uses the 12 week rate and remaining distance', () => {
    const m = paceModel(rated, 12, info, NOW);
    expect(info.remaining).toBeCloseTo(1.4, 5);
    const days = (m.eta - NOW) / 86400000;
    expect(days).toBeGreaterThan(17);
    expect(days).toBeLessThan(21);
  });

  test('reports behind plan when the plan rate is higher', () => {
    const m = paceModel(rated, 12, { ...info, planRate: 0.9 }, NOW);
    expect(m.status).toBe('behind');
    expect(paceTip({ ...m, spike: false }, { ...info, planRate: 0.9 })).toMatch(/against a 0.9 plan/);
  });

  test('reached goal suppresses eta', () => {
    const m = paceModel(rated, 12, { ...info, remaining: 0.03, reached: true }, NOW);
    expect(m.reached).toBe(true);
    expect(m.eta).toBeNull();
  });

  test('a small remaining distance still gets an eta and is not reached', () => {
    const near = { ...info, remaining: 0.3, reached: false };
    const m = paceModel(rated, 12, near, NOW);
    expect(m.reached).toBe(false);
    expect(m.eta).not.toBeNull();
    expect((m.eta - NOW) / 86400000).toBeLessThan(7);
  });

  test('slots carry the weigh-in gap so a bar can show it spans several weeks', () => {
    const gapped = withRates(weeks.map((w, i) => (i === 10 ? { ...w, w: null } : w)), -1);
    const m = paceModel(gapped, 12, info, NOW);
    expect(m.slots.find(x => x.gap === 2)).toBeDefined();
    expect(m.slots[m.slots.length - 1].gap).toBe(1);
  });

  test('returns null with fewer than two rated weeks', () => {
    expect(paceModel(rated.slice(0, 2), 12, info, NOW)).toBeNull();
  });

  test('maintenance has no plan line', () => {
    const r0 = withRates(weeks, 0);
    const i0 = phaseInfo({ weightChangePlan: { type: 'maintenance' } }, r0, NOW);
    const m = paceModel(r0, 12, i0, NOW);
    expect(m.plan).toBeNull();
    expect(['steady', 'drift']).toContain(m.status);
  });
});

describe('phaseInfo and ranges', () => {
  const { weeks } = buildWeeks(buildSrc(), NOW);
  const rated = withRates(weeks, -1);

  test('derives labels, goal and remaining', () => {
    const info = phaseInfo(userData, rated, NOW);
    expect(info.label).toBe('Cutting');
    expect(info.tab).toBe('Cut');
    expect(info.goal).toBe(80);
    expect(info.planRate).toBe(0.5);
  });

  test('uses goalSwitchDate for phase weeks and adds a phase range when long', () => {
    const gs = addDays(NOW, -19 * 7).toISOString();
    const info = phaseInfo({ ...userData, goalSwitchDate: gs }, rated, NOW);
    expect(info.phaseWeeks).toBe(19);
    const opts = rangeOptions(info);
    expect(opts.map(o => o.key)).toEqual(['8W', '12W', 'PHASE']);
    expect(opts[2].n).toBe(19);
  });

  test('reached only once the weekly average is at or past the target', () => {
    const latest = phaseInfo(userData, rated, NOW).latest;
    expect(phaseInfo({ ...userData, targetWeight: 200 }, rated, NOW).reached).toBe(true);
    expect(phaseInfo({ ...userData, targetWeight: latest + 0.1 }, rated, NOW).reached).toBe(true);
    expect(phaseInfo({ ...userData, targetWeight: latest }, rated, NOW).reached).toBe(true);
    expect(phaseInfo({ ...userData, targetWeight: latest - 0.04 }, rated, NOW).reached).toBe(false);
    expect(phaseInfo({ ...userData, targetWeight: latest - 0.3 }, rated, NOW).reached).toBe(false);
  });

  test('a bulk is reached from below only when the average gets up to the target', () => {
    const up = withRates(weeks, 1);
    const bulk = { weightChangePlan: { type: 'muscle_gain', ratePerWeek: 0.3 } };
    const latest = phaseInfo({ ...bulk, targetWeight: 80 }, up, NOW).latest;
    expect(phaseInfo({ ...bulk, targetWeight: latest + 0.1 }, up, NOW).reached).toBe(false);
    expect(phaseInfo({ ...bulk, targetWeight: latest }, up, NOW).reached).toBe(true);
  });

  test('exposes the phase start only when goalSwitchDate is in the past', () => {
    const gs = addDays(NOW, -10 * 7);
    expect(phaseInfo({ ...userData, goalSwitchDate: gs.toISOString() }, rated, NOW).phaseStart.getTime()).toBe(gs.getTime());
    expect(phaseInfo(userData, rated, NOW).phaseStart).toBeNull();
  });

  test('hides the phase range when it is short', () => {
    const gs = addDays(NOW, -5 * 7).toISOString();
    const info = phaseInfo({ ...userData, goalSwitchDate: gs }, rated, NOW);
    expect(rangeOptions(info).map(o => o.key)).toEqual(['8W', '12W']);
  });

  test('caps phase range at 26 weeks', () => {
    const info = { phaseWeeks: 60, tab: 'Cut' };
    expect(rangeOptions(info)[2].n).toBe(26);
  });
});

describe('balanceNote', () => {
  test('picks the side from the sign and calls small gaps around', () => {
    expect(balanceNote(-737, 4)).toBe('below maintenance \u00b7 4-week avg');
    expect(balanceNote(310, 3)).toBe('above maintenance \u00b7 3-week avg');
    expect(balanceNote(-20, 4)).toBe('around maintenance \u00b7 4-week avg');
    expect(balanceNote(49, 4)).toBe('around maintenance \u00b7 4-week avg');
  });
});

describe('energyModel', () => {
  const { weeks } = buildWeeks(buildSrc(), NOW);
  const rated = withRates(weeks, -1);
  const info = phaseInfo(userData, rated, NOW);

  test('back-solves maintenance and flags a generous target', () => {
    const m = energyModel(rated, 12, info);
    expect(m.eatNow).toBeGreaterThan(3000);
    expect(m.eatNow).toBeLessThan(3025);
    expect(m.maintNow).toBeGreaterThan(m.eatNow);
    expect(m.balance).toBeLessThan(0);
    expect(m.gapToTarget).toBeGreaterThan(300);
    expect(m.atTarget).toBeLessThan(0.3);
    expect(energyTip(m, info)).toMatch(/under the 3,416 target/);
    expect(m.maint.filter(v => v != null).length).toBeGreaterThan(8);
  });

  test('flags a target gap even when the at-target rate matches the plan', () => {
    const i2 = { ...info, planRate: 0.2 };
    const m = energyModel(rated, 12, i2);
    expect(Math.abs(m.atTarget - 0.2)).toBeLessThan(0.06);
    expect(energyTip(m, i2)).toMatch(/under the 3,416 target. At target you would lose about 0.2 kg\/wk/);
  });

  test('reports eating over target', () => {
    const i2 = { ...info, target: 2700 };
    const m = energyModel(rated, 12, i2);
    expect(energyTip(m, i2)).toMatch(/over the 2,700 target/);
  });

  test('the chart line ends on the maintenance shown in the stats', () => {
    const m = energyModel(rated, 12, info);
    expect(m.maint[m.maint.length - 1]).toBe(m.maintNow);
  });

  test('describes the balance in plain words with the averaging window', () => {
    const m = energyModel(rated, 12, info);
    expect(m.balNote).toBe(`below maintenance \u00b7 ${m.statsWeeks}-week avg`);
  });

  test('chart starts at the first week that can draw a line', () => {
    const gapped = rated.map((w, i) => (i > rated.length - 13 && i < rated.length - 9 ? { ...w, kcal: null } : w));
    const m = energyModel(gapped, 12, info);
    expect(m.eat[0]).not.toBeNull();
    expect(m.maint[0]).not.toBeNull();
    expect(m.eat[1]).not.toBeNull();
    expect(m.maint[1]).not.toBeNull();
  });

  test('says behind-plan when real rate is far below plan', () => {
    const m = energyModel(rated, 12, { ...info, planRate: 1.2 });
    expect(energyTip(m, { ...info, planRate: 1.2 })).toMatch(/plan pace needs about/);
  });

  test('agreement message when target matches intake', () => {
    const m = energyModel(rated, 12, { ...info, target: 3012 });
    expect(energyTip(m, { ...info, target: 3012 })).toMatch(/agree/);
  });

  test('drops leading weeks that have no nutrition data', () => {
    const snaps = buildSrc().weeklyNutrition.slice(-8);
    const src = buildSrc({ weeklyNutrition: snaps, getNutrition: () => [] });
    const r = withRates(buildWeeks(src, NOW).weeks, -1);
    const m = energyModel(r, 20, info);
    expect(m.slots.length).toBeLessThanOrEqual(9);
    expect(m.eat[0]).not.toBeNull();
    expect(m.statsWeeks).toBeGreaterThanOrEqual(3);
  });

  test('reports how many weeks the estimate is based on', () => {
    const m = energyModel(rated, 12, info);
    expect(m.statsWeeks).toBe(4);
  });

  test('returns null without enough nutrition data', () => {
    const src = buildSrc({ weeklyNutrition: [], getNutrition: () => [] });
    const r = withRates(buildWeeks(src, NOW).weeks, -1);
    expect(energyModel(r, 12, info)).toBeNull();
  });
});

describe('strength', () => {
  const { weeks, lifts } = buildWeeks(buildSrc(), NOW);

  test('strength index rises while weight falls', () => {
    const m = strengthModel(weeks, lifts, 20);
    expect(m.sNow).toBeGreaterThan(5);
    expect(m.wNow).toBeLessThan(-8);
    expect(m.strength[0]).toBeCloseTo(0, 5);
    expect(m.weight[0]).toBeCloseTo(0, 5);
    expect(m.lifts).toBeGreaterThanOrEqual(2);
  });

  test('rebases to the start of a shorter range', () => {
    const m = strengthModel(weeks, lifts, 8);
    expect(m.slots).toHaveLength(8);
    expect(m.strength[0]).toBeCloseTo(0, 5);
  });

  test('needs at least two lifts', () => {
    expect(strengthModel(weeks, lifts.slice(0, 1), 12)).toBeNull();
  });

  test('liftStats separates up, flat and stalled lifts', () => {
    const s = liftStats(weeks, lifts);
    expect(s.up).toBeGreaterThanOrEqual(1);
    expect(s.stalled.map(x => x.name)).toContain('Ring Pull-ups');
    expect(s.stalled[0].weeks).toBeGreaterThanOrEqual(6);
  });
});

describe('buildWeeks step overlay', () => {
  test('replaces a thin snapshot step average with the dailySteps history', () => {
    const src = buildSrc();
    const key = weekKey(10);
    src.weeklyNutrition.find(w => w.weekStart === key).avgSteps = 19724;
    src.weeklyNutrition.find(w => w.weekStart === key).daysLoggedSteps = 1;
    const dailySteps = {};
    for (let i = 0; i < 7; i++) dailySteps[toKey(addDays(addDays(CUR, -10 * 7), i))] = 10000 + i * 1000;
    const { weeks } = buildWeeks({ ...src, dailySteps }, NOW);
    expect(weeks.find(w => toKey(w.monday) === key).steps).toBe(13000);
  });

  test('leaves snapshots alone without dailySteps', () => {
    const { weeks } = buildWeeks(buildSrc(), NOW);
    expect(weeks[10].steps).toBe(14000);
  });
});

describe('setsModel', () => {
  const { weeks } = buildWeeks(buildSrc(), NOW);

  test('averages completed weeks and flags low muscles', () => {
    const m = setsModel(weeks, 12);
    const chest = m.rows.find(r => r.name === 'Chest');
    const quads = m.rows.find(r => r.name === 'Quads');
    expect(chest.avg).toBe(15);
    expect(quads.avg).toBe(5);
    expect(m.low).toContain('Quads');
    expect(m.low).not.toContain('Chest');
    expect(m.total).toBe(30);
    expect(m.delta).toBeCloseTo(0, 5);
    expect(setsTip(m)).toMatch(/under 10 hard sets/);
  });

  test('rounds before flagging so the label and the number agree', () => {
    const done = weeks.filter(w => !w.isCurrent);
    const lastKey = done[done.length - 1].key;
    const keys = new Set(done.slice(-4).map(w => w.key));
    const w2 = weeks.map(w => (keys.has(w.key) ? { ...w, sets: { ...w.sets, Delts: w.key === lastKey ? 8 : 10 } } : w));
    const d = setsModel(w2, 12).rows.find(r => r.name === 'Delts');
    expect(d.avg).toBeCloseTo(9.5, 5);
    expect(d.shown).toBe(10);
    expect(setsModel(w2, 12).low).not.toContain('Delts');
  });

  test('current partial week does not drag averages down', () => {
    const w2 = weeks.map(w => (w.isCurrent ? { ...w, sets: {}, setsTotal: 0 } : w));
    expect(setsModel(w2, 12).rows.find(r => r.name === 'Chest').avg).toBe(15);
  });

  test('returns null with no sets', () => {
    expect(setsModel(weeks.map(w => ({ ...w, sets: {} })), 12)).toBeNull();
  });

  test('tips cover all-in-range and high volume', () => {
    expect(setsTip({ low: [], high: [] })).toMatch(/inside the 10-20 range/);
    expect(setsTip({ low: [], high: ['Back'] })).toMatch(/Back run above 20/);
    expect(setsTip({ low: ['Calves', 'Core'], high: [] })).toMatch(/Calves and Core sit under 10/);
  });
});

describe('monthsModel', () => {
  const { weeks } = buildWeeks(buildSrc(), NOW);
  const rated = withRates(weeks, -1);

  test('groups weeks by month newest first with deltas', () => {
    const m = monthsModel(rated, 5);
    expect(m[0].name).toBe('September');
    expect(m[0].partial).toBe(true);
    expect(m[0].wEnd).toBeCloseTo(81.4, 5);
    expect(m[0].change).toBeLessThan(0);
    expect(m[0].d).not.toBeNull();
    expect(m[m.length - 1].d).toBeNull();
    expect(m[1].name).toBe('August');
  });

  test('plan and sessions exclude the current week', () => {
    const m = monthsModel(rated, 5);
    const sep = m[0];
    expect(sep.planDone).toBe(5 * (sep.count - 1));
    expect(sep.sessionsDone).toBe(5 * (sep.count - 1));
  });

  test('plan is null when no split is known', () => {
    expect(monthsModel(rated, null)[0].planDone).toBeNull();
  });
});

describe('phaseRecap', () => {
  const { weeks, lifts } = buildWeeks(buildSrc(), NOW);
  const rated = withRates(weeks, -1);
  const latest = phaseInfo(userData, rated, NOW).latest;
  const gs = addDays(NOW, -19 * 7).toISOString();
  const reachedUser = { ...userData, goalSwitchDate: gs, targetWeight: latest + 0.3, maintenanceCalories: 3700 };
  const info = phaseInfo(reachedUser, rated, NOW);
  const energy = energyModel(rated, 12, info);
  const strength = strengthModel(rated, lifts, 19);

  test('summarises a finished cut', () => {
    const r = phaseRecap(reachedUser, rated, info, energy, strength);
    expect(r.type).toBe('weight_loss');
    expect(r.tab).toBe('Cut');
    expect(r.weeks).toBe(19);
    expect(r.change).toBeLessThan(-10);
    expect(r.endWeight).toBeCloseTo(latest, 5);
    expect(r.startWeight).toBeGreaterThan(r.endWeight);
    expect(r.rate).toBeGreaterThan(0.3);
    expect(r.rate).toBeLessThan(0.8);
    expect(r.avgKcal).toBeGreaterThan(2990);
    expect(r.avgKcal).toBeLessThan(3190);
    expect(r.strengthPct).toBeGreaterThan(5);
    expect(r.perKg).toBeGreaterThan(r.strengthPct);
    expect(r.maintenance).toBe(Math.round(energy.maintNow));
    expect(r.measured).toBe(true);
  });

  test('counts the same weekly changes as the pace card over the phase', () => {
    const r = phaseRecap(reachedUser, rated, info, energy, strength);
    const pace = paceModel(rated, info.phaseWeeks, info, NOW);
    expect(Math.abs(r.change)).toBeCloseTo(pace.total, 8);
    expect(r.startWeight - r.endWeight).toBeCloseTo(pace.total, 8);
    expect(r.rate).toBeCloseTo(pace.total / info.phaseWeeks, 8);
  });

  test('relative strength combines the strength and weight changes', () => {
    const r = phaseRecap(reachedUser, rated, info, energy, strength);
    const expected = ((1 + strength.sNow / 100) / (1 + strength.wNow / 100) - 1) * 100;
    expect(r.perKg).toBeCloseTo(expected, 8);
  });

  test('falls back to stored maintenance without an energy model', () => {
    const r = phaseRecap(reachedUser, rated, info, null, null);
    expect(r.maintenance).toBe(3700);
    expect(r.measured).toBe(false);
    expect(r.perKg).toBeNull();
    expect(r.strengthPct).toBeNull();
  });

  test('has no maintenance when nothing is known', () => {
    const bare = { ...reachedUser, maintenanceCalories: undefined };
    const r = phaseRecap(bare, rated, info, null, null);
    expect(r.maintenance).toBeNull();
    expect(recapTip(r)).toMatch(/Settings/);
  });

  test('stays hidden until the goal is reached', () => {
    const far = phaseInfo({ ...reachedUser, targetWeight: latest - 2 }, rated, NOW);
    expect(far.reached).toBe(false);
    expect(phaseRecap(reachedUser, rated, far, energy, strength)).toBeNull();
  });

  test('stays hidden at maintenance', () => {
    const hold = phaseInfo({ ...reachedUser, weightChangePlan: { type: 'maintenance' } }, withRates(weeks, 0), NOW);
    expect(phaseRecap(reachedUser, rated, hold, energy, strength)).toBeNull();
  });

  test('stays hidden for a phase that just started', () => {
    const young = phaseInfo({ ...reachedUser, goalSwitchDate: addDays(NOW, -2 * 7).toISOString() }, rated, NOW);
    expect(young.phaseWeeks).toBeLessThan(4);
    expect(phaseRecap(reachedUser, rated, young, energy, strength)).toBeNull();
  });

  test('only counts weeks inside the phase', () => {
    const recent = phaseInfo({ ...reachedUser, goalSwitchDate: addDays(NOW, -8 * 7).toISOString() }, rated, NOW);
    const long = phaseRecap(reachedUser, rated, info, energy, strength);
    const short = phaseRecap(reachedUser, rated, recent, energy, strength);
    expect(short.startWeight).toBeLessThan(long.startWeight);
    expect(Math.abs(short.change)).toBeLessThan(Math.abs(long.change));
  });

  test('history entry is plain serialisable data', () => {
    const r = phaseRecap(reachedUser, rated, info, energy, strength);
    const e = recapEntry(r, NOW);
    expect(e.endDate).toBe(NOW.toISOString());
    expect(e.startDate).toBe(new Date(gs).toISOString());
    expect(e.weeks).toBe(19);
    expect(e.avgKcal).toBe(Math.round(r.avgKcal));
    expect(JSON.parse(JSON.stringify(e))).toEqual(e);
    expect(Object.values(e).every(v => v !== undefined)).toBe(true);
  });
});

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import { AuthContext } from '../../../auth/context/AuthContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { calculate1RM, fetchSplitsFromFirestore } from '../../../workout/handlers/WorkoutHandler';
import { switchToMaintenance } from '../../../nutrition/helpers/phaseService';
import { colors, spacing } from '../../../../shared/theme';
import { PaceChart, BalanceChart, StrengthChart } from '../../components/ProgressCharts';
import {
    MAX_WEEKS,
    SETS_LOW,
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
    energyTip,
    liftStats,
    strengthModel,
    strengthTip,
    setsModel,
    setsTip,
    monthsModel,
    countPlanned,
    dirOf,
    shortDate,
    fmt1,
    sg,
    kfmt,
} from '../../utils/progressEngine';
import styles from './ProgressScreenStyles';

const TABS = [
    { key: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
    { key: 'training', label: 'Training', icon: 'barbell' },
];

const TONES = {
    good: { bg: colors.faded.successAlt, fg: colors.accent.success },
    warn: { bg: colors.faded.primary, fg: colors.accent.primary },
    purple: { bg: colors.faded.purple, fg: colors.macro.protein },
    flat: { bg: colors.faded.surface, fg: colors.text.secondary },
};

const HEAT_KEY = [
    { label: '<6', a: 0.08 },
    { label: '6-9', a: 0.22 },
    { label: '10-14', a: 0.5 },
    { label: '15-20', a: 0.75 },
    { label: '20+', a: 1 },
];

const heatAlpha = v => (v < 6 ? 0.08 : v < 10 ? 0.22 : v < 15 ? 0.5 : v <= 20 ? 0.75 : 1);

const orange = a => `rgba(255, 149, 0, ${a})`;

const Delta = ({ tone = 'good', icon, text }) => {
    const t = TONES[tone];
    return (
        <View style={[styles.dp, { backgroundColor: t.bg }]}>
            {icon && <Ionicons name={icon} size={10} color={t.fg} />}
            <Text style={[styles.dpText, { color: t.fg }]}>{text}</Text>
        </View>
    );
};

const Hero = ({ value, unit, children }) => (
    <View style={styles.hero}>
        <View style={styles.heroValueRow}>
            <Text style={styles.big}>{value}</Text>
            {unit ? <Text style={styles.bigUnit}>{unit}</Text> : null}
        </View>
        {children}
    </View>
);

const Stats = ({ items }) => (
    <View style={styles.stats}>
        {items.map((it, i) => (
            <React.Fragment key={it.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.stat}>
                    <View style={styles.statValueRow}>
                        <Text style={[styles.statValue, it.color && { color: it.color }]}>{it.value}</Text>
                        {it.unit ? <Text style={styles.statUnit}>{it.unit}</Text> : null}
                    </View>
                    <View style={styles.statLabelRow}>
                        {it.dot && <View style={[styles.statDot, { backgroundColor: it.dot }]} />}
                        {it.dash && <View style={styles.statDash} />}
                        <Text style={styles.statLabel}>{it.label}</Text>
                    </View>
                </View>
            </React.Fragment>
        ))}
    </View>
);

const Tip = ({ text }) =>
    text ? (
        <View style={styles.tip}>
            <Ionicons name="sparkles-outline" size={spacing.iconSm} color={colors.accent.primary} />
            <Text style={styles.tipText}>{text}</Text>
        </View>
    ) : null;

const ChartBox = ({ children }) => {
    const [w, setW] = useState(0);
    return (
        <View onLayout={e => setW(Math.floor(e.nativeEvent.layout.width))}>
            {w > 0 && children(w)}
        </View>
    );
};

const EmptyCard = ({ cap, text }) => (
    <View style={styles.card}>
        <Text style={styles.cap}>{cap}</Text>
        <Text style={styles.empty}>{text}</Text>
    </View>
);

const RecapCard = ({ r, busy, onSwitch, onSettings }) => {
    const third = r.dir < 0
        ? { value: r.perKg != null ? sg(r.perKg, 0) : '--', unit: r.perKg != null ? '%' : undefined, label: 'Str / kg', color: r.perKg != null && r.perKg > 0 ? colors.accent.success : undefined }
        : { value: r.strengthPct != null ? sg(r.strengthPct, 0) : '--', unit: r.strengthPct != null ? '%' : undefined, label: 'Strength', color: r.strengthPct != null && r.strengthPct > 0 ? colors.accent.success : undefined };

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Phase recap</Text>
                <Text style={styles.capRight}>{`${r.tab} · ${r.weeks} weeks`}</Text>
            </View>
            <Hero value={sg(r.change, 1)} unit="kg">
                <Delta tone="good" icon="checkmark" text="goal reached" />
            </Hero>
            <Stats
                items={[
                    { value: kfmt(r.avgKcal), label: 'Avg kcal' },
                    { value: fmt1(r.rate), unit: 'kg/wk', label: 'Avg rate' },
                    third,
                ]}
            />
            <Tip text={recapTip(r)} />
            {r.maintenance != null && (
                <TouchableOpacity
                    style={[styles.cta, busy && styles.ctaBusy]}
                    onPress={onSwitch}
                    disabled={busy}
                    activeOpacity={0.9}
                >
                    <Text style={styles.ctaText}>
                        {busy ? 'Switching...' : `Switch to maintenance · ${kfmt(r.maintenance)} kcal`}
                    </Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.link} onPress={onSettings} activeOpacity={0.7}>
                <Text style={styles.linkText}>Set a different goal</Text>
            </TouchableOpacity>
        </View>
    );
};

const PaceCard = ({ m, info, n }) => {
    const [sel, setSel] = useState(null);
    useEffect(() => {
        setSel(null);
    }, [n]);

    const title = info.dir < 0 ? 'Weight loss pace' : info.dir > 0 ? 'Weight gain pace' : 'Weight drift';
    if (!m) return <EmptyCard cap={title} text="Log your weight for two weeks to see your pace." />;

    const pill = {
        on: { tone: 'good', icon: 'checkmark', text: 'on plan' },
        'slightly-ahead': { tone: 'good', icon: 'checkmark', text: 'on plan' },
        ahead: { tone: 'good', icon: 'arrow-up', text: `${fmt1(m.diff)} ahead` },
        behind: { tone: 'warn', icon: 'arrow-down', text: `${fmt1(-m.diff)} behind` },
        steady: { tone: 'good', icon: 'checkmark', text: 'steady' },
        drift: { tone: 'warn', icon: 'alert', text: 'drifting' },
    }[m.status];

    const picked = sel != null && m.slots[sel]?.v != null ? m.slots[sel] : null;
    const pickedText = picked
        ? `${shortDate(picked.monday)}${picked.gap > 1 ? ` · ${picked.gap}-wk avg` : ''}`
        : null;

    const eta = m.reached
        ? 'Reached'
        : m.eta
            ? `${shortDate(m.eta)}${m.eta.getFullYear() !== new Date().getFullYear() ? ` ${m.eta.getFullYear()}` : ''}`
            : '--';

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>{title}</Text>
                <Text style={styles.capRight}>
                    {`${n} weeks${info.remaining != null && !info.reached ? ` · ${info.remaining.toFixed(1)} kg to go` : ''}`}
                </Text>
            </View>
            <Hero value={fmt1(picked ? picked.v : m.rate)} unit="kg/wk">
                {picked ? <Delta tone="flat" text={pickedText} /> : <Delta {...pill} />}
            </Hero>
            <ChartBox>
                {w => <PaceChart slots={m.slots} plan={m.plan} width={w} sel={sel} onSelect={setSel} />}
            </ChartBox>
            <Stats
                items={[
                    { value: fmt1(m.rate4), unit: 'kg', label: '4W rate' },
                    { value: fmt1(m.total), unit: 'kg', label: info.dir < 0 ? 'Lost' : info.dir > 0 ? 'Gained' : 'Moved' },
                    { value: eta, label: 'Goal ETA' },
                ]}
            />
            <Tip text={paceTip(m, info)} />
        </View>
    );
};

const EnergyCard = ({ m, info, n }) => {
    const [sel, setSel] = useState(null);
    useEffect(() => {
        setSel(null);
    }, [n]);

    if (!m) return <EmptyCard cap="Energy balance" text="Needs about three weeks of weight and food logs to estimate your real maintenance." />;

    const f = info.dir === 0 ? 1 : info.dir;
    const bars = m.bal.map(v => (v == null ? null : v * f));
    const goal = m.targetBal != null ? m.targetBal * f : null;
    const picked = sel != null && bars[sel] != null ? sel : null;
    const shown = picked != null ? bars[picked] : m.balance * f;
    const heroText = info.dir === 0 || shown < 0 ? sg(shown, 0) : kfmt(shown);
    const unit = info.dir < 0 ? 'kcal/day deficit' : info.dir > 0 ? 'kcal/day surplus' : 'kcal/day';

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Energy balance</Text>
                <Text style={styles.capRight}>{`${m.slots.length} weeks`}</Text>
            </View>
            <Hero value={heroText} unit={unit} />
            <Text style={styles.heroNote}>{picked != null ? `week of ${shortDate(m.slots[picked].monday)}` : m.balNote}</Text>
            <ChartBox>
                {w => <BalanceChart bal={bars} target={goal} slots={m.slots} width={w} sel={sel} onSelect={setSel} />}
            </ChartBox>
            <Stats
                items={[
                    { value: kfmt(m.maintNow), unit: m.margin != null ? `\u00b1${kfmt(m.margin)}` : undefined, label: 'Maintenance' },
                    { value: kfmt(m.eatNow), label: 'Eating' },
                    { value: m.target != null ? kfmt(m.target) : '--', label: 'Target' },
                ]}
            />
            <Tip text={energyTip(m, info)} />
        </View>
    );
};

const StrengthCard = ({ m, lifts, info, onLift }) => {
    if (!m) return <EmptyCard cap="Strength vs weight" text="Train at least two lifts across a few weeks to see how your strength moves with your weight." />;

    const more = lifts.stalled.length - 1;

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Strength vs weight</Text>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.accent.cyan }]} />
                        <Text style={styles.legendText}>Strength</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.macro.protein }]} />
                        <Text style={styles.legendText}>Weight</Text>
                    </View>
                </View>
            </View>
            <Hero value={sg(m.sNow, 1)} unit="%">
                {m.wNow != null && <Delta tone="purple" text={`weight ${sg(m.wNow, 1)}%`} />}
            </Hero>
            <ChartBox>
                {w => <StrengthChart strength={m.strength} weight={m.weight} slots={m.slots} width={w} />}
            </ChartBox>
            <Stats
                items={[
                    { value: String(lifts.up), label: 'Lifts up', color: colors.accent.success },
                    { value: String(lifts.flat), label: 'Flat' },
                    { value: String(lifts.stalled.length), label: 'Stalled', color: lifts.stalled.length ? colors.accent.primary : undefined },
                ]}
            />
            {lifts.stalled.length > 0 && (
                <TouchableOpacity style={styles.alert} activeOpacity={0.7} onPress={() => onLift(lifts.stalled[0].name)}>
                    <View style={styles.alertIcon}>
                        <Ionicons name="warning-outline" size={spacing.iconSm} color={colors.accent.primary} />
                    </View>
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle} numberOfLines={1}>{lifts.stalled[0].name}</Text>
                        <Text style={styles.alertSub}>
                            No progress in {lifts.stalled[0].weeks} weeks{more > 0 ? ` · +${more} more stalled` : ''}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={spacing.icon} color={colors.text.quaternary} />
                </TouchableOpacity>
            )}
            <Tip text={strengthTip(m, info)} />
        </View>
    );
};

const SetsCard = ({ m }) => {
    if (!m) return <EmptyCard cap="Hard sets per muscle" text="Complete a few workouts to see your weekly volume per muscle." />;

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Hard sets per muscle</Text>
                <Text style={styles.capRight}>avg of last 4 weeks</Text>
            </View>
            <Hero value={String(Math.round(m.total))} unit="sets/wk">
                {m.delta != null && (
                    <Delta tone={m.delta >= 0 ? 'good' : 'warn'} text={`${sg(m.delta, 0)}% vs prior 4W`} />
                )}
            </Hero>
            <View style={styles.heat}>
                {m.rows.map(r => (
                    <View key={r.name} style={styles.heatRow}>
                        <Text style={styles.heatName} numberOfLines={1}>{r.name}</Text>
                        <View style={styles.heatCells}>
                            {r.cells.map((v, i) => (
                                <View key={i} style={[styles.heatCell, { backgroundColor: orange(heatAlpha(v)) }]} />
                            ))}
                        </View>
                        <Text style={[styles.heatAvg, r.shown < SETS_LOW && styles.heatAvgLow]}>{r.shown}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.heatAxis}>
                <Text style={styles.heatAxisText}>{shortDate(m.first)}</Text>
                <Text style={styles.heatAxisText}>this week</Text>
            </View>
            <View style={styles.key}>
                {HEAT_KEY.map(k => (
                    <View key={k.label} style={styles.keyItem}>
                        <View style={[styles.keySwatch, { backgroundColor: orange(k.a) }]} />
                        <Text style={styles.keyText}>{k.label}</Text>
                    </View>
                ))}
            </View>
            <Tip text={setsTip(m)} />
        </View>
    );
};

const Tile = ({ label, dot, value, sub }) => (
    <View style={styles.tile}>
        <View style={styles.tileLabelRow}>
            <View style={[styles.tileDot, { backgroundColor: dot }]} />
            <Text style={styles.tileLabel}>{label}</Text>
        </View>
        <Text style={styles.tileValue}>{value}</Text>
        <Text style={styles.tileDelta}>{sub || ' '}</Text>
    </View>
);

const vs = (v, d, suffix = '') => (v != null ? `${sg(v, d)}${suffix} vs prev` : null);

const MonthRow = ({ m, kind, info, open, onToggle, last }) => {
    let right;
    let tiles;

    if (kind === 'n') {
        const good = m.change != null && (info.dir === 0 ? Math.abs(m.change) < 0.5 : info.dir * m.change > 0);
        right = (
            <>
                {m.wEnd != null && (
                    <View style={styles.monthValueRow}>
                        <Text style={styles.monthValue}>{fmt1(m.wEnd)}</Text>
                        <Text style={styles.monthUnit}>kg</Text>
                    </View>
                )}
                {m.change != null && <Delta tone={good ? 'good' : 'flat'} text={sg(m.change, 1)} />}
            </>
        );
        tiles = (
            <>
                <Tile label="Avg kcal" dot={colors.accent.primary} value={kfmt(m.kcal)} sub={vs(m.d?.kcal, 0)} />
                <Tile label="Protein" dot={colors.macro.protein} value={m.protein != null ? `${Math.round(m.protein)}g` : '--'} sub={vs(m.d?.protein, 0, 'g')} />
                <Tile label="Steps" dot={colors.accent.stepsRed} value={m.steps != null ? `${(m.steps / 1000).toFixed(1)}k` : '--'} sub={vs(m.d?.steps != null ? m.d.steps / 1000 : null, 1, 'k')} />
            </>
        );
    } else {
        const hasPlan = m.planDone != null && m.planDone > 0;
        const on = hasPlan && m.sessionsDone >= m.planDone;
        right = (
            <>
                <View style={styles.monthValueRow}>
                    <Text style={styles.monthValue}>{m.sessions}</Text>
                    <Text style={styles.monthUnit}>sessions</Text>
                </View>
                {hasPlan && <Delta tone={on ? 'good' : 'warn'} text={on ? 'on plan' : `${m.planDone - m.sessionsDone} missed`} />}
            </>
        );
        tiles = (
            <>
                <Tile
                    label={hasPlan ? 'On plan' : 'Sessions'}
                    dot={colors.accent.cyan}
                    value={hasPlan ? `${m.sessionsDone}/${m.planDone}` : String(m.sessions)}
                    sub={hasPlan ? `${Math.round((m.sessionsDone / m.planDone) * 100)}%` : null}
                />
                <Tile label="Hard sets" dot={colors.accent.cyan} value={kfmt(m.sets)} sub={vs(m.d?.setsPerWeek, 0, '/wk')} />
                <Tile label="New PRs" dot={colors.accent.cyan} value={String(m.prs)} />
            </>
        );
    }

    return (
        <View style={[styles.monthRow, last && styles.monthRowLast]}>
            <TouchableOpacity style={styles.monthHead} activeOpacity={0.7} onPress={onToggle}>
                <View style={styles.monthLeft}>
                    <Text style={styles.monthName}>{m.name}</Text>
                    <Text style={styles.monthMeta}>{m.count} weeks{m.partial ? ' · to date' : ''}</Text>
                </View>
                {right}
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={spacing.iconMd} color={colors.text.quaternary} />
            </TouchableOpacity>
            {open && <View style={styles.tiles}>{tiles}</View>}
        </View>
    );
};

const MonthsCard = ({ months, kind, info, open, setOpen, all, setAll }) => {
    if (!months.length) return null;
    const shown = all ? months.slice(0, 12) : months.slice(0, 3);

    return (
        <View style={styles.cardFlush}>
            <View style={styles.listHead}>
                <Text style={styles.listTitle}>By month</Text>
                {months.length > 3 && (
                    <TouchableOpacity onPress={() => setAll(!all)} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>{all ? 'Show less' : 'View all'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {shown.map((m, i) => {
                const k = `${kind}:${m.key}`;
                const isOpen = open[k] ?? i === 0;
                return (
                    <MonthRow
                        key={m.key}
                        m={m}
                        kind={kind}
                        info={info}
                        open={isOpen}
                        onToggle={() => setOpen(o => ({ ...o, [k]: !isOpen }))}
                        last={i === shown.length - 1}
                    />
                );
            })}
        </View>
    );
};

const ProgressScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { userData, refreshUserData } = useContext(AuthContext);
    const { workoutHistory } = useContext(WorkoutContext);
    const { getNutritionForDateRange, getStepsForDateRange, rollingWeekStats } = useFoodContext();
    const [tab, setTab] = useState('nutrition');
    const [rangeKey, setRangeKey] = useState('12W');
    const [planned, setPlanned] = useState(null);
    const [open, setOpen] = useState({});
    const [all, setAll] = useState({ n: false, t: false });
    const [switching, setSwitching] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let on = true;
            (async () => {
                try {
                    const splits = await fetchSplitsFromFirestore();
                    if (!on || !splits.length) return;
                    const raw = splits.find(s => (s.id ?? s.data?.id) === userData?.activeSplitId) ?? splits[0];
                    setPlanned(countPlanned(raw.schedule ?? raw.data?.schedule));
                } catch (e) {
                    console.error('Progress split load error:', e.message);
                }
            })();
            return () => {
                on = false;
            };
        }, [userData?.activeSplitId]),
    );

    const dir = dirOf(userData?.weightChangePlan?.type);

    const built = useMemo(
        () => buildWeeks({
            weightIns: userData?.weightIns,
            weeklyNutrition: userData?.weeklyNutrition,
            dailySteps: userData?.dailySteps,
            workouts: workoutHistory,
            getNutrition: getNutritionForDateRange,
            getSteps: getStepsForDateRange,
            calc1RM: calculate1RM,
        }),
        [userData?.weightIns, userData?.weeklyNutrition, userData?.dailySteps, workoutHistory, getNutritionForDateRange, getStepsForDateRange, rollingWeekStats],
    );

    const weeks = useMemo(() => withRates(built.weeks, dir), [built, dir]);
    const info = useMemo(() => phaseInfo(userData, weeks), [userData, weeks]);
    const ranges = useMemo(() => rangeOptions(info), [info]);
    const range = ranges.find(r => r.key === rangeKey) ?? ranges[1];
    const n = range.n;

    const pace = useMemo(() => paceModel(weeks, n, info), [weeks, n, info]);
    const energy = useMemo(() => energyModel(weeks, n, info, userData?.weightIns), [weeks, n, info, userData?.weightIns]);
    const strength = useMemo(() => strengthModel(weeks, built.lifts, n), [weeks, built.lifts, n]);
    const lifts = useMemo(() => liftStats(weeks, built.lifts), [weeks, built.lifts]);
    const phaseStrength = useMemo(
        () => (info.reached && info.dir !== 0 ? strengthModel(weeks, built.lifts, Math.min(info.phaseWeeks, MAX_WEEKS)) : null),
        [weeks, built.lifts, info],
    );
    const recap = useMemo(() => phaseRecap(userData, weeks, info, energy, phaseStrength), [userData, weeks, info, energy, phaseStrength]);
    const sets = useMemo(() => setsModel(weeks, n), [weeks, n]);
    const months = useMemo(() => monthsModel(weeks, planned), [weeks, planned]);

    const openLift = useCallback(name => navigation.navigate('ExerciseHistory', { exerciseName: name }), [navigation]);

    const openSettings = useCallback(() => navigation.navigate('Settings'), [navigation]);

    const onSwitch = useCallback(() => {
        if (!recap || recap.maintenance == null || switching) return;
        Alert.alert(
            'Switch to maintenance',
            `Your target becomes ${kfmt(recap.maintenance)} kcal and a new phase starts at ${fmt1(recap.endWeight)} kg.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    onPress: async () => {
                        setSwitching(true);
                        try {
                            const uid = userData?.uid || getAuth().currentUser?.uid;
                            await switchToMaintenance(uid, userData, {
                                weight: recap.endWeight,
                                kcal: recap.maintenance,
                                entry: recapEntry(recap),
                            });
                            await refreshUserData();
                        } catch (e) {
                            console.error('Progress switch error:', e.message);
                            Alert.alert('Error', 'Failed to switch. Try again.');
                        } finally {
                            setSwitching(false);
                        }
                    },
                },
            ],
        );
    }, [recap, switching, userData, refreshUserData]);

    const status = weeks.length ? `${info.label} · week ${info.phaseWeeks}` : 'Your trends over time';

    return (
        <ApplicationCustomScreen showHeader={false}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingBottom: 70 + insets.bottom,
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleRow}>
                    <Text style={styles.status} numberOfLines={1}>{status}</Text>
                    {weeks.length >= 2 && (
                        <View style={styles.rangeRow}>
                            {ranges.map(r => (
                                <TouchableOpacity
                                    key={r.key}
                                    style={[styles.rangeTab, range.key === r.key && styles.rangeTabActive]}
                                    onPress={() => setRangeKey(r.key)}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                >
                                    <Text style={[styles.rangeText, range.key === r.key && styles.rangeTextActive]}>
                                        {r.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.seg}>
                    {TABS.map(t => {
                        const on = tab === t.key;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.segItem, on && styles.segItemOn]}
                                onPress={() => setTab(t.key)}
                                activeOpacity={0.8}
                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                            >
                                <Ionicons
                                    name={t.icon}
                                    size={spacing.iconSm}
                                    color={on ? colors.accent.primary : colors.text.tertiary}
                                />
                                <Text style={[styles.segText, on && styles.segTextOn]}>{t.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {weeks.length < 2 ? (
                    <View style={styles.emptyScreen}>
                        <Ionicons name="trending-up" size={spacing[10]} color={colors.text.quaternary} />
                        <Text style={styles.emptyTitle}>No trends yet</Text>
                        <Text style={styles.emptySub}>
                            Log your weight, food and workouts for a couple of weeks and your long-range trends show up here.
                        </Text>
                    </View>
                ) : (
                    <>
                        {tab === 'nutrition' ? (
                            <>
                                {recap && <RecapCard r={recap} busy={switching} onSwitch={onSwitch} onSettings={openSettings} />}
                                <PaceCard m={pace} info={info} n={n} />
                                <EnergyCard m={energy} info={info} n={n} />
                                <MonthsCard
                                    months={months}
                                    kind="n"
                                    info={info}
                                    open={open}
                                    setOpen={setOpen}
                                    all={all.n}
                                    setAll={v => setAll(a => ({ ...a, n: v }))}
                                />
                            </>
                        ) : (
                            <>
                                <StrengthCard m={strength} lifts={lifts} info={info} onLift={openLift} />
                                <SetsCard m={sets} />
                                <MonthsCard
                                    months={months}
                                    kind="t"
                                    info={info}
                                    open={open}
                                    setOpen={setOpen}
                                    all={all.t}
                                    setAll={v => setAll(a => ({ ...a, t: v }))}
                                />
                            </>
                        )}
                    </>
                )}
            </ScrollView>
            <BottomNav />
        </ApplicationCustomScreen>
    );
};

export default React.memo(ProgressScreen);

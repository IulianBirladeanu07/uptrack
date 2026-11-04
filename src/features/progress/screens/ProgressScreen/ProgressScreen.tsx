import React, { useCallback, useContext, useEffect, useState } from 'react';
import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav, { useBottomNavInset } from '../../../../shared/components/BottomNav/BottomNav';
import { AuthContext } from '../../../auth/context/AuthContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { formatDate } from '../../../nutrition/utils/dateUtils';
import { colors, spacing } from '../../../../shared/theme';
import { useAppNavigation } from '../../../../shared/navigation';
import { PaceChart, BalanceChart, StrengthChart } from '../../components/ProgressCharts';
import {
    SETS_LOW,
    recapTip,
    paceTip,
    energyTip,
    maintenanceRangeNote,
    liftStats,
    strengthTip,
    setsTip,
    shortDate,
    fmt1,
    sg,
    kfmt,
    isToGoalReached,
    energyBalanceDisplay,
} from '../../utils/progressEngine';
import type { EnergyModel, MonthRow as MonthData, NutritionDay, PaceModel, PaceStatus, PhaseInfo, PhaseRecap, SetsModel, StrengthModel } from '../../utils/progressEngine';
import { useProgressScreenModel } from './useProgressScreenModel';
import { useMaintenanceSwitch } from './useMaintenanceSwitch';
import { usePlannedWorkouts } from './usePlannedWorkouts';
import { getProgressChartWidth } from './progressChartWidth';
import styles from './ProgressScreenStyles';

type TabKey = 'nutrition' | 'training';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { key: TabKey; label: string }[] = [
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'training', label: 'Training' },
];

const TONES = {
    good: { bg: colors.faded.successAlt, fg: colors.accent.success },
    warn: { bg: colors.faded.primary, fg: colors.accent.primary },
    purple: { bg: colors.faded.purple, fg: colors.macro.protein },
    flat: { bg: colors.faded.surface, fg: colors.text.secondary },
};

const PHASE_PRESENTATION = {
    muscle_gain: { verb: 'Gain' },
    weight_loss: { verb: 'Lose' },
    maintenance: { verb: 'Hold' },
} as const;

const HEAT_KEY = [
    { label: '<6', a: 0.08 },
    { label: '6-9', a: 0.22 },
    { label: '10-14', a: 0.5 },
    { label: '15-20', a: 0.75 },
    { label: '20+', a: 1 },
];

const heatAlpha = (v: number) => (v < 6 ? 0.08 : v < 10 ? 0.22 : v < 15 ? 0.5 : v <= 20 ? 0.75 : 1);

const orange = (a: number) => `rgba(255, 149, 0, ${a})`;

type Tone = keyof typeof TONES;

type DeltaProps = { tone?: Tone; icon?: IconName; text: string };

const Delta = ({ tone = 'good', icon, text }: DeltaProps) => {
    const t = TONES[tone];
    return (
        <View style={[styles.dp, { backgroundColor: t.bg }]}>
            {icon && <Ionicons name={icon} size={10} color={t.fg} />}
            <Text style={[styles.dpText, { color: t.fg }]}>{text}</Text>
        </View>
    );
};

const Hero = ({ value, unit, children }: { value: string; unit?: string | undefined; children?: ReactNode }) => (
    <View style={styles.hero}>
        <View style={styles.heroValueRow}>
            <Text style={styles.big}>{value}</Text>
            {unit ? <Text style={styles.bigUnit}>{unit}</Text> : null}
        </View>
        {children}
    </View>
);

type StatItem = { value: string; unit?: string | undefined; label: string; detail?: string; color?: string | undefined; dot?: string; dash?: boolean; accessibilityLabel?: string };

const Stats = ({ items }: { items: StatItem[] }) => (
    <View style={styles.stats}>
        {items.map((it, i) => (
            <React.Fragment key={it.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View
                    style={styles.stat}
                    accessible={Boolean(it.accessibilityLabel)}
                    accessibilityLabel={it.accessibilityLabel}
                >
                    <View style={styles.statValueRow}>
                        <Text style={[styles.statValue, it.color && { color: it.color }]}>{it.value}</Text>
                        {it.unit ? <Text style={styles.statUnit}>{it.unit}</Text> : null}
                    </View>
                    <View style={styles.statLabelRow}>
                        {it.dot && <View style={[styles.statDot, { backgroundColor: it.dot }]} />}
                        {it.dash && <View style={styles.statDash} />}
                        <Text style={styles.statLabel}>{it.label}</Text>
                    </View>
                    {it.detail ? <Text style={styles.statDetail}>{it.detail}</Text> : null}
                </View>
            </React.Fragment>
        ))}
    </View>
);

const Tip = ({ text }: { text: string | null | undefined }) =>
    text ? (
        <View style={styles.tip}>
            <Text style={styles.tipText}>{text}</Text>
        </View>
    ) : null;

const MaintenanceNote = ({ recap }: { recap: PhaseRecap }) => {
    const note = maintenanceRangeNote(recap);
    if (!note) return <Tip text={recapTip(recap)} />;

    return (
        <View style={styles.maintenanceNote}>
            <Text style={[styles.tipText, styles.maintenanceNoteText]}>{note.headline}</Text>
            <Text style={styles.maintenanceNoteAdvice}>{note.basis}</Text>
            <Text style={styles.maintenanceNoteAdvice}>{note.advice}</Text>
        </View>
    );
};

const ChartBox = ({ width, children }: { width: number; children: (w: number) => ReactNode }) => (
    <View>{width > 0 && children(width)}</View>
);

const EmptyCard = ({ cap, text }: { cap: string; text: string }) => (
    <View style={styles.card}>
        <Text style={styles.cap}>{cap}</Text>
        <Text style={styles.empty}>{text}</Text>
    </View>
);

const RecapCard = ({ r, busy, onSwitch }: { r: PhaseRecap; busy: boolean; onSwitch: () => void }) => {
    const third = r.dir < 0
        ? { value: r.perKg != null ? sg(r.perKg, 0) : '--', unit: r.perKg != null ? '%' : undefined, label: 'Strength / kg', detail: 'vs bodyweight', color: r.perKg != null && r.perKg > 0 ? colors.accent.success : undefined }
        : { value: r.strengthPct != null ? sg(r.strengthPct, 0) : '--', unit: r.strengthPct != null ? '%' : undefined, label: 'Strength', color: r.strengthPct != null && r.strengthPct > 0 ? colors.accent.success : undefined };
    const hasRange = maintenanceRangeNote(r) != null;

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Phase recap</Text>
            </View>
            <Hero value={sg(r.change, 1)} unit="kg">
                <Delta tone="good" icon="checkmark" text="goal reached" />
            </Hero>
            <Stats
                items={[
                    {
                        value: fmt1(r.rate),
                        unit: 'kg/wk',
                        label: r.dir < 0 ? 'Avg loss' : 'Avg gain',
                    },
                    { value: String(r.weeks), unit: 'wk', label: 'Duration' },
                    third,
                ]}
            />
            {r.maintenanceSource === 'recent'
                ? <MaintenanceNote recap={r} />
                : <Tip text={recapTip(r)} />}
            {r.maintenanceSource === 'recent' && r.maintenance != null && (
                <TouchableOpacity
                    style={[styles.cta, busy && styles.ctaBusy]}
                    onPress={onSwitch}
                    disabled={busy}
                    activeOpacity={0.8}
                >
                    <Ionicons name="swap-horizontal" size={spacing.iconSm} color={colors.accent.buttonText} />
                    <Text style={styles.ctaText}>
                        {busy ? 'Switching...' : hasRange ? 'Switch to maintenance' : `Switch to maintenance · ~${kfmt(r.maintenance)} kcal`}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

type PaceAverage = { monday: Date; average: number; change: number | null; gap: number | null };

const PaceCard = ({
    m,
    info,
    n,
    rangeKey,
    phaseWeekCount,
    averages,
    planSummary,
    onProfile,
    chartWidth,
}: {
    m: PaceModel | null;
    info: PhaseInfo;
    n: number;
    rangeKey: string;
    phaseWeekCount: number;
    averages: PaceAverage[];
    planSummary: string;
    onProfile: () => void;
    chartWidth: number;
}) => {
    const [sel, setSel] = useState<number | null>(null);
    const phaseStart = info.phaseStart?.getTime() ?? null;
    useEffect(() => {
        setSel(null);
    }, [n, phaseStart, info.type]);

    const mature = m != null && m.count >= 4;
    const title = info.dir < 0 ? 'Rate of loss' : info.dir > 0 ? 'Rate of gain' : 'Weight stability';
    if (!mature || !m) {
        const remainingChanges = Math.max(0, 4 - Math.max(0, averages.length - 1));
        return (
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cap}>Weight trend</Text>
                    <TouchableOpacity
                        onPress={onProfile}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Change weight goal in Profile"
                    >
                        <Text style={styles.planLink}>{planSummary}</Text>
                    </TouchableOpacity>
                </View>
                {averages.length === 0 ? (
                    <Text style={styles.empty}>Your trend starts after your first weekly average.</Text>
                ) : averages.length === 1 ? (
                    <>
                        <Hero value={fmt1(averages[0].average)} unit="kg" />
                        <Text style={styles.heroNote}>First weekly average</Text>
                        <Text style={styles.empty}>Pace appears after another weekly average.</Text>
                    </>
                ) : (
                    <>
                        <View style={styles.averageList}>
                            {averages.slice(-4).map(average => (
                                <View key={average.monday.getTime()} style={styles.averageRow}>
                                    <Text style={styles.averageDate}>{shortDate(average.monday)}</Text>
                                    <Text style={styles.averageValue}>{fmt1(average.average)} kg</Text>
                                    <Text style={styles.averageChange}>
                                        {average.change == null
                                            ? '—'
                                            : `${sg(average.change, 1)} kg${average.gap != null && average.gap > 1 ? ` · ${average.gap} wk` : ''}`}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.heroNote}>
                            {remainingChanges > 0
                                ? `${remainingChanges} more weekly ${remainingChanges === 1 ? 'change' : 'changes'} to estimate pace.`
                                : 'Building a reliable pace estimate.'}
                        </Text>
                    </>
                )}
                {rangeKey !== 'PHASE' && info.phaseStart && phaseWeekCount < n && (
                    <Text style={styles.heroNote}>Pace uses this phase only; earlier weeks are excluded.</Text>
                )}
            </View>
        );
    }

    const pills: Record<PaceStatus, DeltaProps | null> = {
        on: { tone: 'good', icon: 'checkmark', text: 'on plan' },
        'slightly-ahead': { tone: 'good', icon: 'checkmark', text: 'on plan' },
        ahead: { tone: 'good', icon: 'arrow-up', text: `${fmt1(m.diff)} ahead` },
        behind: { tone: 'warn', icon: 'arrow-down', text: `${fmt1(-(m.diff as number))} behind` },
        steady: { tone: 'good', icon: 'checkmark', text: 'steady' },
        drift: { tone: 'warn', icon: 'alert', text: 'drifting' },
        reached: null,
    };
    const pill = pills[m.status];

    const picked = sel != null && m.slots[sel]?.v != null ? m.slots[sel] : null;
    const eta = m.reached
        ? 'Reached'
        : m.eta
            ? `${shortDate(m.eta)}${m.eta.getFullYear() !== new Date().getFullYear() ? ` ${m.eta.getFullYear()}` : ''}`
            : '--';
    const goalReached = m.reached && isToGoalReached(info.remaining);
    const goalStat = m.reached
        ? { value: goalReached ? 'Reached' : fmt1(info.remaining ?? 0), unit: goalReached ? undefined : 'kg', label: 'To goal', color: goalReached ? colors.accent.success : undefined }
        : { value: eta, label: 'Goal ETA' };
    const trendShown = m.slots.length >= 12 && m.slots.filter(slot => slot.avg != null).length > 1;
    const latestIsPartial = [...m.slots].reverse().find(slot => slot.v != null)?.cur ?? false;

    const recent = m.rate4 ?? m.rate;

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>{title}</Text>
                <TouchableOpacity
                    onPress={onProfile}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Change weight goal in Profile"
                >
                    <Text style={styles.planLink}>{planSummary}</Text>
                </TouchableOpacity>
            </View>
            <Hero value={fmt1(picked ? picked.v : recent)} unit="kg/wk">
                {!picked && pill ? <Delta {...pill} /> : null}
            </Hero>
            {!picked && <Text style={styles.heroNote}>{`${m.recentWeeks}-week average`}</Text>}
            <ChartBox width={chartWidth}>
                {w => <PaceChart slots={m.slots} plan={m.plan} width={w} sel={sel} onSelect={setSel} />}
            </ChartBox>
            {rangeKey !== 'PHASE' && info.phaseStart && phaseWeekCount < n && (
                <Text style={styles.heroNote}>Pace uses this phase only; earlier weeks are excluded.</Text>
            )}
            {trendShown && (
                <View style={[styles.legendRow, styles.chartLegend]}>
                    <View style={styles.legendItem}>
                        <View style={styles.legendLine} />
                        <Text style={styles.legendText}>4-week average</Text>
                    </View>
                </View>
            )}
            <Stats
                items={[
                    {
                        value: fmt1(m.lastRate),
                        unit: 'kg/wk',
                        label: latestIsPartial ? 'This week' : 'Latest week',
                        ...(latestIsPartial ? {
                            detail: 'partial',
                            accessibilityLabel: `This week, partial: ${fmt1(m.lastRate)} kilograms per week`,
                        } : {}),
                    },
                    { value: m.plan != null ? fmt1(m.plan) : '--', unit: m.plan != null ? 'kg/wk' : undefined, label: 'Plan' },
                    goalStat,
                ]}
            />
            <Tip text={paceTip(m, info)} />
        </View>
    );
};

const EnergyCard = ({ m, info, n, chartWidth }: { m: EnergyModel | null; info: PhaseInfo; n: number; chartWidth: number }) => {
    const [sel, setSel] = useState<number | null>(null);
    useEffect(() => {
        setSel(null);
    }, [n]);

    if (!m) return <EmptyCard cap="Energy balance" text="Needs about four weeks of weight and food logs to estimate your real maintenance." />;

    const f = info.dir === 0 ? 1 : info.dir;
    const bars = m.bal.map(v => (v == null ? null : v * f));
    const goal = m.targetBal != null ? m.targetBal * f : null;
    const picked = sel != null && bars[sel] != null ? sel : null;
    const shown = picked != null ? (m.bal[picked] as number) : m.balance;
    const { value: heroText, unit } = energyBalanceDisplay(shown);

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Energy balance</Text>
            </View>
            <Hero value={heroText} unit={unit} />
            <Text style={styles.heroNote}>{picked != null ? `week of ${shortDate(m.slots[picked].monday)}` : m.balNote}</Text>
            <ChartBox width={chartWidth}>
                {w => <BalanceChart bal={bars} target={goal} slots={m.slots} width={w} sel={sel} onSelect={setSel} />}
            </ChartBox>
            <Stats
                items={[
                    { value: `~${kfmt(m.maintNow)}`, unit: m.margin != null ? `\u00b1${kfmt(m.margin)}` : undefined, label: 'Est. maintenance' },
                    { value: kfmt(m.eatNow), label: 'Eating' },
                    { value: m.target != null ? kfmt(m.target) : '--', label: 'Eat target' },
                ]}
            />
            <Tip text={energyTip(m, info)} />
        </View>
    );
};

const StrengthCard = ({ m, lifts, info, onLift, chartWidth }: { m: StrengthModel | null; lifts: ReturnType<typeof liftStats>; info: PhaseInfo; onLift: (name: string, muscleGroup?: string) => void; chartWidth: number }) => {
    if (!m) return <EmptyCard cap="Strength vs weight" text="Train at least two lifts across a few weeks to see how your strength moves with your weight." />;

    const more = lifts.stalled.length - 1;
    const perKgPill = info.dir < 0 && m.perKg != null;
    const anyLift = lifts.up + lifts.flat + lifts.stalled.length > 0;

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
            <Hero value={perKgPill ? sg(m.perKg!, 0) : sg(m.sNow as number, 1)} unit={perKgPill ? '% per kg' : '%'}>
                {!perKgPill && m.wNow != null && <Delta tone="purple" text={`weight ${sg(m.wNow, 1)}%`} />}
            </Hero>
            <ChartBox width={chartWidth}>
                {w => <StrengthChart strength={m.strength} weight={m.weight} slots={m.slots} width={w} />}
            </ChartBox>
            {anyLift && (
                <Stats
                    items={[
                        { value: String(lifts.up), label: 'Lifts up', color: colors.accent.success },
                        { value: String(lifts.flat), label: 'Flat' },
                        { value: String(lifts.stalled.length), label: 'Stalled', color: lifts.stalled.length ? colors.accent.primary : undefined },
                    ]}
                />
            )}
            {lifts.stalled.length > 0 && (
                <TouchableOpacity
                    style={styles.alert}
                    activeOpacity={0.7}
                    onPress={() => onLift(lifts.stalled[0].name, lifts.stalled[0].muscleGroup)}
                >
                    <View style={styles.alertIcon}>
                        <Ionicons name="warning-outline" size={spacing.iconSm} color={colors.accent.primary} />
                    </View>
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle} numberOfLines={1}>{lifts.stalled[0].name}</Text>
                        <Text style={styles.alertSub}>
                            {lifts.stalled[0].muscleGroup ? `${lifts.stalled[0].muscleGroup} · ` : ''}
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

const SetsCard = ({ m }: { m: SetsModel | null }) => {
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
                            {r.cells.slice(0, -1).map((v, i) => (
                                <View key={i} style={[styles.heatCell, { backgroundColor: orange(heatAlpha(v)) }]} />
                            ))}
                        </View>
                        <Text style={[styles.heatAvg, r.shown < SETS_LOW && styles.heatAvgLow]}>{r.shown}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.heatAxis}>
                <Text style={styles.heatAxisText}>{shortDate(m.first)}</Text>
                <Text style={styles.heatAxisText}>last week</Text>
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

const Tile = ({ label, dot, value, sub }: { label: string; dot: string; value: string; sub?: string | null }) => (
    <View style={styles.tile}>
        <View style={styles.tileLabelRow}>
            <View style={[styles.tileDot, { backgroundColor: dot }]} />
            <Text style={styles.tileLabel}>{label}</Text>
        </View>
        <Text style={styles.tileValue}>{value}</Text>
        {sub ? <Text style={styles.tileDelta}>{sub}</Text> : null}
    </View>
);

const vs = (v: number | null | undefined, d: number, suffix = '') => (v != null ? `${sg(v, d)}${suffix} vs prev` : null);

type MonthRowProps = { m: MonthData; kind: 'n' | 't'; open: boolean; onToggle: () => void; last: boolean };

const MonthRow = ({ m, kind, open, onToggle, last }: MonthRowProps) => {
    let right: ReactNode;
    let tiles: ReactNode;

    if (kind === 'n') {
        right = (
            <>
                {m.wEnd != null && (
                    <View style={styles.monthValueRow}>
                        <Text style={styles.monthValue}>{fmt1(m.wEnd)}</Text>
                        <Text style={styles.monthUnit}>kg</Text>
                    </View>
                )}
                {m.change != null && <Text style={styles.monthChange}>{sg(m.change, 1)}</Text>}
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
        const on = hasPlan && m.sessionsDone >= m.planDone!;
        right = (
            <>
                <View style={styles.monthValueRow}>
                    <Text style={styles.monthValue}>{m.sessions}</Text>
                    <Text style={styles.monthUnit}>sessions</Text>
                </View>
                {hasPlan && <Delta tone={on ? 'good' : 'warn'} text={on ? 'on plan' : `${m.planDone! - m.sessionsDone} missed`} />}
            </>
        );
        tiles = (
            <>
                <Tile
                    label={hasPlan ? 'On plan' : 'Sessions'}
                    dot={colors.accent.cyan}
                    value={hasPlan ? `${m.sessionsDone}/${m.planDone!}` : String(m.sessions)}
                    sub={hasPlan ? `${Math.round((m.sessionsDone / m.planDone!) * 100)}%` : null}
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
                    <Text style={styles.monthMeta}>{m.count === 1 && m.partial ? 'this week' : `${m.count} ${m.count === 1 ? 'week' : 'weeks'}${m.partial ? ' · to date' : ''}`}</Text>
                </View>
                {right}
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={spacing.iconMd} color={colors.text.quaternary} />
            </TouchableOpacity>
            {open && <View style={styles.tiles}>{tiles}</View>}
        </View>
    );
};

type MonthsCardProps = {
    months: MonthData[];
    kind: 'n' | 't';
    open: Record<string, boolean>;
    setOpen: Dispatch<SetStateAction<Record<string, boolean>>>;
    all: boolean;
    setAll: (v: boolean) => void;
};

const MonthsCard = ({ months, kind, open, setOpen, all, setAll }: MonthsCardProps) => {
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
    const navInset = useBottomNavInset();
    const navigation = useAppNavigation();
    const { userData, refreshUserData } = useContext(AuthContext)!;
    const {
        workoutHistory,
        hasMoreWorkoutHistory,
        loadingMoreWorkoutHistory,
        workoutHistoryLoadMoreError,
        loadMoreWorkoutHistory,
    } = useContext(WorkoutContext)!;
    const { currentUserId, getNutritionForDateRange, fetchNutritionForDateRange, getStepsForDateRange, rollingWeekStats } = useFoodContext();
    const [tab, setTab] = useState<TabKey>('nutrition');
    const [screenWidth, setScreenWidth] = useState(0);
    const chartWidth = getProgressChartWidth(screenWidth);
    const [rangeKey, setRangeKey] = useState<string | null>(null);
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const [all, setAll] = useState({ n: false, t: false });
    const [phaseNutritionHistory, setPhaseNutritionHistory] = useState<NutritionDay[] | null>(null);
    const [phaseNutritionHistoryLoading, setPhaseNutritionHistoryLoading] = useState(false);
    const [phaseNutritionHistoryError, setPhaseNutritionHistoryError] = useState(false);
    const planned = usePlannedWorkouts(userData?.activeSplitId, userData?.uid);
    const phaseStartDate = userData?.goalSwitchDate ?? null;
    const phaseNutritionStart = phaseStartDate ? new Date(phaseStartDate) : null;

    useEffect(() => {
        const start = phaseStartDate ? new Date(phaseStartDate) : null;
        if (!currentUserId || !start || Number.isNaN(start.getTime()) || start.getTime() >= Date.now()) {
            setPhaseNutritionHistory(null);
            setPhaseNutritionHistoryLoading(false);
            setPhaseNutritionHistoryError(false);
            return;
        }

        let active = true;
        setPhaseNutritionHistory(null);
        setPhaseNutritionHistoryLoading(true);
        setPhaseNutritionHistoryError(false);
        fetchNutritionForDateRange(start, new Date())
            .then(days => {
                if (active) setPhaseNutritionHistory(days);
            })
            .catch(error => {
                console.error('[ProgressScreen] historical nutrition load failed:', error);
                if (active) setPhaseNutritionHistoryError(true);
            })
            .finally(() => {
                if (active) setPhaseNutritionHistoryLoading(false);
            });

        return () => { active = false; };
    }, [currentUserId, phaseStartDate, fetchNutritionForDateRange]);

    const getProgressNutrition = useCallback((from: Date, to: Date) => {
        if (!phaseNutritionHistory) return getNutritionForDateRange(from, to);
        const startKey = formatDate(from);
        const endKey = formatDate(to);
        return phaseNutritionHistory.filter(day => day.date >= startKey && day.date <= endKey);
    }, [phaseNutritionHistory, getNutritionForDateRange]);

    useEffect(() => {
        if (!hasMoreWorkoutHistory || loadingMoreWorkoutHistory || workoutHistoryLoadMoreError) return;

        const oldestDate = workoutHistory.reduce<Date | null>((oldest, workout) => {
            const timestamp = workout['timestamp'] as {
                toDate?: () => Date;
                seconds?: number;
            } | string | number | null | undefined;
            const date = timestamp && typeof timestamp === 'object'
                ? timestamp.toDate?.() ??
                    (typeof timestamp.seconds === 'number' ? new Date(timestamp.seconds * 1000) : null)
                : timestamp ? new Date(timestamp) : null;
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return oldest;
            return !oldest || date < oldest ? date : oldest;
        }, null);
        const analysisStart = new Date();
        analysisStart.setDate(analysisStart.getDate() - 104 * 7);

        if (oldestDate && oldestDate >= analysisStart) {
            void loadMoreWorkoutHistory();
        }
    }, [
        hasMoreWorkoutHistory,
        loadingMoreWorkoutHistory,
        workoutHistoryLoadMoreError,
        loadMoreWorkoutHistory,
        workoutHistory,
    ]);

    const {
        weeks,
        info,
        ranges,
        range,
        n,
        pace,
        paceAverages,
        phaseWeekCount,
        energy,
        strength,
        lifts,
        recap,
        sets,
        months,
    } = useProgressScreenModel({
        userData,
        workoutHistory,
        getNutrition: getProgressNutrition,
        getSteps: getStepsForDateRange,
        nutritionHistoryStart: phaseNutritionHistory && phaseNutritionStart && !Number.isNaN(phaseNutritionStart.getTime())
            ? phaseNutritionStart
            : null,
        rollingWeekStats,
        rangeKey,
        planned,
    });

    const openLift = useCallback((name: string, muscleGroup?: string) => navigation.navigate('ExerciseHistory', {
        exerciseName: name,
        ...(muscleGroup ? { muscleGroup } : {}),
    }), [navigation]);

    const openProfile = useCallback(() => navigation.navigate('Profile'), [navigation]);

    const { switching, onSwitch } = useMaintenanceSwitch({ recap, userData, refreshUserData });
    const phasePresentation = PHASE_PRESENTATION[info.type];
    const planSummary = info.dir === 0
        ? 'Hold steady · Profile'
        : info.planRate != null
            ? `${phasePresentation.verb} ${fmt1(info.planRate)} kg/wk · Profile`
            : `${phasePresentation.verb} · Profile`;
    return (
        <ApplicationCustomScreen>
            <ScrollView
                style={styles.container}
                onLayout={event => {
                    const width = Math.floor(event.nativeEvent.layout.width);
                    setScreenWidth(previous => previous === width ? previous : width);
                }}
                contentContainerStyle={{
                    paddingBottom: navInset + spacing[4],
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleRow}>
                    <View style={styles.viewRow}>
                        {TABS.map(t => {
                            const on = tab === t.key;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[styles.viewTab, on && styles.viewTabActive]}
                                    onPress={() => setTab(t.key)}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: on }}
                                    accessibilityLabel={t.label}
                                >
                                    <Text style={[styles.viewText, on && styles.viewTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {ranges.length > 1 && (
                        <View style={styles.rangeRow}>
                            {ranges.map(r => {
                                const selected = range.key === r.key;
                                return (
                                    <TouchableOpacity
                                        key={r.key}
                                        style={[styles.rangeOption, selected && styles.rangeOptionActive]}
                                        onPress={() => setRangeKey(r.key)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected }}
                                        accessibilityLabel={r.label}
                                    >
                                        <Text
                                            style={[styles.rangeText, selected && styles.rangeTextActive]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            maxFontSizeMultiplier={1.2}
                                        >
                                            {r.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
                {workoutHistoryLoadMoreError && hasMoreWorkoutHistory && (
                    <TouchableOpacity onPress={() => void loadMoreWorkoutHistory()}>
                        <Text style={styles.emptySub}>
                            Workout history is incomplete. Tap to retry loading it.
                        </Text>
                    </TouchableOpacity>
                )}

                {weeks.length === 0 ? (
                    <View style={styles.emptyScreen}>
                        <Ionicons name="trending-up" size={spacing[10]} color={colors.text.quaternary} />
                        <Text style={styles.emptyTitle}>No trends yet</Text>
                        <Text style={styles.emptySub}>
                            Log weight, food, or workouts to start building your progress history.
                        </Text>
                    </View>
                ) : (
                    <>
                        {tab === 'nutrition' ? (
                            <>
                                {recap && <RecapCard r={recap} busy={switching} onSwitch={onSwitch} />}
                                {phaseNutritionHistoryLoading && (
                                    <Text style={styles.statDetail}>Loading food history from this phase...</Text>
                                )}
                                {phaseNutritionHistoryError && (
                                    <Text style={styles.emptySub}>
                                        Could not load historical food logs. Showing saved weekly summaries instead.
                                    </Text>
                                )}
                                <PaceCard
                                    m={pace}
                                    info={info}
                                    n={n}
                                    rangeKey={range.key}
                                    phaseWeekCount={phaseWeekCount}
                                    averages={paceAverages}
                                    planSummary={planSummary}
                                    onProfile={openProfile}
                                    chartWidth={chartWidth}
                                />
                                <EnergyCard m={energy} info={info} n={n} chartWidth={chartWidth} />
                                <MonthsCard
                                    months={months}
                                    kind="n"
                                    open={open}
                                    setOpen={setOpen}
                                    all={all.n}
                                    setAll={v => setAll(a => ({ ...a, n: v }))}
                                />
                            </>
                        ) : (
                            <>
                                <StrengthCard m={strength} lifts={lifts} info={info} onLift={openLift} chartWidth={chartWidth} />
                                <SetsCard m={sets} />
                                <MonthsCard
                                    months={months}
                                    kind="t"
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

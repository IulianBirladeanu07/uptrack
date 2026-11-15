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
import { WEEKS_PER_MONTH } from '../../../profile/utils/nutritionPlanEngine';
import { useAppNavigation } from '../../../../shared/navigation';
import { BulkTrendChart, PaceChart, BalanceChart, StrengthChart, WeightTrendChart } from '../../components/ProgressCharts';
import type { WeightTrendPoint } from '../../components/ProgressCharts';
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
    energyBalanceDisplay,
} from '../../utils/progressEngine';
import type { EnergyModel, MonthRow as MonthData, MonthlyHistoryRow, NutritionDay, PaceModel, PaceStatus, PhaseInfo, PhaseRecap, SetsModel, StrengthModel } from '../../utils/progressEngine';
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
    error: { bg: colors.faded.errorAlt, fg: colors.accent.error },
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

const phaseWeekSubtitle = (info: PhaseInfo, subtitle?: string) =>
    `Week ${info.phaseWeeks} of ${info.dir > 0 ? 'bulking' : info.dir < 0 ? 'cutting' : info.label.toLowerCase()}${subtitle ? ` · ${subtitle}` : ''}`;

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
            <Ionicons name="sparkles-outline" size={spacing.iconMd} color={colors.accent.primary} />
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

const EmptyCard = ({ cap, text, subtitle }: { cap: string; text: string; subtitle?: string }) => (
    <View style={styles.card}>
        <Text style={styles.cap}>{cap}</Text>
        {subtitle && <Text style={styles.heroNote}>{subtitle}</Text>}
        <Text style={styles.empty}>{text}</Text>
    </View>
);

const RecapCard = ({ r, busy, onSwitch, onProfile }: { r: PhaseRecap; busy: boolean; onSwitch: () => void; onProfile: () => void }) => {
    const third = r.dir < 0
        ? { value: r.perKg != null ? sg(r.perKg, 0) : '--', unit: r.perKg != null ? '%' : undefined, label: 'Rel. strength', color: r.perKg != null && r.perKg > 0 ? colors.accent.success : undefined }
        : { value: r.strengthPct != null ? sg(r.strengthPct, 0) : '--', unit: r.strengthPct != null ? '%' : undefined, label: 'Strength', color: r.strengthPct != null && r.strengthPct > 0 ? colors.accent.success : undefined };
    const phaseLabel = r.dir < 0 ? 'Cutting' : 'Bulking';

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>{phaseLabel} phase recap</Text>
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
                        {busy ? 'Switching...' : `Switch to maintenance · ~${kfmt(r.maintenance)} kcal`}
                    </Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.link} onPress={onProfile} activeOpacity={0.7}>
                <Text style={styles.linkText}>Choose another goal in Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const PaceCard = ({
    m,
    info,
    n,
    rangeKey,
    phaseWeekCount,
    averages,
    planSummary,
    onProfile,
    gainRatePerWeek,
    gainTrendWeeks,
    gainTrendStart,
    currentWeekHasWeight,
    bulkSettlingPeriod,
    chartWidth,
}: {
    m: PaceModel | null;
    info: PhaseInfo;
    n: number;
    rangeKey: string;
    phaseWeekCount: number;
    averages: (WeightTrendPoint & { change: number | null; gap: number | null })[];
    planSummary: string;
    onProfile: () => void;
    gainRatePerWeek: number | null;
    gainTrendWeeks: number;
    gainTrendStart: Date | null;
    currentWeekHasWeight: boolean;
    bulkSettlingPeriod: boolean;
    chartWidth: number;
}) => {
    const [sel, setSel] = useState<number | null>(null);
    const phaseStart = info.phaseStart?.getTime() ?? null;
    useEffect(() => {
        setSel(null);
    }, [n, phaseStart, info.type]);

    const title = info.dir < 0 ? 'Weight loss pace' : info.dir > 0 ? 'Weight gain pace' : 'Weight stability';
    if (!m && info.dir > 0) {
        const completeWeeks = averages.filter(point => !point.current).length;
        const remainingWeeks = Math.max(0, 3 - completeWeeks);
        const targetMonthly = info.planRate == null ? null : info.planRate * WEEKS_PER_MONTH;
        return (
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cap}>{title}</Text>
                    <TouchableOpacity
                        onPress={onProfile}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Change gain target in Profile"
                    >
                        <Text style={styles.planLink}>
                            {targetMonthly == null ? 'Set target · Profile' : `Target ${fmt1(targetMonthly)} kg/month`}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Hero value="--" unit="kg/month">
                    <Delta tone="flat" text="Building trend" />
                </Hero>
                <Text style={styles.heroNote}>
                    {phaseWeekSubtitle(info, currentWeekHasWeight ? 'This week is still in progress and is not included in the trend' : undefined)}
                </Text>
                <Text style={styles.empty}>
                    {completeWeeks === 0
                        ? 'Add complete weekly averages to start seeing your gain trend.'
                        : `Need ${remainingWeeks} more complete ${remainingWeeks === 1 ? 'week' : 'weeks'} to estimate your pace.`}
                </Text>
            </View>
        );
    }

    if (!m) {
        const remainingChanges = Math.max(0, 4 - Math.max(0, averages.length - 1));
        const latestAverage = averages[averages.length - 1];
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
                {latestAverage && (
                    <>
                        <Hero value={fmt1(latestAverage.average)} unit="kg" />
                        <Text style={styles.heroNote}>
                            {phaseWeekSubtitle(info, `Weekly average · week of ${shortDate(latestAverage.monday)}`)}
                        </Text>
                    </>
                )}
                {averages.length >= 2 && (
                    <ChartBox width={chartWidth}>
                        {w => <WeightTrendChart points={averages} width={w} />}
                    </ChartBox>
                )}
                <Text style={styles.empty}>
                    {averages.length === 0
                        ? 'Your trend starts after your first weekly average.'
                        : averages.length === 1
                            ? 'Pace appears after another weekly average.'
                            : remainingChanges > 0
                                ? `${remainingChanges} more weekly ${remainingChanges === 1 ? 'change' : 'changes'} to estimate pace.`
                                : 'Building a reliable pace estimate.'}
                </Text>
                <Stats
                    items={[
                        {
                            value: info.dir === 0 ? 'Hold' : info.planRate != null ? fmt1(info.planRate) : '--',
                            unit: info.dir !== 0 && info.planRate != null ? 'kg/wk' : undefined,
                            label: 'Plan',
                        },
                        {
                            value: info.goal != null && info.remaining != null ? fmt1(info.remaining) : '--',
                            unit: info.goal != null && info.remaining != null ? 'kg' : undefined,
                            label: 'To goal',
                        },
                        { value: String(averages.length), unit: 'wk', label: 'Weeks logged' },
                    ]}
                />
                {rangeKey !== 'PHASE' && info.phaseStart && phaseWeekCount < n && (
                    <Text style={styles.heroNote}>Pace uses this phase only; earlier weeks are excluded.</Text>
                )}
            </View>
        );
    }

    if (info.dir > 0) {
        const points = averages;
        const monthlyRate = gainRatePerWeek == null ? null : gainRatePerWeek * WEEKS_PER_MONTH;
        const targetMonthly = info.planRate == null ? null : info.planRate * WEEKS_PER_MONTH;
        const tolerance = targetMonthly == null ? 0.15 : Math.max(targetMonthly * 0.25, 0.15);
        const verdict: DeltaProps | null = monthlyRate == null || targetMonthly == null || gainTrendWeeks < 3
            ? null
            : monthlyRate < targetMonthly - tolerance
                ? { tone: 'warn', icon: 'arrow-down', text: 'Below target' }
                : monthlyRate > targetMonthly + tolerance
                    ? { tone: 'warn', icon: 'arrow-up', text: 'Above target' }
                    : { tone: 'good', icon: 'checkmark', text: 'On track' };
        const latest = [...points].reverse().find(point => !point.current);
        const currentWeekPoint = points.find(point => point.current);
        const latestWeight = currentWeekPoint ?? latest;
        const latestWeightChange = latestWeight?.change == null
            ? null
            : Number(latestWeight.change.toFixed(1));
        const latestWeightChangeLabel = latestWeightChange == null || latestWeight?.gap == null
            ? null
            : `${latestWeightChange > 0 ? '+' : ''}${fmt1(latestWeightChange)} kg vs ${
                latestWeight.gap === 1 ? 'last week' : `${latestWeight.gap} weeks ago`
            }`;
        const fourWeekFactor = 4 / WEEKS_PER_MONTH;
        const projectedWeight = latest && monthlyRate != null
            ? latest.average + monthlyRate * fourWeekFactor
            : null;
        const targetWeight = latest && targetMonthly != null
            ? latest.average + targetMonthly * fourWeekFactor
            : null;
        const outlookDate = latest ? new Date(latest.monday) : null;
        outlookDate?.setDate(outlookDate.getDate() + 28);
        const outlookDifference = projectedWeight != null && targetWeight != null
            ? projectedWeight - targetWeight
            : null;
        const outlookOnTarget = outlookDifference != null &&
            Math.abs(outlookDifference) <= tolerance * fourWeekFactor;
        const trendWeeks = Math.min(gainTrendWeeks, 4);
        const trendTip = bulkSettlingPeriod
            ? null
            : verdict && verdict.text !== 'On track' && gainTrendWeeks >= 4
                ? 'If this pace stays off target, review calories in Profile.'
                : null;
        return (
            <View style={styles.card}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cap}>Weight gain pace</Text>
                    <TouchableOpacity
                        onPress={onProfile}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Change gain target in Profile"
                    >
                        <Text style={styles.planLink}>
                            {targetMonthly == null ? 'Set target · Profile' : `Target ${fmt1(targetMonthly)} kg/month`}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Hero
                    value={monthlyRate == null
                        ? latestWeight ? fmt1(latestWeight.average) : '--'
                        : fmt1(monthlyRate)}
                    unit={monthlyRate == null ? 'kg' : 'kg/month'}
                >
                    {monthlyRate == null
                        ? <Delta
                            tone="flat"
                            text={bulkSettlingPeriod
                                ? 'Settling'
                                : latestWeightChangeLabel ?? (currentWeekPoint ? 'This week so far' : 'Latest weekly avg')}
                        />
                        : verdict && <Delta {...verdict} />}
                </Hero>
                <Text style={styles.heroNote}>
                    {phaseWeekSubtitle(info, monthlyRate != null
                        ? `${trendWeeks}-week trend · monthly`
                        : bulkSettlingPeriod
                            ? 'After a cut, glycogen and water can raise weight quickly. Follow the trend as it settles over the next few weeks.'
                            : `${Math.max(1, 3 - gainTrendWeeks)} more full ${Math.max(1, 3 - gainTrendWeeks) === 1 ? 'week' : 'weeks'} for a trend.`)}
                </Text>
                {points.length >= 2 ? (
                    <ChartBox width={chartWidth}>
                        {w => (
                            <BulkTrendChart
                                points={points}
                                targetRatePerMonth={bulkSettlingPeriod ? null : targetMonthly}
                                tolerancePerMonth={tolerance}
                                targetStart={bulkSettlingPeriod ? null : gainTrendStart}
                                width={w}
                            />
                        )}
                    </ChartBox>
                ) : (
                    <Text style={styles.empty}>Building your trend from full weeks.</Text>
                )}
                {projectedWeight != null && targetWeight != null && (
                    <View style={styles.outlook}>
                        <View style={styles.outlookHeader}>
                            <Text style={styles.cap}>4-week outlook</Text>
                            {outlookDate && <Text style={styles.outlookDate}>By {shortDate(outlookDate)}</Text>}
                        </View>
                        <View style={styles.outlookValues}>
                            <View style={styles.outlookValueBlock}>
                                <Text style={styles.outlookValue}>{fmt1(projectedWeight)} kg</Text>
                                <Text style={styles.outlookLabel}>At this pace</Text>
                            </View>
                            <View style={styles.outlookDivider} />
                            <View style={styles.outlookValueBlock}>
                                <Text style={styles.outlookValue}>{fmt1(targetWeight)} kg</Text>
                                <Text style={styles.outlookLabel}>At target pace</Text>
                            </View>
                        </View>
                        {outlookDifference != null && (
                            <Text style={[styles.outlookDifference, outlookOnTarget && styles.outlookOnTarget]}>
                                {outlookOnTarget
                                    ? 'Within target range'
                                    : `${fmt1(Math.abs(outlookDifference))} kg ${outlookDifference > 0 ? 'above' : 'below'} target path`}
                            </Text>
                        )}
                    </View>
                )}
                {trendTip && <Tip text={trendTip} />}
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
    const recent = m.rate4 ?? m.rate;
    const latestCompletedRate = [...m.slots].reverse().find(slot => slot.v != null && !slot.cur)?.v;
    const goalStat = m.reached
        ? { value: 'Reached', label: 'Goal' }
        : {
            value: info.dir === 0 ? 'Hold' : m.plan != null ? fmt1(m.plan) : '--',
            unit: info.dir !== 0 && m.plan != null ? 'kg/wk' : undefined,
            label: 'Target rate',
        };
    const headerNote = picked
        ? `week of ${shortDate(picked.monday)}${(picked.gap ?? 0) > 1 ? ` · ${picked.gap}-wk avg` : ''}`
        : info.remaining != null && !info.reached
            ? `${info.remaining.toFixed(1)} kg to go`
            : null;
    const diff = m.diff;
    const scaledPill = pill == null ? null : {
        ...pill,
        text: m.status === 'ahead' ? `${fmt1(diff)} ahead` : m.status === 'behind' ? `${fmt1(-(diff ?? 0))} behind` : pill.text,
    };

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>{title}</Text>
                {headerNote != null && <Text style={styles.capRight}>{headerNote}</Text>}
            </View>
            <Hero
                value={fmt1(picked ? picked.v : recent)}
                unit="kg/wk"
            >
                {!picked && scaledPill ? <Delta {...scaledPill} /> : null}
            </Hero>
            <Text style={styles.heroNote}>
                {phaseWeekSubtitle(info, !picked ? `last ${m.recentWeeks}-week average` : undefined)}
            </Text>
            <ChartBox width={chartWidth}>
                {w => (
                    <PaceChart
                        slots={m.slots}
                        plan={m.plan}
                        width={w}
                        sel={sel}
                        onSelect={setSel}
                    />
                )}
            </ChartBox>
            {rangeKey !== 'PHASE' && info.phaseStart && phaseWeekCount < n && (
                <Text style={styles.heroNote}>Pace uses this phase only; earlier weeks are excluded.</Text>
            )}
            <Stats
                items={[
                    {
                        value: latestCompletedRate == null ? '--' : fmt1(latestCompletedRate),
                        unit: 'kg/wk',
                        label: 'Latest full week',
                    },
                    { value: m.rate == null ? '--' : fmt1(m.rate), unit: 'kg/wk', label: 'Range avg' },
                    goalStat,
                ]}
            />
            {m.eta && (
                <Text style={styles.heroNote}>
                    Estimated goal date · {shortDate(m.eta)}{m.eta.getFullYear() !== new Date().getFullYear() ? ` ${m.eta.getFullYear()}` : ''}
                </Text>
            )}
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
    const { value: heroText, unit } = energyBalanceDisplay(shown, picked == null ? m.margin : null);

    return (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cap}>Energy balance</Text>
                {m.targetBal != null && (
                    <Text style={styles.capRight}>
                        Target {m.targetBal > 0 ? '+' : ''}{kfmt(m.targetBal)} kcal/day
                    </Text>
                )}
            </View>
            <Hero value={heroText} unit={unit} />
            <Text style={[styles.heroNote, styles.energyBalanceNote]}>
                {picked != null ? `week of ${shortDate(m.slots[picked].monday)}` : m.balNote}
            </Text>
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
    if (!m) return <EmptyCard cap="Strength vs weight" subtitle={phaseWeekSubtitle(info)} text="Train at least two lifts across a few weeks to see how your strength moves with your weight." />;

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
            <Text style={styles.heroNote}>{phaseWeekSubtitle(info)}</Text>
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
                            <View style={[styles.heatCell, styles.heatCurrentCell]} />
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

type MonthRowProps = {
    m: MonthData;
    open: boolean;
    onToggle: () => void;
    last: boolean;
};

const MonthRow = ({ m, open, onToggle, last }: MonthRowProps) => {
    const hasPlan = m.planDone != null && m.planDone > 0;
    const on = hasPlan && m.sessionsDone >= m.planDone!;
    const right = (
        <>
            <View style={styles.monthValueRow}>
                <Text style={styles.monthValue}>{m.sessions}</Text>
                <Text style={styles.monthUnit}>sessions</Text>
            </View>
            {hasPlan && <Delta tone={on ? 'good' : 'warn'} text={on ? 'on plan' : `${m.planDone! - m.sessionsDone} missed`} />}
        </>
    );
    const tiles = (
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

    return (
        <View style={[styles.monthRow, last && styles.monthRowLast]}>
            <TouchableOpacity style={styles.monthHead} activeOpacity={0.7} onPress={onToggle}>
                <View style={styles.monthLeft}>
                    <Text style={styles.monthName}>{m.name}</Text>
                    <Text style={styles.monthMeta}>{`${m.count} ${m.count === 1 ? 'week' : 'weeks'}`}</Text>
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
    open: Record<string, boolean>;
    setOpen: Dispatch<SetStateAction<Record<string, boolean>>>;
    all: boolean;
    setAll: (v: boolean) => void;
};

const MonthsCard = ({ months, open, setOpen, all, setAll }: MonthsCardProps) => {
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
                const k = `t:${m.key}`;
                const isOpen = open[k] ?? i === 0;
                return (
                    <MonthRow
                        key={m.key}
                        m={m}
                        open={isOpen}
                        onToggle={() => setOpen(o => ({ ...o, [k]: !isOpen }))}
                        last={i === shown.length - 1}
                    />
                );
            })}
        </View>
    );
};

const monthLabel = (month: MonthlyHistoryRow): string =>
    `${month.name.slice(0, 3)}${month.year === new Date().getFullYear() ? '' : ` ${month.year}`}`;

const changeReasonText = (reason: MonthlyHistoryRow['changeReason']): string | null =>
    reason === 'settling' ? 'settling after switch' : reason === 'gap' ? 'gap in weigh-ins' : reason === 'short' ? 'needs 4 weeks' : null;

const PastMonthsHeader = () => (
    <View style={styles.historyHeader}>
        <View style={styles.historyCellMonth} />
        <View style={styles.historyCellEnded}><Text style={styles.historyLabel}>Ended</Text></View>
        <View style={styles.historyCellChange}><Text style={styles.historyLabel}>Change</Text></View>
        <View style={styles.historyCellAvg}><Text style={styles.historyLabel}>Avg kcal</Text></View>
    </View>
);

const PastMonthRow = ({ month, last }: { month: MonthlyHistoryRow; last: boolean }) => {
    const reason = month.change == null ? changeReasonText(month.changeReason) : null;

    return (
        <View style={[styles.historyRow, last && styles.monthRowLast]}>
            <View style={styles.historyCellMonth}>
                <Text style={styles.monthName}>{monthLabel(month)}</Text>
                {month.phaseLabel && <Text style={styles.historyMeta}>{month.phaseLabel}</Text>}
            </View>
            <View style={styles.historyCellEnded}>
                <Text style={styles.historyValue}>{month.endedAt == null ? '--' : `${fmt1(month.endedAt)} kg`}</Text>
            </View>
            <View style={styles.historyCellChange}>
                <Text style={styles.historyValue}>{month.change == null ? '--' : `${sg(month.change, 1)} kg`}</Text>
                {month.changeWeeks != null && <Text style={styles.historyMeta}>over {month.changeWeeks} weeks</Text>}
                {reason != null && <Text style={styles.historyMeta}>{reason}</Text>}
            </View>
            <View style={styles.historyCellAvg}>
                <Text style={styles.historyValue}>{month.avgKcal == null ? '--' : kfmt(month.avgKcal)}</Text>
                {month.avgKcal != null && <Text style={styles.historyMeta}>{month.avgKcalDays} logged days</Text>}
            </View>
        </View>
    );
};

const PastMonthsCard = ({ months, all, setAll }: { months: MonthlyHistoryRow[]; all: boolean; setAll: (value: boolean) => void }) => {
    if (!months.length) return null;
    const shown = all ? months.slice(0, 12) : months.slice(0, 3);

    return (
        <View style={styles.cardFlush}>
            <View style={styles.listHead}>
                <Text style={styles.listTitle}>Past months</Text>
                {months.length > 3 && (
                    <TouchableOpacity onPress={() => setAll(!all)} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>{all ? 'Show less' : 'View all'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            <PastMonthsHeader />
            {shown.map((month, index) => (
                <PastMonthRow key={`${month.key}:${month.phaseLabel ?? 'history'}:${index}`} month={month} last={index === shown.length - 1} />
            ))}
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
        gainRatePerWeek,
        gainTrendWeeks,
        gainTrendStart,
        currentWeekHasWeight,
        bulkSettlingPeriod,
        phaseWeekCount,
        energy,
        strength,
        lifts,
        recap,
        sets,
        months,
        pastMonths,
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
                    paddingTop: spacing[1],
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerRow}>
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
                    {weeks.length >= 2 && (
                        <View style={styles.rangeSelector}>
                            {ranges.map(r => {
                                const selected = range.key === r.key;
                                return (
                                    <TouchableOpacity
                                        key={r.key}
                                        style={[styles.rangeTab, selected && styles.rangeTabActive]}
                                        onPress={() => setRangeKey(r.key)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected }}
                                    >
                                        <Text
                                            style={[styles.rangeText, selected && styles.rangeTextActive]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            maxFontSizeMultiplier={1.2}
                                        >
                                            {r.label.replace(' wk', 'W')}
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
                                {recap && <RecapCard r={recap} busy={switching} onSwitch={onSwitch} onProfile={openProfile} />}
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
                                    gainRatePerWeek={gainRatePerWeek}
                                    gainTrendWeeks={gainTrendWeeks}
                                    gainTrendStart={gainTrendStart}
                                    currentWeekHasWeight={currentWeekHasWeight}
                                    bulkSettlingPeriod={bulkSettlingPeriod}
                                    planSummary={planSummary}
                                    onProfile={openProfile}
                                    chartWidth={chartWidth}
                                />
                                <EnergyCard m={energy} info={info} n={n} chartWidth={chartWidth} />
                                <PastMonthsCard months={pastMonths} all={all.n} setAll={v => setAll(a => ({ ...a, n: v }))} />
                            </>
                        ) : (
                            <>
                                <StrengthCard m={strength} lifts={lifts} info={info} onLift={openLift} chartWidth={chartWidth} />
                                <SetsCard m={sets} />
                                <MonthsCard
                                    months={months}
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import type { PlanType, WeightInWeek } from '../../../../shared/types';
import WeightChart, { getAvailablePeriods } from './WeightChart';
import type { ChartDelta, ChartEntry, PeriodKey } from './WeightChart';
import {
    buildWeeklyGroups,
    formatWeekLabel,
    formatWeightDate,
    getWeightTrendTone,
    isComparisonInCurrentGoalPhase,
} from './weightTrackerPresentation';

type TrendBadgeProps = { value: number | null; planType: PlanType; phaseKnown: boolean };
type WeekRowProps = { group: ReturnType<typeof buildWeeklyGroups>[number]; planType: PlanType; phaseKnown: boolean; expanded: boolean; onToggle: () => void };

type WeightProgressPanelProps = {
    trendData: ChartEntry[];
    goalSwitchDate: string | null;
    startWeight: number | null;
    weightIns: WeightInWeek[];
    isBulking: boolean;
    planType: PlanType;
    onViewAll: () => void;
};

const TrendBadge = ({ value, planType, phaseKnown }: TrendBadgeProps) => {
    if (value == null) return null;
    const tone = getWeightTrendTone(value, planType, phaseKnown);
    const color = tone === 'favorable'
        ? colors.accent.success
        : tone === 'unfavorable'
            ? colors.accent.error
            : colors.text.quaternary;
    const bg = tone === 'favorable'
        ? colors.faded.successAlt
        : tone === 'unfavorable'
            ? colors.faded.errorAlt
            : colors.faded.surface;
    return (
        <View style={[styles.trendChip, { backgroundColor: bg }]}>
            <Text style={[styles.trendChipText, { color }]}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}
            </Text>
        </View>
    );
};

const WeekRow = ({ group, planType, phaseKnown, expanded, onToggle }: WeekRowProps) => (
    <View>
        <TouchableOpacity style={styles.weekHeader} onPress={onToggle} activeOpacity={0.7}>
            <View style={styles.weekHeaderLeft}>
                <Text style={styles.weekLabel}>Week of {formatWeekLabel(group.weekStart)}</Text>
                <Text style={styles.weekMeta}>{group.daysLogged} day{group.daysLogged !== 1 ? 's' : ''} logged</Text>
            </View>
            <View style={styles.weekHeaderRight}>
                {group.average != null && (
                    <View style={styles.weekAverageRow}>
                        <Text style={styles.weekAverage}>{group.average.toFixed(1)}</Text>
                        <Text style={styles.weekAverageUnit}> kg</Text>
                    </View>
                )}
                <TrendBadge value={group.trend} planType={planType} phaseKnown={phaseKnown} />
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.quaternary} />
            </View>
        </TouchableOpacity>
        {expanded && group.days.length > 0 && (
            <View style={styles.dayList}>
                {group.days.map((day, index) => (
                    <View key={day.key} style={[styles.dayRow, index === group.days.length - 1 && styles.dayRowLast]}>
                        <Text style={styles.dayLabel}>{formatWeightDate(day.date)}</Text>
                        <View style={styles.dayWeightRow}>
                            <Text style={styles.dayWeight}>{day.weight.toFixed(1)}</Text>
                            <Text style={styles.dayWeightUnit}> kg</Text>
                        </View>
                    </View>
                ))}
            </View>
        )}
    </View>
);

const WeightProgressPanel = ({
    trendData,
    goalSwitchDate,
    startWeight,
    weightIns,
    isBulking,
    planType,
    onViewAll,
}: WeightProgressPanelProps) => {
    const [chartPeriod, setChartPeriod] = useState<PeriodKey>('7');
    const [chartWidth, setChartWidth] = useState(0);
    const [chartDelta, setChartDelta] = useState<ChartDelta | null>(null);
    const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

    const weeklyGroups = useMemo(() => buildWeeklyGroups(weightIns), [weightIns]);
    const availablePeriods = useMemo(() => {
        const periods = getAvailablePeriods(trendData, goalSwitchDate);
        return periods.map(period =>
            period.key === 'PHASE'
                ? { ...period, label: planType === 'muscle_gain' ? 'Bulk' : planType === 'maintenance' ? 'Maintenance' : 'Cut' }
                : period
        );
    }, [trendData, goalSwitchDate, isBulking, planType]);

    useEffect(() => {
        if (!availablePeriods.some(period => period.key === chartPeriod)) setChartPeriod('7');
    }, [availablePeriods, chartPeriod]);

    const toggleWeek = useCallback((weekStart: string) => {
        setExpandedWeeks(previous => ({ ...previous, [weekStart]: !previous[weekStart] }));
    }, []);

    return (
        <>
            <View
                style={styles.card}
                onLayout={event => setChartWidth(event.nativeEvent.layout.width - spacing[5] * 2)}
            >
                <View style={styles.periodTrack}>
                    <View style={styles.periodTabs}>
                        {availablePeriods.map(period => (
                            <TouchableOpacity
                                key={period.key}
                                style={[styles.periodPill, chartPeriod === period.key && styles.periodPillActive]}
                                onPress={() => setChartPeriod(period.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.periodPillText, chartPeriod === period.key && styles.periodPillTextActive]}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {chartDelta && (
                        <View style={[styles.deltaPill, { backgroundColor: chartDelta.bg }]}>
                            <Text style={[styles.deltaPillText, { color: chartDelta.color }]}>
                                {chartDelta.value > 0 ? '+' : ''}{chartDelta.value.toFixed(1)} kg {chartDelta.caption}
                            </Text>
                        </View>
                    )}
                </View>
                {chartWidth > 0 && (
                    <WeightChart
                        data={trendData}
                        period={chartPeriod}
                        isBulking={isBulking}
                        width={chartWidth}
                        onDeltaChange={setChartDelta}
                        goalSwitchDate={goalSwitchDate}
                        startWeight={startWeight}
                    />
                )}
            </View>

            {weeklyGroups.length > 0 && (
                <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.cardTitle}>History</Text>
                        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyList}>
                        {weeklyGroups.slice(0, 8).map((group, index) => (
                            <View key={group.weekStart}>
                                {index > 0 && <View style={styles.weekDivider} />}
                                <WeekRow
                                    group={group}
                                    planType={planType}
                                    phaseKnown={isComparisonInCurrentGoalPhase(
                                        group.weekStart,
                                        weeklyGroups[index + 1]?.weekStart,
                                        goalSwitchDate,
                                    )}
                                    expanded={!!expandedWeeks[group.weekStart]}
                                    onToggle={() => toggleWeek(group.weekStart)}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </>
    );
};

const styles = createStyles(() => ({
    card: { backgroundColor: colors.background.secondary, borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default, padding: spacing[5] },
    cardTitle: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
    viewAllText: { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.accent.primary },
    periodTrack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] },
    periodTabs: { flexDirection: 'row', gap: spacing[5] },
    periodPill: { paddingBottom: spacing[2], borderBottomWidth: 2, borderBottomColor: 'transparent' },
    periodPillActive: { borderBottomColor: colors.accent.primary },
    periodPillText: { fontSize: fontSize[12], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
    periodPillTextActive: { color: colors.text.primary, fontWeight: fontWeight.bold },
    deltaPill: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius[1], alignItems: 'center' },
    deltaPillText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },
    historyCard: { backgroundColor: colors.background.secondary, borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden' },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border.default },
    historyList: { paddingHorizontal: spacing[4] },
    weekDivider: { height: 1, backgroundColor: colors.border.light },
    weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3] },
    weekHeaderLeft: { flex: 1 },
    weekHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    weekLabel: { fontSize: fontSize[14], fontWeight: fontWeight.semibold, color: colors.text.primary },
    weekMeta: { fontSize: fontSize[10], fontWeight: fontWeight.medium, color: colors.text.quaternary, marginTop: 2 },
    weekAverageRow: { flexDirection: 'row', alignItems: 'baseline' },
    weekAverage: { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    weekAverageUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    trendChip: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius[1], minWidth: 36, alignItems: 'center' },
    trendChipText: { fontSize: fontSize[10], fontWeight: fontWeight.bold },
    dayList: { paddingBottom: spacing[2] },
    dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[2], paddingLeft: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.light },
    dayRowLast: { borderBottomWidth: 0 },
    dayLabel: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
    dayWeightRow: { flexDirection: 'row', alignItems: 'baseline' },
    dayWeight: { fontSize: fontSize[14], fontWeight: fontWeight.extrabold, color: colors.text.primary, letterSpacing: -0.5 },
    dayWeightUnit: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary },
}));

export default WeightProgressPanel;

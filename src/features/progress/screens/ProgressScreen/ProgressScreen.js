import React, { useContext, useMemo, useState, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import { AuthContext } from '../../../auth/context/AuthContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import styles from './ProgressScreenStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing[4] * 2;
const NUM_WEEKS_OPTIONS = [4, 8, 12];

const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
};

const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

const weekLabel = (mondayDate) =>
    new Date(mondayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const deltaOf = (a, b) => {
    if (a == null || b == null) return null;
    return parseFloat((a - b).toFixed(2));
};

const useWeeklyBuckets = (weightIns, getNutritionForDateRange, getStepsForDateRange, workoutHistory, numWeeks) => {
    return useMemo(() => {
        const today = new Date();
        const currentMonday = getMonday(today);
        return Array.from({ length: numWeeks }, (_, i) => {
            const monday = addDays(currentMonday, -(numWeeks - 1 - i) * 7);
            const sunday = addDays(monday, 6);
            const weekKey = toDateKey(monday);
            const isCurrent = i === numWeeks - 1;

            const weightEntry = weightIns?.find(w => w.weekStart === weekKey);
            const avgWeight = weightEntry?.average ?? null;
            const daysLoggedWeight = weightEntry?.days
                ? Object.values(weightEntry.days).filter(v => v != null && !isNaN(v)).length
                : 0;

            const nutritionDays = getNutritionForDateRange
                ? getNutritionForDateRange(monday, sunday).filter(d => d.calories > 0)
                : [];
            const avgCalories = nutritionDays.length
                ? Math.round(nutritionDays.reduce((s, d) => s + d.calories, 0) / nutritionDays.length)
                : null;
            const avgProtein = nutritionDays.length
                ? Math.round(nutritionDays.reduce((s, d) => s + d.protein, 0) / nutritionDays.length)
                : null;
            const avgCarbs = nutritionDays.length
                ? Math.round(nutritionDays.reduce((s, d) => s + d.carbs, 0) / nutritionDays.length)
                : null;
            const avgFat = nutritionDays.length
                ? Math.round(nutritionDays.reduce((s, d) => s + d.fat, 0) / nutritionDays.length)
                : null;

            const stepsDays = getStepsForDateRange
                ? getStepsForDateRange(monday, sunday).filter(d => d.steps > 0)
                : [];
            const avgSteps = stepsDays.length
                ? Math.round(stepsDays.reduce((s, d) => s + d.steps, 0) / stepsDays.length)
                : null;

            const workouts = (workoutHistory ?? []).filter(w => {
                const d = w.timestamp?.toDate?.();
                return d && d >= monday && d <= sunday;
            });

            return {
                monday, sunday, weekKey, isCurrent,
                label: weekLabel(monday),
                avgWeight, daysLoggedWeight,
                avgCalories, avgProtein, avgCarbs, avgFat,
                avgSteps, daysLoggedSteps: stepsDays.length,
                workoutCount: workouts.length,
                daysLoggedNutrition: nutritionDays.length,
            };
        });
    }, [weightIns, getNutritionForDateRange, getStepsForDateRange, workoutHistory, numWeeks]);
};

const makeChartConfig = (r, g, b) => ({
    backgroundGradientFrom: colors.background.secondary,
    backgroundGradientTo: colors.background.secondary,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
    strokeWidth: 2,
    propsForDots: { r: '0' },
    propsForBackgroundLines: { stroke: 'transparent' },
    decimalPlaces: 1,
    labelColor: () => 'transparent',
    propsForLabels: { fontSize: 0 },
    fillShadowGradient: `rgb(${r}, ${g}, ${b})`,
    fillShadowGradientOpacity: 0.08,
});

const WEIGHT_CFG = makeChartConfig(255, 149, 0);
const CAL_CFG    = makeChartConfig(16, 185, 129);
const STEPS_CFG  = makeChartConfig(59, 130, 246);

const Sparkline = ({ data, config, height = 56 }) => {
    const valid = data.filter(v => v != null && v > 0);
    if (valid.length < 2) return <View style={[styles.sparklineEmpty, { height }]} />;
    const safeData = data.map(v => v ?? 0);
    const minVal = Math.min(...safeData.filter(v => v > 0));
    const adjusted = safeData.map(v => v === 0 ? minVal * 0.98 : v);
    return (
        <LineChart
            data={{ labels: data.map(() => ''), datasets: [{ data: adjusted }] }}
            width={CHART_WIDTH}
            height={height}
            chartConfig={config}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            withDots={false}
            style={styles.sparkline}
            fromZero={false}
        />
    );
};

const DeltaBadge = ({ value, positiveIsGood = true, suffix = '', decimals = 1 }) => {
    if (value == null) return null;
    const abs = Math.abs(value);
    const neutral = abs < 0.05;
    const good = positiveIsGood ? value > 0 : value < 0;
    const color = neutral ? colors.text.quaternary : good ? colors.accent.success : colors.accent.error;
    const icon = neutral ? 'remove' : value > 0 ? 'arrow-up' : 'arrow-down';
    const bg = neutral ? colors.faded.surface : good ? colors.faded.successAlt : colors.faded.errorAlt;
    return (
        <View style={[styles.deltaBadge, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={9} color={color} />
            <Text style={[styles.deltaBadgeText, { color }]}>
                {abs.toFixed(decimals)}{suffix}
            </Text>
        </View>
    );
};

const WeekChips = ({ buckets, getBucketValue, positiveIsGood, suffix, decimals }) => {
    const scrollRef = useRef(null);
    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekChipsRow}
            onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
            {buckets.map((week, i) => {
                const value = getBucketValue(week);
                const prev = i > 0 ? getBucketValue(buckets[i - 1]) : null;
                const delta = deltaOf(value, prev);
                const good = delta == null ? null : positiveIsGood ? delta > 0 : delta < 0;
                const neutral = delta != null && Math.abs(delta) < 0.05;
                const dotColor = neutral
                    ? colors.text.quaternary
                    : good === true ? colors.accent.success
                    : good === false ? colors.accent.error
                    : colors.border.default;

                return (
                    <View key={week.weekKey} style={[styles.weekChip, week.isCurrent && styles.weekChipCurrent]}>
                        <Text style={[styles.weekChipLabel, week.isCurrent && styles.weekChipLabelCurrent]}>
                            {week.isCurrent ? 'Now' : week.label}
                        </Text>
                        <Text style={[styles.weekChipValue, week.isCurrent && styles.weekChipValueCurrent]}>
                            {value != null
                                ? `${typeof value === 'number' && value >= 1000
                                    ? value.toLocaleString()
                                    : value.toFixed
                                        ? value.toFixed(decimals)
                                        : value}${suffix ?? ''}`
                                : '—'}
                        </Text>
                        {delta != null && (
                            <View style={[styles.weekChipDot, { backgroundColor: dotColor }]} />
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
};

const SummaryCard = ({ current, prev, userData }) => {
    const targetRate = userData?.weightChangePlan?.ratePerWeek ?? null;
    const weightDelta = deltaOf(current?.avgWeight, prev?.avgWeight);
    const onTrack = targetRate != null && weightDelta != null
        ? Math.abs(weightDelta - targetRate) < 0.15
        : null;

    const stats = [
        {
            iconName: 'flame',
            iconBg: colors.faded.primary,
            iconBorder: colors.border.primaryAlt,
            iconColor: colors.accent.primary,
            value: current?.avgCalories != null ? current.avgCalories.toLocaleString() : '—',
            label: `Avg Cal${current?.daysLoggedNutrition != null ? ` (${current.daysLoggedNutrition}d)` : ''}`,
            delta: deltaOf(current?.avgCalories, prev?.avgCalories),
            positiveIsGood: true,
            deltaDecimals: 0,
            deltaSuffix: ' kcal',
        },
        {
            iconName: 'scale',
            iconBg: colors.faded.purple,
            iconBorder: 'rgba(147,51,234,0.2)',
            iconColor: colors.accent.purple,
            value: current?.avgWeight != null ? `${current.avgWeight.toFixed(1)} kg` : '—',
            label: `Avg Weight${current?.daysLoggedWeight != null ? ` (${current.daysLoggedWeight}d)` : ''}`,
            delta: weightDelta,
            positiveIsGood: targetRate != null ? targetRate < 0 : false,
            deltaDecimals: 2,
            deltaSuffix: ' kg',
        },
        {
            iconName: 'footsteps',
            iconBg: colors.faded.stepsRed,
            iconBorder: colors.border.stepsRed,
            iconColor: colors.accent.stepsRed,
            value: current?.avgSteps != null ? `${(current.avgSteps / 1000).toFixed(1)}k` : '—',
            label: `Avg Steps${current?.daysLoggedSteps != null ? ` (${current.daysLoggedSteps}d)` : ''}`,
            delta: current?.avgSteps != null && prev?.avgSteps != null
                ? deltaOf(current.avgSteps / 1000, prev.avgSteps / 1000)
                : null,
            positiveIsGood: true,
            deltaDecimals: 1,
            deltaSuffix: 'k',
        },
        {
            iconName: 'barbell',
            iconBg: colors.faded.cyanDark,
            iconBorder: colors.border.cyanDark,
            iconColor: colors.accent.cyan,
            value: current?.workoutCount != null ? `${current.workoutCount}` : '—',
            label: 'Workouts',
            delta: deltaOf(current?.workoutCount, prev?.workoutCount),
            positiveIsGood: true,
            deltaDecimals: 0,
            deltaSuffix: '',
        },
    ];

    return (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>This Week</Text>
                {onTrack != null && (
                    <View style={[styles.onTrackBadge, {
                        backgroundColor: onTrack ? colors.faded.successAlt : colors.faded.errorAlt,
                    }]}>
                        <Ionicons
                            name={onTrack ? 'checkmark-circle' : 'alert-circle'}
                            size={11}
                            color={onTrack ? colors.accent.success : colors.accent.error}
                        />
                        <Text style={[styles.onTrackText, {
                            color: onTrack ? colors.accent.success : colors.accent.error,
                        }]}>
                            {onTrack ? 'On track' : `Target ${targetRate > 0 ? '+' : ''}${targetRate.toFixed(2)} kg/wk`}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.statsGrid}>
                {stats.map((s, i) => (
                    <View key={i} style={styles.statItem}>
                        <View style={[styles.statIconBox, { backgroundColor: s.iconBg, borderColor: s.iconBorder }]}>
                            <Ionicons name={s.iconName} size={spacing.icon} color={s.iconColor} />
                        </View>
                        <View style={styles.statText}>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                            <DeltaBadge
                                value={s.delta}
                                positiveIsGood={s.positiveIsGood}
                                suffix={s.deltaSuffix}
                                decimals={s.deltaDecimals}
                            />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const CardHeader = ({ title, value, unit, delta, positiveIsGood, decimals, daysLogged, accentColor }) => (
    <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
            <Text style={styles.cardTitle}>{title}</Text>
            {daysLogged != null && (
                <Text style={styles.cardDaysLogged}>{daysLogged}/7d</Text>
            )}
        </View>
        <View style={styles.cardHeaderRight}>
            <Text style={[styles.cardCurrentValue, { color: accentColor }]}>
                {value ?? '—'}{value != null && unit ? unit : ''}
            </Text>
            <DeltaBadge value={delta} positiveIsGood={positiveIsGood} suffix={unit ?? ''} decimals={decimals} />
        </View>
    </View>
);

const WeightCard = ({ buckets, current, prev, userData }) => {
    const delta = deltaOf(current?.avgWeight, prev?.avgWeight);
    const targetRate = userData?.weightChangePlan?.ratePerWeek ?? null;
    const goalWeight = userData?.weightChangePlan?.goalWeight ?? null;

    return (
        <View style={styles.metricCard}>
            <CardHeader
                title="Weight"
                value={current?.avgWeight?.toFixed(1)}
                unit=" kg"
                delta={delta}
                positiveIsGood={targetRate != null ? targetRate < 0 : false}
                decimals={2}
                daysLogged={current?.daysLoggedWeight}
                accentColor={colors.accent.primary}
            />
            {goalWeight != null && current?.avgWeight != null && (
                <View style={styles.goalRow}>
                    <Text style={styles.goalText}>Goal {goalWeight} kg</Text>
                    <Text style={[styles.goalRemaining, {
                        color: Math.abs(current.avgWeight - goalWeight) < 1
                            ? colors.accent.success : colors.text.quaternary,
                    }]}>
                        {Math.abs(current.avgWeight - goalWeight).toFixed(1)} kg to go
                    </Text>
                </View>
            )}
            <Sparkline data={buckets.map(b => b.avgWeight)} config={WEIGHT_CFG} height={64} />
            <WeekChips
                buckets={buckets}
                getBucketValue={b => b.avgWeight}
                positiveIsGood={targetRate != null ? targetRate < 0 : false}
                suffix=" kg"
                decimals={1}
            />
        </View>
    );
};

const NutritionCard = ({ buckets, current, prev, userData }) => {
    const calDelta = deltaOf(current?.avgCalories, prev?.avgCalories);
    const atTarget = userData?.targetCalories != null && current?.avgCalories != null
        ? Math.abs(current.avgCalories - userData.targetCalories) < userData.targetCalories * 0.05
        : null;

    const macros = [
        {
            label: 'CARBS',
            value: current?.avgCarbs != null ? `${current.avgCarbs}g` : '—',
            color: colors.macro.carbs,
            bg: colors.faded.carbs,
            border: colors.border.carbs,
            delta: deltaOf(current?.avgCarbs, prev?.avgCarbs),
        },
        {
            label: 'PROTEIN',
            value: current?.avgProtein != null ? `${current.avgProtein}g` : '—',
            target: userData?.targetProtein != null ? `${Math.round(userData.targetProtein)}g` : null,
            color: colors.macro.protein,
            bg: colors.faded.protein,
            border: colors.border.protein,
            delta: deltaOf(current?.avgProtein, prev?.avgProtein),
        },
        {
            label: 'FAT',
            value: current?.avgFat != null ? `${current.avgFat}g` : '—',
            color: colors.macro.fat,
            bg: colors.faded.fat,
            border: colors.border.fat,
            delta: deltaOf(current?.avgFat, prev?.avgFat),
        },
    ];

    return (
        <View style={styles.metricCard}>
            <CardHeader
                title="Calories"
                value={current?.avgCalories != null ? current.avgCalories.toLocaleString() : null}
                unit=" kcal"
                delta={calDelta}
                positiveIsGood
                decimals={0}
                daysLogged={current?.daysLoggedNutrition}
                accentColor={colors.accent.success}
            />
            {userData?.targetCalories != null && current?.avgCalories != null && (
                <Text style={[styles.cardSubtext, {
                    color: atTarget ? colors.accent.success : colors.text.quaternary,
                }]}>
                    target {userData.targetCalories.toLocaleString()} kcal{atTarget ? ' · on target' : ''}
                </Text>
            )}
            <Sparkline data={buckets.map(b => b.avgCalories)} config={CAL_CFG} height={56} />
            <View style={styles.macroTilesRow}>
                {macros.map((m, i) => (
                    <View key={i} style={[styles.macroTile, { backgroundColor: m.bg, borderColor: m.border }]}>
                        <View style={styles.macroTileHeader}>
                            <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                            <Text style={styles.macroTileLabel}>{m.label}</Text>
                        </View>
                        <Text style={styles.macroTileValue}>{m.value}</Text>
                        {m.target != null && (
                            <Text style={styles.macroTileTarget}>{m.target}</Text>
                        )}
                    </View>
                ))}
            </View>
            <View style={styles.chipsDivider} />
            <WeekChips
                buckets={buckets}
                getBucketValue={b => b.avgCalories}
                positiveIsGood
                suffix=" kcal"
                decimals={0}
            />
        </View>
    );
};

const ActivityCard = ({ buckets, current, prev }) => {
    const stepsDelta = current?.avgSteps != null && prev?.avgSteps != null
        ? deltaOf(current.avgSteps / 1000, prev.avgSteps / 1000)
        : null;
    const workoutDelta = deltaOf(current?.workoutCount, prev?.workoutCount);

    return (
        <View style={styles.metricCard}>
            <View style={styles.activityRow}>
                <View style={[styles.activityHalf, styles.activityHalfBorder]}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.cardAccentBar, { backgroundColor: colors.accent.blue }]} />
                        <Text style={styles.cardTitle}>Steps</Text>
                        {current?.daysLoggedSteps != null && (
                            <Text style={styles.cardDaysLogged}>{current.daysLoggedSteps}/7d</Text>
                        )}
                    </View>
                    <View style={styles.activityValueRow}>
                        <Text style={[styles.cardCurrentValue, { color: colors.accent.blue }]}>
                            {current?.avgSteps != null ? `${(current.avgSteps / 1000).toFixed(1)}k` : '—'}
                        </Text>
                        <DeltaBadge value={stepsDelta} positiveIsGood suffix="k" decimals={1} />
                    </View>
                </View>
                <View style={styles.activityHalf}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.cardAccentBar, { backgroundColor: colors.accent.purple }]} />
                        <Text style={styles.cardTitle}>Workouts</Text>
                    </View>
                    <View style={styles.activityValueRow}>
                        <Text style={[styles.cardCurrentValue, { color: colors.accent.purple }]}>
                            {current?.workoutCount != null ? `${current.workoutCount}` : '—'}
                        </Text>
                        <DeltaBadge value={workoutDelta} positiveIsGood decimals={0} />
                    </View>
                </View>
            </View>
            <Sparkline data={buckets.map(b => b.avgSteps)} config={STEPS_CFG} height={44} />
            <WeekChips
                buckets={buckets}
                getBucketValue={b => b.avgSteps != null ? parseFloat((b.avgSteps / 1000).toFixed(1)) : null}
                positiveIsGood
                suffix="k"
                decimals={1}
            />
        </View>
    );
};

const ProgressScreen = () => {
    const insets = useSafeAreaInsets();
    const { userData } = useContext(AuthContext);
    const { workoutHistory } = useContext(WorkoutContext);
    const { getNutritionForDateRange, getStepsForDateRange } = useFoodContext();
    const [numWeeks, setNumWeeks] = useState(8);

    const buckets = useWeeklyBuckets(
        userData?.weightIns,
        getNutritionForDateRange,
        getStepsForDateRange,
        workoutHistory,
        numWeeks,
    );

    const current = buckets[buckets.length - 1];
    const prev = buckets[buckets.length - 2];

    return (
        <ApplicationCustomScreen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingBottom: 70 + insets.bottom,
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Progress</Text>
                    <View style={styles.weeksPills}>
                        {NUM_WEEKS_OPTIONS.map(n => (
                            <TouchableOpacity
                                key={n}
                                style={[styles.pill, numWeeks === n && styles.pillActive]}
                                onPress={() => setNumWeeks(n)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.pillText, numWeeks === n && styles.pillTextActive]}>
                                    {n}W
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <SummaryCard current={current} prev={prev} userData={userData} />
                <WeightCard buckets={buckets} current={current} prev={prev} userData={userData} />
                <NutritionCard buckets={buckets} current={current} prev={prev} userData={userData} />
                <ActivityCard buckets={buckets} current={current} prev={prev} />
            </ScrollView>
            <BottomNav />
        </ApplicationCustomScreen>
    );
};

export default React.memo(ProgressScreen);
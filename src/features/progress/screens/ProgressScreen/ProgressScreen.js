import React, { useContext, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import { AuthContext } from '../../../auth/context/AuthContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import styles from './ProgressScreenStyles';

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

const useWeightStatus = (weightDelta, targetRate) => useMemo(() => {
    if (weightDelta == null || targetRate == null) return null;

    const sameDirection =
        (targetRate < 0 && weightDelta <= 0) ||
        (targetRate > 0 && weightDelta >= 0) ||
        (targetRate === 0 && Math.abs(weightDelta) < 0.15);

    if (!sameDirection) {
        return {
            type: 'bad',
            icon: 'alert-circle',
            title: 'Off track',
            message: `Trending opposite to your ${targetRate > 0 ? '+' : ''}${targetRate.toFixed(2)} kg/wk goal`,
        };
    }

    const diff = Math.abs(weightDelta) - Math.abs(targetRate);

    if (Math.abs(diff) < 0.15) {
        return {
            type: 'good',
            icon: 'checkmark-circle',
            title: 'On track',
            message: `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(2)} kg this week, right on pace`,
        };
    }

    if (diff < 0) {
        return {
            type: 'warn',
            icon: 'time',
            title: 'Behind pace',
            message: `Trending slower than your ${targetRate > 0 ? '+' : ''}${targetRate.toFixed(2)} kg/wk goal`,
        };
    }

    return {
        type: 'good',
        icon: 'trending-up',
        title: 'Ahead of pace',
        message: `Trending faster than your ${targetRate > 0 ? '+' : ''}${targetRate.toFixed(2)} kg/wk goal`,
    };
}, [weightDelta, targetRate]);

const DeltaBadge = ({ value, positiveIsGood = true, suffix = '', decimals = 1, compact = false }) => {
    if (value == null) return null;
    const abs = Math.abs(value);
    const neutral = abs < 0.05;
    const good = positiveIsGood ? value > 0 : value < 0;
    const color = neutral ? colors.text.quaternary : good ? colors.accent.success : colors.accent.error;
    const icon = neutral ? 'remove' : value > 0 ? 'arrow-up' : 'arrow-down';
    const bg = neutral ? colors.faded.surface : good ? colors.faded.successAlt : colors.faded.errorAlt;
    return (
        <View style={[styles.deltaBadge, compact && styles.deltaBadgeCompact, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={compact ? 8 : 9} color={color} />
            <Text style={[styles.deltaBadgeText, compact && styles.deltaBadgeTextCompact, { color }]}>
                {abs.toFixed(decimals)}{suffix}
            </Text>
        </View>
    );
};

const StatusBanner = ({ status }) => {
    if (!status) return null;
    const palette = {
        good: { bg: colors.faded.successAlt, border: colors.border.successAlt, fg: colors.accent.success },
        warn: { bg: colors.faded.primary, border: colors.border.primaryAlt, fg: colors.accent.warning },
        bad: { bg: colors.faded.errorAlt, border: colors.border.error, fg: colors.accent.errorAlt },
    }[status.type];

    return (
        <View style={[styles.statusBanner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <View style={styles.statusIconCircle}>
                <Ionicons name={status.icon} size={spacing.iconMd} color={palette.fg} />
            </View>
            <View style={styles.statusTextWrap}>
                <Text style={[styles.statusTitle, { color: palette.fg }]}>{status.title}</Text>
                <Text style={styles.statusMessage}>{status.message}</Text>
            </View>
        </View>
    );
};

const WeeklyBarChart = ({ buckets, getValue, formatValue, color, height = 64, showValues = true }) => {
    const values = buckets.map(b => getValue(b)).filter(v => v != null);
    const maxVal = values.length ? Math.max(...values) : 0;

    return (
        <View style={styles.barChartRow}>
            {buckets.map((b) => {
                const val = getValue(b);
                const pct = val != null && maxVal > 0 ? Math.max((val / maxVal) * 100, 6) : 0;
                return (
                    <View key={b.weekKey} style={styles.barCol}>
                        {showValues && (
                            <Text style={[styles.barValueLabel, b.isCurrent && { color }]} numberOfLines={1}>
                                {val != null ? formatValue(val) : ''}
                            </Text>
                        )}
                        <View style={[styles.barTrack, { height }]}>
                            {val != null && (
                                <View
                                    style={[
                                        styles.barFillBar,
                                        {
                                            height: `${pct}%`,
                                            backgroundColor: b.isCurrent ? color : `${color}40`,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                        <Text style={[styles.barBottomLabel, b.isCurrent && { color }]} numberOfLines={1}>
                            {b.isCurrent ? 'Now' : b.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const CardHeader = ({ iconName, iconBg, iconColor, title, value, unit, delta, positiveIsGood, decimals, daysLogged, accentColor, large }) => (
    <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIconBox, large && styles.cardIconBoxLarge, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={large ? spacing.iconMd : spacing.iconSm} color={iconColor} />
            </View>
            <View>
                <Text style={[styles.cardTitle, large && styles.cardTitleLarge]}>{title}</Text>
                {daysLogged != null && (
                    <Text style={styles.cardDaysLogged}>{daysLogged}/7 days logged</Text>
                )}
            </View>
        </View>
        <View style={styles.cardHeaderRight}>
            <Text style={[styles.cardCurrentValue, large && styles.cardCurrentValueLarge, { color: accentColor }]}>
                {value ?? '—'}{value != null && unit ? unit : ''}
            </Text>
            <DeltaBadge value={delta} positiveIsGood={positiveIsGood} suffix={unit ?? ''} decimals={decimals} />
        </View>
    </View>
);

const GoalTrack = ({ start, goal, current }) => {
    if (start == null || goal == null || current == null || start === goal) return null;
    const total = goal - start;
    const rawPct = ((current - start) / total) * 100;
    const pct = Math.min(Math.max(rawPct, 0), 100);

    return (
        <View style={styles.goalTrackWrap}>
            <View style={styles.goalTrackBar}>
                <View style={[styles.goalTrackFill, { width: `${pct}%` }]} />
                <View style={[styles.goalTrackDot, { left: `${pct}%` }]} />
            </View>
            <View style={styles.goalTrackLabels}>
                <Text style={styles.goalTrackLabelText}>{start.toFixed(1)} kg</Text>
                <Text style={[styles.goalTrackLabelText, styles.goalTrackLabelCurrent]}>
                    {current.toFixed(1)} kg now
                </Text>
                <Text style={styles.goalTrackLabelText}>{goal.toFixed(1)} kg</Text>
            </View>
        </View>
    );
};

const WeightHeroCard = ({ buckets, current, prev, userData }) => {
    const delta = deltaOf(current?.avgWeight, prev?.avgWeight);
    const targetRate = userData?.weightChangePlan?.ratePerWeek ?? null;
    const goalWeight = userData?.weightChangePlan?.goalWeight ?? null;
    const startWeight = userData?.weightChangePlan?.startWeight ?? null;

    return (
        <View style={styles.heroCard}>
            <CardHeader
                iconName="scale"
                iconBg={colors.faded.primary}
                iconColor={colors.accent.primary}
                title="Weight"
                value={current?.avgWeight?.toFixed(1)}
                unit=" kg"
                delta={delta}
                positiveIsGood={targetRate != null ? targetRate < 0 : false}
                decimals={2}
                daysLogged={current?.daysLoggedWeight}
                accentColor={colors.accent.primary}
                large
            />
            {startWeight != null && goalWeight != null && current?.avgWeight != null ? (
                <GoalTrack start={startWeight} goal={goalWeight} current={current.avgWeight} />
            ) : goalWeight != null && current?.avgWeight != null ? (
                <View style={styles.goalRow}>
                    <Text style={styles.goalText}>Goal {goalWeight} kg</Text>
                    <Text style={[styles.goalRemaining, {
                        color: Math.abs(current.avgWeight - goalWeight) < 1
                            ? colors.accent.success : colors.text.quaternary,
                    }]}>
                        {Math.abs(current.avgWeight - goalWeight).toFixed(1)} kg to go
                    </Text>
                </View>
            ) : null}
            <WeeklyBarChart
                buckets={buckets}
                getValue={b => b.avgWeight}
                formatValue={v => v.toFixed(1)}
                color={colors.accent.primary}
                height={88}
                showValues
            />
        </View>
    );
};

const QuickStatTile = ({ iconName, iconBg, iconColor, value, label, delta, positiveIsGood, decimals, suffix }) => (
    <View style={styles.quickStatTile}>
        <View style={[styles.quickStatIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={spacing.iconSm} color={iconColor} />
        </View>
        <Text style={styles.quickStatValue}>{value}</Text>
        <Text style={styles.quickStatLabel}>{label}</Text>
        <DeltaBadge value={delta} positiveIsGood={positiveIsGood} decimals={decimals} suffix={suffix} compact />
    </View>
);

const QuickStatsRow = ({ current, prev }) => (
    <View style={styles.quickStatsRow}>
        <QuickStatTile
            iconName="flame"
            iconBg={colors.faded.primary}
            iconColor={colors.accent.primary}
            value={current?.avgCalories != null ? current.avgCalories.toLocaleString() : '—'}
            label="Avg Cal"
            delta={deltaOf(current?.avgCalories, prev?.avgCalories)}
            positiveIsGood
            decimals={0}
        />
        <QuickStatTile
            iconName="footsteps"
            iconBg={colors.faded.stepsRed}
            iconColor={colors.accent.stepsRed}
            value={current?.avgSteps != null ? `${(current.avgSteps / 1000).toFixed(1)}k` : '—'}
            label="Avg Steps"
            delta={current?.avgSteps != null && prev?.avgSteps != null
                ? deltaOf(current.avgSteps / 1000, prev.avgSteps / 1000)
                : null}
            positiveIsGood
            decimals={1}
            suffix="k"
        />
        <QuickStatTile
            iconName="barbell"
            iconBg={colors.faded.cyanDark}
            iconColor={colors.accent.cyan}
            value={current?.workoutCount != null ? `${current.workoutCount}` : '—'}
            label="Workouts"
            delta={deltaOf(current?.workoutCount, prev?.workoutCount)}
            positiveIsGood
            decimals={0}
        />
    </View>
);

const NutritionCard = ({ buckets, current, prev, userData }) => {
    const calDelta = deltaOf(current?.avgCalories, prev?.avgCalories);
    const atTarget = userData?.targetCalories != null && current?.avgCalories != null
        ? Math.abs(current.avgCalories - userData.targetCalories) < userData.targetCalories * 0.05
        : null;

    const macros = [
        {
            label: 'CARBS',
            value: current?.avgCarbs,
            target: userData?.targetCarbs,
            color: colors.macro.carbs,
            bg: colors.faded.carbs,
            border: colors.border.carbs,
        },
        {
            label: 'PROTEIN',
            value: current?.avgProtein,
            target: userData?.targetProtein,
            color: colors.macro.protein,
            bg: colors.faded.protein,
            border: colors.border.protein,
        },
        {
            label: 'FAT',
            value: current?.avgFat,
            target: userData?.targetFats,
            color: colors.macro.fat,
            bg: colors.faded.fat,
            border: colors.border.fat,
        },
    ];

    return (
        <View style={styles.metricCard}>
            <CardHeader
                iconName="flame"
                iconBg={colors.faded.primary}
                iconColor={colors.accent.primary}
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
            <View style={styles.macroTilesRow}>
                {macros.map((m, i) => (
                    <View key={i} style={[styles.macroTile, { backgroundColor: m.bg, borderColor: m.border }]}>
                        <View style={styles.macroTileHeader}>
                            <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                            <Text style={styles.macroTileLabel}>{m.label}</Text>
                        </View>
                        <Text style={styles.macroTileValue}>
                            {m.value != null
                                ? `${m.value}${m.target != null ? `/${Math.round(m.target)}` : ''}g`
                                : '—'}
                        </Text>
                    </View>
                ))}
            </View>
            <View style={styles.chipsDivider} />
            <WeeklyBarChart
                buckets={buckets}
                getValue={b => b.avgCalories}
                formatValue={v => v.toLocaleString()}
                color={colors.accent.success}
                height={56}
                showValues={false}
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
                    <View style={styles.activityHeaderLeft}>
                        <View style={[styles.cardIconBox, { backgroundColor: colors.faded.stepsRed }]}>
                            <Ionicons name="footsteps" size={spacing.iconSm} color={colors.accent.stepsRed} />
                        </View>
                        <Text style={styles.cardTitle}>Steps</Text>
                    </View>
                    <View style={styles.activityValueRow}>
                        <Text style={[styles.cardCurrentValue, { color: colors.accent.stepsRed }]}>
                            {current?.avgSteps != null ? `${(current.avgSteps / 1000).toFixed(1)}k` : '—'}
                        </Text>
                        <DeltaBadge value={stepsDelta} positiveIsGood suffix="k" decimals={1} />
                    </View>
                </View>
                <View style={styles.activityHalf}>
                    <View style={styles.activityHeaderLeft}>
                        <View style={[styles.cardIconBox, { backgroundColor: colors.faded.cyanDark }]}>
                            <Ionicons name="barbell" size={spacing.iconSm} color={colors.accent.cyan} />
                        </View>
                        <Text style={styles.cardTitle}>Workouts</Text>
                    </View>
                    <View style={styles.activityValueRow}>
                        <Text style={[styles.cardCurrentValue, { color: colors.accent.cyan }]}>
                            {current?.workoutCount != null ? `${current.workoutCount}` : '—'}
                        </Text>
                        <DeltaBadge value={workoutDelta} positiveIsGood decimals={0} />
                    </View>
                </View>
            </View>
            <WeeklyBarChart
                buckets={buckets}
                getValue={b => b.avgSteps != null ? parseFloat((b.avgSteps / 1000).toFixed(1)) : null}
                formatValue={v => `${v}k`}
                color={colors.accent.stepsRed}
                height={56}
                showValues={false}
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

    const weightDelta = deltaOf(current?.avgWeight, prev?.avgWeight);
    const targetRate = userData?.weightChangePlan?.ratePerWeek ?? null;
    const weightStatus = useWeightStatus(weightDelta, targetRate);

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

                <StatusBanner status={weightStatus} />
                <WeightHeroCard buckets={buckets} current={current} prev={prev} userData={userData} />
                <QuickStatsRow current={current} prev={prev} />
                <NutritionCard buckets={buckets} current={current} prev={prev} userData={userData} />
                <ActivityCard buckets={buckets} current={current} prev={prev} />
            </ScrollView>
            <BottomNav />
        </ApplicationCustomScreen>
    );
};

export default React.memo(ProgressScreen);
import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../../shared/theme';
import type { FoodContextValue } from '../../../nutrition/context/FoodContext';
import { styles } from './DashboardScreenStyles';
import { getWeeklyCaloriesDays, getWeeklyWeightDelta } from './weeklyOverviewModel';
import { useLocalDayKey } from '../../../../shared/hooks/useLocalDayKey';

type WeeklyOverviewProps = {
    rollingStats: FoodContextValue['rollingWeekStats'];
    weeklyWorkouts: number;
    targetWorkouts: number;
    goalDir: number;
    getCaloriesForDateRange: FoodContextValue['getCaloriesForDateRange'];
    onWeightPress: () => void;
    dataReady: boolean;
};

const WeeklyOverview = ({
    rollingStats,
    weeklyWorkouts,
    targetWorkouts,
    goalDir,
    getCaloriesForDateRange,
    onWeightPress,
    dataReady,
}: WeeklyOverviewProps) => {
    const localDayKey = useLocalDayKey();
    const weekDays = useMemo(
        () => getWeeklyCaloriesDays(new Date(), getCaloriesForDateRange),
        [getCaloriesForDateRange, dataReady, localDayKey],
    );
    const maxCalories = Math.max(...weekDays.filter(day => !day.isFuture).map(day => day.calories || 0), 2500);

    const weightDelta = useMemo(
        () => getWeeklyWeightDelta(rollingStats, goalDir),
        [rollingStats, goalDir],
    );

    return (
        <View style={styles.weeklyCard}>
            <View style={styles.weeklyCardHeader}>
                <View style={styles.cardHeader}>
                    <Ionicons name="trending-up-outline" size={spacing[3]} color={colors.text.secondary} />
                    <Text style={styles.cardLabel}>THIS WEEK</Text>
                </View>
                <Text style={styles.chartTitle}>Daily Calories</Text>
            </View>
            <View style={styles.chartContainer}>
                <View style={styles.chartContent}>
                    <View style={styles.barsRow}>
                        {weekDays.map((point, index) => {
                            const calories = point.calories ?? 0;
                            const showValue = !point.isFuture && calories > 0;
                            const share = Math.max(calories > 0 ? (calories / maxCalories) * 100 : 0, 4);
                            return (
                                <View key={index} style={styles.barContainer}>
                                    <View style={{ flex: point.isFuture ? 1 : 100 - share }} />
                                    <Text style={[
                                        styles.barValueText,
                                        point.isToday && styles.barValueTextToday,
                                        !showValue && styles.barValueHidden,
                                    ]}>
                                        {showValue ? Math.round(calories) : 0}
                                    </Text>
                                    <View style={[
                                        styles.bar,
                                        point.isFuture ? styles.barFuture : { flex: share },
                                        point.isToday && styles.barToday,
                                    ]} />
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.daysRow}>
                        {weekDays.map((point, index) => (
                            <View key={index} style={styles.dayContainer}>
                                <Text style={[styles.dayLabel, point.isToday && styles.dayLabelToday]}>
                                    {point.dayLabel}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.weeklyGrid}>
                {[
                    {
                        icon: <Ionicons name="flame-outline" size={spacing[5]} color={colors.accent.primary} />,
                        bg: colors.faded.primary,
                        value: rollingStats.avgCalories > 0 ? Math.round(rollingStats.avgCalories).toLocaleString() : '--',
                        label: 'Avg Calories',
                    },
                    {
                        icon: <MaterialCommunityIcons name="scale-bathroom" size={spacing[5]} color={colors.accent.purple} />,
                        bg: colors.faded.purple,
                        value: rollingStats.avgWeight ? `${rollingStats.avgWeight.toFixed(1)} kg` : '--',
                        label: 'Avg Weight',
                        delta: weightDelta,
                        onPress: onWeightPress,
                    },
                    {
                        icon: <Ionicons name="walk-outline" size={spacing[5]} color={colors.accent.stepsRed} />,
                        bg: colors.faded.error,
                        value: rollingStats.avgSteps > 0 ? `${(rollingStats.avgSteps / 1000).toFixed(1)}k` : '--',
                        label: 'Avg Steps',
                    },
                    {
                        icon: <Ionicons name="barbell-outline" size={spacing[5]} color={colors.accent.cyan} />,
                        bg: colors.faded.cyan,
                        value: `${weeklyWorkouts}/${targetWorkouts}`,
                        label: 'Workouts',
                    },
                ].map((stat, index) => {
                    const CardComponent = (stat.onPress ? TouchableOpacity : View) as typeof TouchableOpacity;
                    return (
                        <CardComponent
                            key={index}
                            style={styles.weeklyStatItem}
                            onPress={stat.onPress}
                            activeOpacity={stat.onPress ? 0.7 : 1}
                        >
                            <View style={[styles.weeklyIconContainer, { backgroundColor: stat.bg }]}>{stat.icon}</View>
                            <View style={styles.weeklyStatText}>
                                <View style={styles.weeklyStatValueRow}>
                                    <Text style={styles.weeklyStatValue}>{stat.value}</Text>
                                    {stat.delta && (
                                        <View style={[styles.weeklyBadge, { backgroundColor: stat.delta.bg }]}>
                                            <Ionicons name={stat.delta.icon} size={spacing[2] + 2} color={stat.delta.fg} />
                                            <Text style={[styles.weeklyBadgeText, { color: stat.delta.fg }]}>{stat.delta.text}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.weeklyStatLabel}>{stat.label}</Text>
                            </View>
                        </CardComponent>
                    );
                })}
            </View>
        </View>
    );
};

export default WeeklyOverview;

import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { AuthContext } from '../../../auth/context/AuthContext';
import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import HomeNoticeCard from '../../../../shared/components/HomeNoticeCard/HomeNoticeCard';
import { colors, spacing } from '../../../../shared/theme';
import { fetchSplitsFromFirestore, SPLITS_CACHE_KEY } from '../../../workout/handlers/WorkoutHandler';
import { getHomeNotices } from '../../../profile/utils/homeSurfaceEngine';
import { styles } from './DashboardScreenStyles';

const SPLITS_CACHE_TTL = 15 * 60 * 1000;
const BF_RECHECK_SNOOZE_DAYS = 14;

const DAYS_MAP = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday',
};

const toLocalDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const resolveWorkoutFromSplits = (splits) => {
    if (!splits?.length) return null;
    const schedule = splits[0].schedule || splits[0].data?.schedule || {};
    const todayKey = DAYS_MAP[new Date().getDay()];
    const workout = schedule[todayKey];
    const exercises = workout?.exercises || [];
    return exercises.length > 0 ? {
        name: workout.templateName || 'Workout',
        duration: workout.duration || 45,
        exerciseCount: exercises.length,
        exercises,
    } : null;
};

const LiveTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const pad = n => (n < 10 ? '0' + n : n);
    const fmt = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;

    return <Text style={styles.resumeTimer}>{fmt}</Text>;
};

const PulseDot = () => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, [scale]);

    return <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />;
};

const TodayWorkout = ({ workout, activeWorkout, onPress }) => {
    if (activeWorkout) {
        return (
            <TouchableOpacity style={styles.workoutCard} onPress={onPress} activeOpacity={0.85}>
                <View style={styles.workoutContent}>
                    <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>{activeWorkout.templateName || 'Workout'}</Text>
                        <View style={styles.activeRow}>
                            <PulseDot />
                            <Text style={styles.activeText}>In progress</Text>
                            <Text style={styles.activeTimer}>· <LiveTimer startTime={activeWorkout.startTime} /></Text>
                        </View>
                    </View>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={spacing[4]} color={colors.accent.buttonText} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    if (!workout) {
        return (
            <View style={styles.workoutCard}>
                <View style={styles.workoutContent}>
                    <View style={styles.restIconContainer}>
                        <Ionicons name="moon" size={spacing[6]} color={colors.accent.cyan} />
                    </View>
                    <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>Rest Day</Text>
                        <Text style={styles.workoutSubtitle}>Let your muscles recover today.</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.workoutCard} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.workoutContent}>
                <View style={styles.workoutInfo}>
                    <Text style={styles.workoutTitle}>{workout.name}</Text>
                    <View style={styles.workoutMeta}>
                        <Ionicons name="time-outline" size={spacing[3]} color={colors.text.secondary} />
                        <Text style={styles.metaText}>{workout.duration} mins</Text>
                        <Ionicons name="barbell-outline" size={spacing[3]} color={colors.text.secondary} />
                        <Text style={styles.metaText}>{workout.exerciseCount} exercises</Text>
                    </View>
                </View>
                <View style={styles.playButton}>
                    <Ionicons name="play" size={spacing[4]} color={colors.accent.buttonText} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const TodayNutrition = ({ calories, targetCalories, macros, onPress }) => {
    const percentage = targetCalories > 0 ? Math.round((calories / targetCalories) * 100) : 0;
    const remaining = targetCalories - calories;
    const isComplete = calories >= targetCalories;

    return (
        <TouchableOpacity style={styles.nutritionCard} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.nutritionHeader}>
                <View style={styles.caloriesValues}>
                    <Text style={styles.caloriesValue}>{Math.round(calories).toLocaleString()}</Text>
                    <Text style={styles.caloriesTarget}>/ {Math.round(targetCalories).toLocaleString()}</Text>
                </View>
                <View style={styles.percentageBadge}>
                    <Text style={styles.percentageText}>
                        {isComplete ? 'Complete' : `${Math.round(remaining)} left`}
                    </Text>
                </View>
            </View>
            <Text style={styles.remainingText}>
                {isComplete ? '100% of daily goal' : `${percentage}% of daily goal`}
            </Text>
            <View style={styles.nutritionProgress}>
                <View style={[styles.nutritionProgressFill, { width: `${Math.min(percentage, 100)}%` }]} />
            </View>
            <View style={styles.macroRow}>
                {[
                    { label: 'Carbs',   value: macros.carbs,   color: colors.accent.success },
                    { label: 'Protein', value: macros.protein, color: colors.accent.purple },
                    { label: 'Fat',     value: macros.fat,     color: colors.accent.cyan },
                ].map(macro => (
                    <View key={macro.label} style={styles.macroItem}>
                        <View style={styles.macroHeader}>
                            <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
                            <Text style={styles.macroLabel}>{macro.label.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

const WeeklyOverview = ({ rollingStats, weeklyWorkouts, targetWorkouts, getCaloriesForDateRange, onWeightPress, dataReady }) => {
    const weekDays = useMemo(() => {
        const today = new Date();
        const monday = getMonday(today);
        const todayKey = toLocalDateKey(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const calMap = {};
        const range = getCaloriesForDateRange(monday, todayEnd);
        range.forEach(d => { calMap[d.date] = d.calories; });

        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const dateKey = toLocalDateKey(day);
            const isFuture = dateKey > todayKey;
            const isToday = dateKey === todayKey;
            return {
                dateKey,
                dayLabel: day.toLocaleDateString('en-US', { weekday: 'short' }),
                calories: isFuture ? null : (calMap[dateKey] || 0),
                isToday,
                isFuture,
            };
        });
    }, [getCaloriesForDateRange, dataReady]);

    const maxCalories = Math.max(...weekDays.filter(d => !d.isFuture).map(d => d.calories || 0), 2500);

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
                            const heightPercent = point.calories > 0 ? (point.calories / maxCalories) * 100 : 0;
                            return (
                                <View key={index} style={styles.barContainer}>
                                    {!point.isFuture && point.calories > 0 && (
                                        <Text style={[styles.barValueText, point.isToday && styles.barValueTextToday]}>
                                            {Math.round(point.calories)}
                                        </Text>
                                    )}
                                    <View style={[
                                        styles.bar,
                                        { height: point.isFuture ? 4 : `${Math.max(heightPercent, 4)}%` },
                                        point.isToday && styles.barToday,
                                        point.isFuture && { opacity: 0.15 },
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
                        label: rollingStats.daysLoggedNutrition > 0 ? `Avg Cal (${rollingStats.daysLoggedNutrition}d)` : 'Avg Calories',
                    },
                    {
                        icon: <MaterialCommunityIcons name="scale-bathroom" size={spacing[5]} color={colors.accent.purple} />,
                        bg: colors.faded.purple,
                        value: rollingStats.avgWeight ? `${rollingStats.avgWeight.toFixed(1)} kg` : '--',
                        label: rollingStats.daysLoggedWeight > 0 ? `Avg Weight (${rollingStats.daysLoggedWeight}d)` : 'Avg Weight',
                        onPress: onWeightPress,
                    },
                    {
                        icon: <Ionicons name="walk-outline" size={spacing[5]} color={colors.accent.stepsRed} />,
                        bg: colors.faded.error,
                        value: rollingStats.avgSteps > 0 ? `${(rollingStats.avgSteps / 1000).toFixed(1)}k` : '--',
                        label: rollingStats.daysLoggedSteps > 0 ? `Avg Steps (${rollingStats.daysLoggedSteps}d)` : 'Avg Steps',
                    },
                    {
                        icon: <Ionicons name="barbell-outline" size={spacing[5]} color={colors.accent.cyan} />,
                        bg: colors.faded.cyan,
                        value: `${weeklyWorkouts}/${targetWorkouts}`,
                        label: 'Workouts',
                    },
                ].map((stat, i) => {
                    const CardComponent = stat.onPress ? TouchableOpacity : View;
                    return (
                        <CardComponent
                            key={i}
                            style={styles.weeklyStatItem}
                            onPress={stat.onPress}
                            activeOpacity={stat.onPress ? 0.7 : 1}
                        >
                            <View style={[styles.weeklyIconContainer, { backgroundColor: stat.bg }]}>{stat.icon}</View>
                            <View style={styles.weeklyStatText}>
                                <Text style={styles.weeklyStatValue}>{stat.value}</Text>
                                <Text style={styles.weeklyStatLabel}>{stat.label}</Text>
                            </View>
                        </CardComponent>
                    );
                })}
            </View>
        </View>
    );
};

const DashboardScreen = () => {
    const navigation = useNavigation();
    const [todayScheduledWorkout, setTodayScheduledWorkout] = useState(null);
    const [workoutLoading, setWorkoutLoading] = useState(true);

    const [dismissedAdjustments, setDismissedAdjustments] = useState([]);
    const [goalReachedDismissed, setGoalReachedDismissed] = useState(false);
    const [bfRecheckSnoozedUntil, setBfRecheckSnoozedUntil] = useState(null);
    const [stepsPermissionDismissedAt, setStepsPermissionDismissedAt] = useState(null);
    const [noticesLoaded, setNoticesLoaded] = useState(false);

    const { dailyNutrition, userMacros, rollingWeekStats, getCaloriesForDateRange, initialLoadComplete, stepsConnected, stepsLoading, retryStepsConnection } = useFoodContext();
    const { workoutHistory, activeWorkout } = useContext(WorkoutContext);
    const { userData } = useContext(AuthContext);

    const targetWorkouts = userData?.targetWorkoutsPerWeek || 5;
    const uid = getAuth().currentUser?.uid;

    useEffect(() => {
        if (!uid) return;
        const loadDismissalState = async () => {
            try {
                const [adjRaw, goalRaw, bfRaw, stepsRaw] = await Promise.all([
                    AsyncStorage.getItem(`home_dismissed_adjustments_${uid}`),
                    AsyncStorage.getItem(`home_goal_reached_dismissed_${uid}`),
                    AsyncStorage.getItem(`home_bf_recheck_snooze_${uid}`),
                    AsyncStorage.getItem(`home_steps_permission_dismissed_${uid}`),
                ]);
                setDismissedAdjustments(adjRaw ? JSON.parse(adjRaw) : []);
                setGoalReachedDismissed(goalRaw === 'true');
                setBfRecheckSnoozedUntil(bfRaw || null);
                setStepsPermissionDismissedAt(stepsRaw || null);
            } catch (e) {
                console.error('loadDismissalState error:', e);
            } finally {
                setNoticesLoaded(true);
            }
        };
        loadDismissalState();
    }, [uid]);

    const notices = useMemo(() => {
        if (!noticesLoaded || !userData || !initialLoadComplete) return [];
        return getHomeNotices({
            userData,
            stepsConnected,
            stepsLoading,
            dismissedAdjustmentTimestamps: dismissedAdjustments,
            bfRecheckSnoozedUntil,
            stepsPermissionDismissedAt,
            goalReachedDismissed,
        });
    }, [noticesLoaded, userData, initialLoadComplete, stepsConnected, stepsLoading, dismissedAdjustments, bfRecheckSnoozedUntil, stepsPermissionDismissedAt, goalReachedDismissed]);

    const handleDismissNotice = useCallback(async (notice) => {
        try {
            if (notice.type === 'calorie_adjustment') {
                const updated = [...dismissedAdjustments, notice.dismissKey];
                setDismissedAdjustments(updated);
                await AsyncStorage.setItem(`home_dismissed_adjustments_${uid}`, JSON.stringify(updated));
            } else if (notice.type === 'goal_reached') {
                setGoalReachedDismissed(true);
                await AsyncStorage.setItem(`home_goal_reached_dismissed_${uid}`, 'true');
            } else if (notice.type === 'bf_recheck') {
                const snoozeUntil = new Date();
                snoozeUntil.setDate(snoozeUntil.getDate() + BF_RECHECK_SNOOZE_DAYS);
                setBfRecheckSnoozedUntil(snoozeUntil.toISOString());
                await AsyncStorage.setItem(`home_bf_recheck_snooze_${uid}`, snoozeUntil.toISOString());
            } else if (notice.type === 'steps_permission') {
                const now = new Date().toISOString();
                setStepsPermissionDismissedAt(now);
                await AsyncStorage.setItem(`home_steps_permission_dismissed_${uid}`, now);
            }
        } catch (e) {
            console.error('handleDismissNotice error:', e);
        }
    }, [uid, dismissedAdjustments]);

    const handleNoticeAction = useCallback((notice) => {
        if (notice.type === 'goal_reached' || notice.type === 'bf_recheck') {
            navigation.navigate('Settings');
        } else if (notice.type === 'steps_permission') {
            retryStepsConnection();
        }
    }, [navigation, retryStepsConnection]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            setWorkoutLoading(true);

            const loadWorkout = async () => {
                try {
                    const cached = await AsyncStorage.getItem(SPLITS_CACHE_KEY);
                    if (cached) {
                        const { splits, ts } = JSON.parse(cached);
                        if (Date.now() - ts < SPLITS_CACHE_TTL) {
                            if (!cancelled) {
                                setTodayScheduledWorkout(resolveWorkoutFromSplits(splits));
                                setWorkoutLoading(false);
                                return;
                            }
                        }
                    }
                } catch {}

                try {
                    const splits = await fetchSplitsFromFirestore();
                    if (!cancelled) {
                        setTodayScheduledWorkout(resolveWorkoutFromSplits(splits));
                        AsyncStorage.setItem(SPLITS_CACHE_KEY, JSON.stringify({ splits, ts: Date.now() })).catch(() => {});
                    }
                } catch {
                    if (!cancelled) setTodayScheduledWorkout(null);
                } finally {
                    if (!cancelled) setWorkoutLoading(false);
                }
            };

            loadWorkout();
            return () => { cancelled = true; };
        }, [])
    );

    const weeklyWorkoutsCount = useMemo(() => {
        if (!workoutHistory?.length) return 0;
        const weekStart = getMonday(new Date());
        return workoutHistory.filter(w => {
            const d = w.timestamp?.toDate?.();
            return d && d >= weekStart;
        }).length;
    }, [workoutHistory]);

    const handleWorkoutPress = useCallback(() => {
        if (activeWorkout) {
            navigation.navigate('StartWorkout');
            return;
        }
        if (todayScheduledWorkout) {
            navigation.navigate('StartWorkout', {
                selectedWorkout: {
                    note: '',
                    templateName: todayScheduledWorkout.name,
                    exercises: todayScheduledWorkout.exercises,
                },
            });
        } else {
            navigation.navigate('Workout');
        }
    }, [navigation, todayScheduledWorkout, activeWorkout]);

    const dashboardReady = initialLoadComplete && !workoutLoading;

    return (
        <ApplicationCustomScreen>
            <View style={styles.container}>
                <View style={styles.greetingBlock}>
                    <Text style={styles.greetingTitle}>{(() => {
                        const h = new Date().getHours();
                        if (h < 12) return 'Good morning';
                        if (h < 17) return 'Good afternoon';
                        return 'Good evening';
                    })()}</Text>
                    <Text style={styles.greetingDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                </View>
                {dashboardReady ? (
                    <View style={styles.content}>
                        {/* Home notices temporarily disabled
                        {notices.map(notice => (
                            <HomeNoticeCard
                                key={notice.id}
                                notice={notice}
                                onAction={
                                    (notice.type === 'goal_reached' || notice.type === 'bf_recheck' || notice.type === 'steps_permission')
                                        ? () => handleNoticeAction(notice)
                                        : undefined
                                }
                                actionLabel={
                                    notice.type === 'goal_reached' ? 'Update Goal'
                                        : notice.type === 'steps_permission' ? 'Connect'
                                        : 'Update'
                                }
                                onDismiss={() => handleDismissNotice(notice)}
                            />
                        ))}
                        */}
                        <TodayWorkout
                            workout={todayScheduledWorkout}
                            activeWorkout={activeWorkout}
                            onPress={handleWorkoutPress}
                        />
                        <TodayNutrition
                            calories={dailyNutrition?.calories || 0}
                            targetCalories={userMacros?.targetCalories || 2000}
                            macros={{ carbs: dailyNutrition?.carbs || 0, protein: dailyNutrition?.protein || 0, fat: dailyNutrition?.fat || 0 }}
                            onPress={() => navigation.navigate('Nutrition')}
                        />
                        <WeeklyOverview
                            rollingStats={rollingWeekStats}
                            weeklyWorkouts={weeklyWorkoutsCount}
                            targetWorkouts={targetWorkouts}
                            getCaloriesForDateRange={getCaloriesForDateRange}
                            onWeightPress={() => navigation.navigate('WeightTracker')}
                            dataReady={initialLoadComplete}
                        />
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.accent.primary} />
                    </View>
                )}
                <BottomNav />
            </View>
        </ApplicationCustomScreen>
    );
};

export default DashboardScreen;
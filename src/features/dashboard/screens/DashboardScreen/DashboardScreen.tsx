import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { REQUIRED_LEARNING_DAYS, useFoodContext } from '../../../nutrition/context/FoodContext';
import { learningProgressLabel, resolveCalorieTarget } from '../../../nutrition/helpers/calorieTarget';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { AuthContext } from '../../../auth/context/AuthContext';
import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav, { useBottomNavInset } from '../../../../shared/components/BottomNav/BottomNav';
import HomeNoticeCard from '../../../../shared/components/HomeNoticeCard/HomeNoticeCard';
import { colors, spacing } from '../../../../shared/theme';
import { useAppNavigation } from '../../../../shared/navigation';
import type { HomeNotice } from '../../../../shared/types';
import type { PersistedWorkoutState } from '../../../workout/types';
import { getHomeNotices } from '../../../profile/utils/homeSurfaceEngine';
import { dirOf } from '../../../progress/utils/progressEngine';
import { styles } from './DashboardScreenStyles';
import WeeklyOverview from './WeeklyOverview';
import { useDashboardScheduledWorkout } from './useDashboardScheduledWorkout';
import type { ScheduledWorkout } from './useDashboardScheduledWorkout';
import { useHomeNoticeDismissals } from './useHomeNoticeDismissals';
import type { CompletedToday, DashboardWorkoutHistoryEntry } from './dashboardWorkoutSummary';
import { useDashboardWorkoutSummary } from './useDashboardWorkoutSummary';

const LiveTimer = ({ startTime }: { startTime: number }) => {
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
    const pad = (n: number) => (n < 10 ? '0' + n : n);
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

type TodayWorkoutProps = {
    workout: ScheduledWorkout | null;
    activeWorkout: PersistedWorkoutState | null;
    completed: CompletedToday | null;
    loadError: boolean;
    onPress: () => void;
};

const TodayWorkout = ({ workout, activeWorkout, completed, loadError, onPress }: TodayWorkoutProps) => {
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

    if (workout && completed) {
        return (
            <View style={styles.workoutCard}>
                <View style={styles.workoutContent}>
                    <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>{workout.name}</Text>
                        <View style={styles.workoutMeta}>
                            {completed.durationLabel != null && (
                                <>
                                    <Ionicons name="time-outline" size={spacing[3]} color={colors.text.secondary} />
                                    <Text style={styles.metaText}>{completed.durationLabel}</Text>
                                </>
                            )}
                            <Ionicons name="barbell-outline" size={spacing[3]} color={colors.text.secondary} />
                            <Text style={styles.metaText}>{completed.exerciseCount} exercises</Text>
                        </View>
                    </View>
                    <View style={styles.doneButton}>
                        <Ionicons name="checkmark" size={spacing[5]} color={colors.accent.success} />
                    </View>
                </View>
            </View>
        );
    }

    if (loadError) {
        return (
            <TouchableOpacity style={styles.workoutCard} onPress={onPress} activeOpacity={0.85}>
                <View style={styles.workoutContent}>
                    <View style={styles.restIconContainer}>
                        <Ionicons name="alert-circle-outline" size={spacing[6]} color={colors.accent.error} />
                    </View>
                    <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTitle}>Workout unavailable</Text>
                        <Text style={styles.workoutSubtitle}>Couldn't load today's schedule. Tap to open Workouts.</Text>
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

type MacroTotals = { carbs: number; protein: number; fat: number };

type TodayNutritionProps = {
    calories: number;
    targetCalories: number | null;
    learningLabel: string;
    macros: MacroTotals;
    macroTargets: MacroTotals;
    onPress: () => void;
};

const TodayNutrition = ({ calories, targetCalories, learningLabel, macros, macroTargets, onPress }: TodayNutritionProps) => {
    const percentage = targetCalories ? Math.round((calories / targetCalories) * 100) : 0;
    const remaining = targetCalories ? targetCalories - calories : 0;
    const isComplete = targetCalories ? calories >= targetCalories : false;
    const badgeText = targetCalories == null ? learningLabel : isComplete ? 'Complete' : `${Math.round(remaining)} left`;

    return (
        <TouchableOpacity style={styles.nutritionCard} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.nutritionHeader}>
                <View style={styles.caloriesValues}>
                    <Text style={styles.caloriesValue}>{Math.round(calories).toLocaleString()}</Text>
                    <Text style={styles.caloriesTarget}>
                        {targetCalories == null ? 'kcal' : `/ ${targetCalories.toLocaleString()}`}
                    </Text>
                </View>
                <View style={styles.percentageBadge}>
                    <Text style={styles.percentageText}>{badgeText}</Text>
                </View>
            </View>
            {targetCalories != null && (
                <View style={styles.nutritionProgress}>
                    <View style={[styles.nutritionProgressFill, { width: `${Math.min(percentage, 100)}%` }]} />
                </View>
            )}
            <View style={styles.macroRow}>
                {[
                    { label: 'Carbs',   value: macros.carbs,   target: macroTargets.carbs,   color: colors.accent.success },
                    { label: 'Protein', value: macros.protein, target: macroTargets.protein, color: colors.accent.purple },
                    { label: 'Fat',     value: macros.fat,     target: macroTargets.fat,     color: colors.accent.cyan },
                ].map(macro => (
                    <View key={macro.label} style={styles.macroItem}>
                        <View style={styles.macroHeader}>
                            <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
                            <Text style={styles.macroLabel}>{macro.label.toUpperCase()}</Text>
                        </View>
                        <View style={styles.macroValueRow}>
                            <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
                            {macro.target > 0 && (
                                <Text style={styles.macroTarget}>/ {Math.round(macro.target)}g</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

const DashboardScreen = () => {
    const navigation = useAppNavigation();
    const navInset = useBottomNavInset();

    const { todayNutrition, userMacros, hasTargets, learningData, rollingWeekStats, getCaloriesForDateRange, initialLoadComplete, stepsConnected, stepsLoading, retryStepsConnection } = useFoodContext();
    const { workoutHistory, activeWorkout } = useContext(WorkoutContext)!;
    const { userData } = useContext(AuthContext)!;

    const targetWorkouts = userData?.targetWorkoutsPerWeek || 5;
    const targetCalories = resolveCalorieTarget(hasTargets, userMacros?.targetCalories);
    const learningLabel = learningProgressLabel(learningData?.daysLogged ?? 0, REQUIRED_LEARNING_DAYS);
    const goalDir = dirOf(userData?.weightChangePlan?.type);
    const uid = getAuth().currentUser?.uid;
    const { workout: todayScheduledWorkout, loading: workoutLoading, loadError: workoutLoadError } =
        useDashboardScheduledWorkout(userData?.activeSplitId, userData?.rotationStartDate);
    const {
        dismissedAdjustments,
        goalReachedDismissed,
        stepsPermissionDismissedAt,
        noticesLoaded,
        dismissNotice,
    } = useHomeNoticeDismissals(uid);

    const notices = useMemo(() => {
        if (!noticesLoaded || !userData || !initialLoadComplete) return [];
        return getHomeNotices({
            userData,
            stepsConnected: stepsConnected ?? false,
            stepsLoading,
            dismissedAdjustmentTimestamps: dismissedAdjustments,
            stepsPermissionDismissedAt,
            goalReachedDismissed,
        });
    }, [noticesLoaded, userData, initialLoadComplete, stepsConnected, stepsLoading, dismissedAdjustments, stepsPermissionDismissedAt, goalReachedDismissed]);

    const handleNoticeAction = useCallback((notice: HomeNotice) => {
        if (notice.type === 'goal_reached') {
            navigation.navigate('Profile');
        } else if (notice.type === 'steps_permission') {
            retryStepsConnection();
        }
    }, [navigation, retryStepsConnection]);

    const { weeklyWorkoutsCount, completedToday } = useDashboardWorkoutSummary(
        workoutHistory as DashboardWorkoutHistoryEntry[],
    );

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
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: navInset + spacing[6] }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.greetingRow}>
                        <View style={styles.greetingBlock}>
                            <Text style={styles.greetingTitle}>{(() => {
                                const h = new Date().getHours();
                                if (h < 12) return 'Good morning';
                                if (h < 17) return 'Good afternoon';
                                return 'Good evening';
                            })()}</Text>
                            <Text style={styles.greetingDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            {userData?.profilePicture ? (
                                <Image source={{ uri: userData.profilePicture }} style={styles.avatar} contentFit="cover" />
                            ) : (
                                <Ionicons name="person-circle-outline" size={36} color={colors.text.secondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                    {dashboardReady ? (
                        <View>
                            {notices.map(notice => (
                                <HomeNoticeCard
                                    key={notice.id}
                                    notice={notice}
                                    onAction={
                                        (notice.type === 'goal_reached' || notice.type === 'steps_permission')
                                            ? () => handleNoticeAction(notice)
                                            : undefined
                                    }
                                    actionLabel={
                                        notice.type === 'goal_reached' ? 'Update Goal' : 'Connect'
                                    }
                                    onDismiss={() => dismissNotice(notice)}
                                />
                            ))}
                            <TodayWorkout
                                workout={todayScheduledWorkout}
                                activeWorkout={activeWorkout}
                                completed={completedToday}
                                loadError={workoutLoadError}
                                onPress={handleWorkoutPress}
                            />
                            <TodayNutrition
                                calories={todayNutrition.calories}
                                targetCalories={targetCalories}
                                learningLabel={learningLabel}
                                macros={{ carbs: todayNutrition.carbs, protein: todayNutrition.protein, fat: todayNutrition.fat }}
                                macroTargets={{ carbs: userMacros?.targetCarbs || 0, protein: userMacros?.targetProtein || 0, fat: userMacros?.targetFats || 0 }}
                                onPress={() => navigation.navigate('Nutrition')}
                            />
                            <WeeklyOverview
                                rollingStats={rollingWeekStats}
                                weeklyWorkouts={weeklyWorkoutsCount}
                                targetWorkouts={targetWorkouts}
                                goalDir={goalDir}
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
                </ScrollView>
                <BottomNav />
            </View>
        </ApplicationCustomScreen>
    );
};

export default DashboardScreen;
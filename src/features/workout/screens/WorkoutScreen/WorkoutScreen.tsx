import React, { useCallback, useMemo, useState, useContext, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Modal, Pressable,
    ScrollView, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav, { useBottomNavInset } from '../../../../shared/components/BottomNav/BottomNav';
import { fetchSplitsFromFirestore } from '../../services/workoutSplitService';
import { WorkoutContext } from '../../context/WorkoutContext';
import { getScheduledDay, getWeekSchedule, getCycleLength } from '../../utils/splitSchedule';
import type { SplitLike } from '../../utils/splitSchedule';
import { AuthContext } from '../../../auth/context/AuthContext';
import { colors, spacing } from '../../../../shared/theme';
import { ExercisePreviewList } from '../../components/WorkoutExercisePreview/WorkoutExercisePreview';
import type { AuthenticatedStackParamList } from '../../../../shared/navigation';
import type { PersistedWorkoutState, TemplateExercise } from '../../types';
import styles from './WorkoutScreenStyles';
import { getWorkoutHistorySummary } from './workoutHistorySummary';
import type { WorkoutSummary } from './workoutHistorySummary';
import ComingUpCard from './ComingUpCard';
import type { UpcomingWorkout, WorkoutPreview } from './ComingUpCard';
import ThisWeekCard from './ThisWeekCard';
import type { ThisWeekScheduleDay, WorkoutWeekSchedule } from './thisWeekSchedule';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type AppNavigation = NativeStackNavigationProp<AuthenticatedStackParamList>;
type WorkoutDisplayData = {
    name: string;
    duration: string;
    exercises: TemplateExercise[];
    day?: string | undefined;
};
type ExerciseRowProps = {
    sets?: string | number | null | undefined;
    name?: string | null | undefined;
    reps?: string | number | null | undefined;
    isLast: boolean;
};
type WorkoutStatsMetaProps = {
    duration?: string | number;
    exerciseCount?: number;
    totalSets?: number;
};
type MainWorkoutCardProps = {
    workoutData: WorkoutDisplayData | null;
    onStart: () => void;
    onStartAgain: () => void;
    onResume: () => void;
    onPreview: (workout: WorkoutPreview) => void;
    allExercises: string[];
    isRestDay: boolean;
    activeWorkout: PersistedWorkoutState | null;
    isToday: boolean;
    lastWorkoutStats: WorkoutSummary | null;
    todayCompletedStats: WorkoutSummary | null;
};
const LiveTimer = ({ startTime }: { startTime: number }) => {
    const [elapsed, setElapsed] = useState(0);

    React.useEffect(() => {
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
    const scale = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, [scale]);

    return <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />;
};

const ExerciseRow = ({ sets, name, reps, isLast }: ExerciseRowProps) => (
    <View style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}>
        <Text style={styles.exerciseSetsInline}>{sets}x</Text>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.exerciseReps}>{reps}</Text>
    </View>
);

const WorkoutStatsMeta = ({ duration, exerciseCount, totalSets }: WorkoutStatsMetaProps) => (
    <View style={styles.workoutStatsMeta}>
        {!!duration && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="time-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{duration}</Text>
            </View>
        )}
        {!!exerciseCount && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="barbell-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{exerciseCount} exercises</Text>
            </View>
        )}
        {!!totalSets && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{totalSets} sets</Text>
            </View>
        )}
    </View>
);

const MainWorkoutCard = React.memo(({
    workoutData, onStart, onStartAgain, onResume, onPreview,
    allExercises, isRestDay, activeWorkout, isToday, lastWorkoutStats, todayCompletedStats,
}: MainWorkoutCardProps) => {
    if (activeWorkout) {
        return (
            <View style={styles.workoutCard}>
                <Text style={styles.workoutCardTitle}>{activeWorkout.templateName || 'Workout'}</Text>
                <TouchableOpacity style={styles.resumeButton} onPress={onResume} activeOpacity={0.8}>
                    <PulseDot />
                    <Text style={styles.resumeButtonText}>Resume Workout</Text>
                    <Text style={styles.resumeTimer}>· <LiveTimer startTime={activeWorkout.startTime} /></Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isToday && todayCompletedStats) {
        const stats = todayCompletedStats;
        const extraCount = (stats.exercises?.length ?? 0) - 3;

        return (
            <View style={styles.workoutCard}>
                <View style={styles.workoutTitleRow}>
                    <Text style={styles.workoutCardTitle}>{stats.name ?? 'Workout'}</Text>
                    <View style={styles.doneBadge}>
                        <Ionicons name="checkmark" size={11} color={colors.accent.success} />
                        <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                </View>
                <View style={styles.workoutMeta}>
                    <Text style={styles.metaText}>{stats.duration}</Text>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.metaText}>{stats.exerciseCount} exercises</Text>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.metaText}>{stats.totalSets} sets</Text>
                </View>
                <View style={styles.exerciseList}>
                    {stats.exercises.slice(0, 3).map((ex, i) => (
                        <ExerciseRow
                            key={i}
                            sets={ex.sets}
                            name={ex.name}
                            reps={ex.bestSet}
                            isLast={i === Math.min(2, stats.exercises.length - 1)}
                        />
                    ))}
                </View>
                {extraCount > 0 && (
                    <TouchableOpacity
                        onPress={() => onPreview({
                            name: stats.name ?? 'Workout',
                            duration: stats.duration,
                            exercises: stats.exercises.map(ex => ({
                                exerciseName: ex.name,
                                numSets: ex.sets,
                                repRange: ex.bestSet ?? '',
                            })),
                        })}
                        activeOpacity={0.7}
                        style={styles.exerciseMoreRow}
                    >
                        <View style={styles.exerciseMoreLine} />
                        <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                        <View style={styles.exerciseMoreLine} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.startAgainButton} onPress={onStartAgain} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={14} color={colors.text.secondary} />
                    <Text style={styles.startAgainButtonText}>Do It Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isRestDay) {
        const stats = lastWorkoutStats;
        const extraCount = (stats?.exercises?.length ?? 0) - 3;

        return (
            <View style={styles.workoutCard}>
                <Text style={styles.workoutCardTitle}>{stats ? (stats.name ?? 'Last Workout') : 'Rest Day'}</Text>
                {stats ? (
                    <>
                        <View style={styles.workoutMeta}>
                            <Text style={styles.metaText}>{stats.duration}</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.exerciseCount} exercises</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.totalSets} sets</Text>
                        </View>
                        <View style={styles.exerciseList}>
                            {stats.exercises.slice(0, 3).map((ex, i) => (
                                <ExerciseRow
                                    key={i}
                                    sets={ex.sets}
                                    name={ex.name}
                                    reps={ex.bestSet}
                                    isLast={i === Math.min(2, stats.exercises.length - 1)}
                                />
                            ))}
                        </View>
                        {extraCount > 0 && (
                            <TouchableOpacity
                                onPress={() => onPreview({
                                    name: stats.name ?? 'Last Workout',
                                    duration: stats.duration,
                                    exercises: stats.exercises.map(ex => ({
                                        exerciseName: ex.name,
                                        numSets: ex.sets,
                                        repRange: ex.bestSet ?? '',
                                    })),
                                })}
                                activeOpacity={0.7}
                                style={styles.exerciseMoreRow}
                            >
                                <View style={styles.exerciseMoreLine} />
                                <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                                <View style={styles.exerciseMoreLine} />
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <Text style={styles.metaText}>Let your muscles recover today.</Text>
                )}
            </View>
        );
    }

    if (!workoutData) return null;

    const totalSets = workoutData.exercises?.reduce((acc, ex) => acc + (parseInt(String(ex.numSets ?? 0), 10) || 0), 0) ?? 0;
    const visibleExercises = allExercises.slice(0, 3);
    const extraCount = allExercises.length - 3;

    return (
        <View style={styles.workoutCard}>
            <View style={styles.workoutTitleRow}>
                <Text style={styles.workoutCardTitle}>{workoutData.name}</Text>
                {!isToday && workoutData.day && (
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>{workoutData.day}</Text>
                    </View>
                )}
            </View>

            <WorkoutStatsMeta
                duration={workoutData.duration}
                exerciseCount={allExercises.length}
                totalSets={totalSets}
            />

            <View style={styles.exerciseList}>
                {visibleExercises.map((name, i) => (
                    <ExerciseRow
                        key={i}
                        sets={workoutData.exercises?.[i]?.numSets}
                        name={name}
                        reps={workoutData.exercises?.[i]?.repRange}
                        isLast={i === visibleExercises.length - 1}
                    />
                ))}
            </View>

            {extraCount > 0 && (
                <TouchableOpacity
                    onPress={() => onPreview({
                        name: workoutData.name,
                        duration: workoutData.duration,
                        exercises: workoutData.exercises,
                    })}
                    activeOpacity={0.7}
                    style={styles.exerciseMoreRow}
                >
                    <View style={styles.exerciseMoreLine} />
                    <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                    <View style={styles.exerciseMoreLine} />
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.8}>
                <Ionicons name="play" size={14} color={colors.accent.buttonText} />
                <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
        </View>
    );
});

const WorkoutScreen = () => {
    const navigation = useNavigation<AppNavigation>();
    const insets = useSafeAreaInsets();
    const navInset = useBottomNavInset();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewWorkout, setPreviewWorkout] = useState<WorkoutPreview | null>(null);
    const [activeSplit, setActiveSplit] = useState<SplitLike>(null);
    const [todayWorkout, setTodayWorkout] = useState<WorkoutDisplayData | null>(null);
    const [upcomingWorkouts, setUpcomingWorkouts] = useState<UpcomingWorkout[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnceRef = useRef(false);

    const { activeWorkout, workoutHistory } = useContext(WorkoutContext)!;
    const { userData } = useContext(AuthContext)!;

    const userStats = useMemo(
        () => getWorkoutHistorySummary(workoutHistory),
        [workoutHistory],
    );
    const todayCompletedStats = userStats.todayCompletedStats;

    const loadActiveSplit = useCallback(async () => {
        try {
            if (!hasLoadedOnceRef.current) {
                setLoading(true);
            }
            const splits = await fetchSplitsFromFirestore();
            if (!splits.length) {
                setActiveSplit(null);
                setTodayWorkout(null);
                setUpcomingWorkouts([]);
                return;
            }

            const raw = splits.find(s => s.id === userData?.activeSplitId) ?? splits[0];
            if (!raw) return;
            const splitData = typeof raw.data === 'object' && raw.data !== null
                ? raw.data as Record<string, unknown>
                : undefined;
            const splitType = raw.type ?? (typeof splitData?.['type'] === 'string' ? splitData['type'] : undefined);
            const active: NonNullable<SplitLike> = {
                ...(splitType ? { type: splitType } : {}),
                schedule: (raw.schedule ?? splitData?.['schedule'] ?? {}) as Exclude<
                    NonNullable<SplitLike>['schedule'],
                    null | undefined
                >,
            };
            setActiveSplit(active);

            const now = new Date();
            const startDate = userData?.rotationStartDate;
            const todayData = getScheduledDay(active, now, startDate) as ThisWeekScheduleDay | null;

            const todayExercises = todayData?.exercises ?? [];
            setTodayWorkout(todayData && todayExercises.length > 0 ? {
                name: todayData.templateName ?? 'Workout',
                duration: todayData.duration ? `${todayData.duration} min` : '45 min',
                exercises: todayExercises,
            } : null);

            const upcoming: UpcomingWorkout[] = [];
            const horizon = Math.max(13, getCycleLength(active));
            for (let i = 1; i <= horizon && upcoming.length < 4; i++) {
                const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
                const w = getScheduledDay(active, futureDate, startDate) as ThisWeekScheduleDay | null;
                if (!w) continue;
                const exercises = w.exercises ?? [];

                if (exercises.length > 0) {
                    upcoming.push({
                        name: w.templateName ?? 'Workout',
                        day: DAY_LABELS[futureDate.getDay()],
                        exercises,
                        duration: w.duration ? `${w.duration} min` : '45 min',
                        isRest: false,
                    });
                }
            }

            setUpcomingWorkouts(upcoming);
        } catch (e) {
            console.error('Error loading split:', e);
        } finally {
            hasLoadedOnceRef.current = true;
            setLoading(false);
        }
    }, [userData?.activeSplitId, userData?.rotationStartDate]);

    useFocusEffect(useCallback(() => { loadActiveSplit(); }, [loadActiveSplit]));

    const weekSchedule = useMemo(
        () => (activeSplit
            ? getWeekSchedule(activeSplit, new Date(), userData?.rotationStartDate) as WorkoutWeekSchedule
            : null),
        [activeSplit, userData?.rotationStartDate],
    );

    const isRestDay = useMemo(() => !todayWorkout?.exercises?.length, [todayWorkout]);

    const primaryWorkout = useMemo(() => {
        if (!isRestDay && todayWorkout) {
            return { workout: todayWorkout, isRestDay: false, isToday: true };
        }
        const next = upcomingWorkouts.find(w => !w.isRest);
        if (next) {
            return {
                workout: { name: next.name, duration: next.duration, exercises: next.exercises, day: next.day },
                isRestDay: false,
                isToday: false,
            };
        }
        return { workout: null, isRestDay: true, isToday: false };
    }, [isRestDay, todayWorkout, upcomingWorkouts]);

    const allExercises = useMemo(
        () => primaryWorkout?.workout?.exercises?.map(e => e.exerciseName ?? e.name ?? 'Exercise') ?? [],
        [primaryWorkout]
    );

    const comingUpWorkouts = useMemo(
        () => (primaryWorkout?.isToday ? upcomingWorkouts.slice(0, 3) : upcomingWorkouts.slice(1, 4)),
        [primaryWorkout, upcomingWorkouts]
    );

    const handleStartWorkout = useCallback(() => {
        navigation.navigate('StartWorkout', primaryWorkout?.workout?.exercises?.length && !primaryWorkout.isRestDay ? {
            selectedWorkout: {
                note: '',
                templateName: primaryWorkout.workout.name,
                exercises: primaryWorkout.workout.exercises,
            },
        } : undefined);
    }, [navigation, primaryWorkout]);

    const handleResumeWorkout = useCallback(() => navigation.navigate('StartWorkout'), [navigation]);

    const handleStartAgain = useCallback(() => {
        Alert.alert(
            'Log Another Session?',
            `You already logged "${todayCompletedStats?.name ?? 'a workout'}" today. Starting again will add a second entry for today.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start Again', onPress: handleStartWorkout },
            ]
        );
    }, [todayCompletedStats, handleStartWorkout]);

    const handlePreviewWorkout = useCallback((workout: WorkoutPreview) => {
        setPreviewWorkout(workout);
        setIsModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setPreviewWorkout(null);
    }, []);

    const handleLibraryPress = useCallback(() => navigation.navigate('WorkoutLibrary'), [navigation]);
    const handleHistoryPress = useCallback(() => navigation.navigate('WorkoutHistory'), [navigation]);

    if (loading || !primaryWorkout) {
        return (
            <ApplicationCustomScreen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
                <BottomNav />
            </ApplicationCustomScreen>
        );
    }

    return (
        <ApplicationCustomScreen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    paddingBottom: navInset,
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                }}
                showsVerticalScrollIndicator={false}
            >
                <MainWorkoutCard
                    workoutData={primaryWorkout.workout}
                    onStart={handleStartWorkout}
                    onStartAgain={handleStartAgain}
                    onResume={handleResumeWorkout}
                    onPreview={handlePreviewWorkout}
                    allExercises={allExercises}
                    isRestDay={primaryWorkout.isRestDay}
                    activeWorkout={activeWorkout}
                    isToday={primaryWorkout.isToday}
                    lastWorkoutStats={userStats.lastWorkoutStats}
                    todayCompletedStats={todayCompletedStats}
                />

                <ThisWeekCard
                    completedDays={userStats.completedDaysThisWeek}
                    schedule={weekSchedule}
                    onDayPress={handlePreviewWorkout}
                />

                <ComingUpCard
                    upcomingWorkouts={comingUpWorkouts}
                    onPreview={handlePreviewWorkout}
                    onViewAll={handleLibraryPress}
                />

                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleLibraryPress} activeOpacity={0.7}>
                        <Ionicons name="albums-outline" size={spacing.icon} color={colors.accent.primary} />
                        <Text style={styles.quickActionText}>Library</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleHistoryPress} activeOpacity={0.7}>
                        <Ionicons name="stats-chart-outline" size={spacing.icon} color={colors.accent.primary} />
                        <Text style={styles.quickActionText}>History</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <BottomNav />

            <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={handleCloseModal}>
                <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                {previewWorkout?.day && (
                                    <Text style={styles.modalDayLabel}>{previewWorkout.day}</Text>
                                )}
                                <Text style={styles.modalTitle}>{previewWorkout?.name ?? 'Workout'}</Text>
                            </View>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalStatsRow}>
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>
                                    {previewWorkout?.duration.replace(' min', 'm') ?? '0m'}
                                </Text>
                                <Text style={styles.modalStatLabel}>Time</Text>
                            </View>
                            <View style={styles.modalStatDivider} />
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>
                                    {previewWorkout?.exercises?.reduce((a, e) => a + (parseInt(String(e.numSets ?? 0), 10) || 0), 0) ?? 0}
                                </Text>
                                <Text style={styles.modalStatLabel}>Sets</Text>
                            </View>
                            <View style={styles.modalStatDivider} />
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>{previewWorkout?.exercises?.length ?? 0}</Text>
                                <Text style={styles.modalStatLabel}>Exercises</Text>
                            </View>
                        </View>

                        <ScrollView style={styles.modalExList} showsVerticalScrollIndicator={false}>
                            <ExercisePreviewList exercises={previewWorkout?.exercises} />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.startButton, activeWorkout && styles.startButtonDisabled]}
                            onPress={() => {
                                if (activeWorkout) return;
                                setIsModalVisible(false);
                                navigation.navigate('StartWorkout', {
                                    selectedWorkout: {
                                        note: '',
                                        templateName: previewWorkout?.name,
                                        exercises: previewWorkout?.exercises ?? [],
                                    },
                                });
                            }}
                            disabled={!!activeWorkout}
                        >
                            {!activeWorkout && <Ionicons name="play" size={14} color={colors.accent.buttonText} />}
                            <Text style={[styles.startButtonText, activeWorkout && styles.startButtonTextDisabled]}>
                                {activeWorkout ? 'Workout in Progress' : 'Start Workout'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </ApplicationCustomScreen>
    );
};

export default React.memo(WorkoutScreen);
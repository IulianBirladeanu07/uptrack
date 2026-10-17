import React, { useCallback, useMemo, useState, useContext, useRef } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
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
import type { AuthenticatedStackParamList } from '../../../../shared/navigation';
import styles from './WorkoutScreenStyles';
import { getWorkoutHistorySummary } from './workoutHistorySummary';
import ComingUpCard from './ComingUpCard';
import type { UpcomingWorkout, WorkoutPreview } from './ComingUpCard';
import ThisWeekCard from './ThisWeekCard';
import type { ThisWeekScheduleDay, WorkoutWeekSchedule } from './thisWeekSchedule';
import MainWorkoutCard from './MainWorkoutCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';
import WorkoutPreviewModal from './WorkoutPreviewModal';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type AppNavigation = NativeStackNavigationProp<AuthenticatedStackParamList>;
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

    const handleStartPreviewWorkout = useCallback(() => {
        if (activeWorkout) return;
        setIsModalVisible(false);
        navigation.navigate('StartWorkout', {
            selectedWorkout: {
                note: '',
                templateName: previewWorkout?.name,
                exercises: previewWorkout?.exercises ?? [],
            },
        });
    }, [activeWorkout, navigation, previewWorkout]);

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

            <WorkoutPreviewModal
                visible={isModalVisible}
                workout={previewWorkout}
                bottomPadding={insets.bottom + spacing[4]}
                isWorkoutActive={!!activeWorkout}
                onClose={handleCloseModal}
                onStart={handleStartPreviewWorkout}
            />
        </ApplicationCustomScreen>
    );
};

export default React.memo(WorkoutScreen);
import React, { useCallback, useMemo, useState, useContext } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav, { useBottomNavInset } from '../../../../shared/components/BottomNav/BottomNav';
import { WorkoutContext } from '../../context/WorkoutContext';
import { getWeekSchedule } from '../../utils/splitSchedule';
import { AuthContext } from '../../../auth/context/AuthContext';
import { colors, spacing } from '../../../../shared/theme';
import type { AuthenticatedStackParamList } from '../../../../shared/navigation';
import styles from './WorkoutScreenStyles';
import { getWorkoutHistorySummary } from './workoutHistorySummary';
import ComingUpCard from './ComingUpCard';
import type { WorkoutPreview } from './ComingUpCard';
import ThisWeekCard from './ThisWeekCard';
import type { WorkoutWeekSchedule } from './thisWeekSchedule';
import MainWorkoutCard from './MainWorkoutCard';
import WorkoutPreviewModal from './WorkoutPreviewModal';
import { buildWorkoutHomeViewModel } from './workoutHomeViewModel';
import { useWorkoutScreenSchedule } from './useWorkoutScreenSchedule';

type AppNavigation = NativeStackNavigationProp<AuthenticatedStackParamList>;
const WorkoutScreen = () => {
    const navigation = useNavigation<AppNavigation>();
    const insets = useSafeAreaInsets();
    const navInset = useBottomNavInset();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewWorkout, setPreviewWorkout] = useState<WorkoutPreview | null>(null);
    const { activeWorkout, workoutHistory } = useContext(WorkoutContext)!;
    const { userData } = useContext(AuthContext)!;
    const {
        activeSplit,
        todayWorkout,
        upcomingWorkouts,
        loading,
        loadError,
        loadActiveSplit,
    } = useWorkoutScreenSchedule(userData?.activeSplitId, userData?.rotationStartDate, userData?.uid);

    const userStats = useMemo(
        () => getWorkoutHistorySummary(workoutHistory),
        [workoutHistory],
    );
    const todayCompletedStats = userStats.todayCompletedStats;

    const weekSchedule = useMemo(
        () => (activeSplit
            ? getWeekSchedule(activeSplit, new Date(), userData?.rotationStartDate) as WorkoutWeekSchedule
            : null),
        [activeSplit, userData?.rotationStartDate],
    );

    const { primaryWorkout, allExercises, comingUpWorkouts } = useMemo(
        () => buildWorkoutHomeViewModel(todayWorkout, upcomingWorkouts),
        [todayWorkout, upcomingWorkouts],
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

    if (loading) {
        return (
            <ApplicationCustomScreen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
                <BottomNav />
            </ApplicationCustomScreen>
        );
    }

    if (loadError) {
        return (
            <ApplicationCustomScreen>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: colors.text.primary, marginBottom: spacing[2] }}>
                        Couldn’t load your workout schedule.
                    </Text>
                    <TouchableOpacity onPress={() => void loadActiveSplit()}>
                        <Text style={{ color: colors.accent.primary }}>Tap to retry</Text>
                    </TouchableOpacity>
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

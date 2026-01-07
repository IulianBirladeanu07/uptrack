import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { normalize } from '../../../../shared/hooks/useResponsive';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import { fetchSplitsFromFirestore } from '../../handlers/WorkoutHandler';
import styles from './WorkoutScreenStyles';

const DAYS_MAP = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};

const HeaderSection = React.memo(({ stats }) => (
    <View style={styles.headerStatsRow}>
        <View style={styles.headerStatItem}>
            <Ionicons name="flame-outline" size={normalize(14)} color="#ff8535" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.streak}</Text>
            <Text style={styles.headerStatLabel}>Day Streak</Text>
        </View>
        <View style={styles.headerStatItem}>
            <Ionicons name="time-outline" size={normalize(14)} color="#00d4ff" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.weeklyTime}</Text>
            <Text style={styles.headerStatLabel}>This Week</Text>
        </View>
        <View style={styles.headerStatItem}>
            <Ionicons name="barbell-outline" size={normalize(14)} color="#a855f7" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.workoutCount}</Text>
            <Text style={styles.headerStatLabel}>Workouts</Text>
        </View>
    </View>
));

const MainWorkoutCard = React.memo(({ workoutData, onPreview, onStart, allExercises, isRestDay }) => {
    const visibleExercises = allExercises.slice(0, 3);
    const hasMoreExercises = allExercises.length > 3;

    if (isRestDay) {
        return (
            <View style={styles.restDayCard}>
                <View style={styles.restDayContent}>
                    <View style={styles.restDayIconContainer}>
                        <Ionicons name="moon" size={normalize(28)} color="#06B6D4" />
                    </View>
                    <View style={styles.restDayText}>
                        <Text style={styles.restDayTitle}>Rest Day</Text>
                        <Text style={styles.restDaySubtitle}>Recovery & regeneration</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.workoutCard}>
            <View style={styles.workoutCardHeader}>
                <View style={styles.workoutInfo}>
                    <View style={styles.workoutTitleRow}>
                        <Text style={styles.workoutCardTitle}>{workoutData.name}</Text>
                    </View>
                    <View style={styles.workoutMetrics}>
                        <View style={styles.metricItem}>
                            <Ionicons name="time-outline" size={normalize(14)} color="#d1d5db" />
                            <Text style={styles.metricText}>{workoutData.duration}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="barbell-outline" size={normalize(14)} color="#d1d5db" />
                            <Text style={styles.metricText}>{allExercises.length} exercises</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.previewButton} onPress={onPreview}>
                    <Ionicons name="eye-outline" size={normalize(18)} color="#00d4ff" />
                </TouchableOpacity>
            </View>
            <View style={styles.exerciseGrid}>
                {visibleExercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseGridItem}>
                        <Text style={styles.exerciseGridText}>{exercise}</Text>
                    </View>
                ))}
                {hasMoreExercises && (
                    <View style={styles.exerciseGridItem}>
                        <Text style={styles.exerciseGridMore}>+{allExercises.length - 3} more</Text>
                    </View>
                )}
            </View>
            <View style={styles.startButtonContainer}>
                <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.8}>
                    <Ionicons name="play" size={normalize(14)} style={styles.playIcon} />
                    <Text style={styles.startButtonText}>START</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const WeeklyProgressSection = React.memo(({ completedDays, totalDays }) => {
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
                <Text style={styles.sectionTitle}>Weekly Progress</Text>
                <Text style={styles.progressSubtitle}>{completedDays}/{totalDays} Days</Text>
            </View>
            <View style={styles.daysContainer}>
                {daysOfWeek.map((day, index) => (
                    <View
                        key={index}
                        style={[styles.dayCircle, index < completedDays ? styles.activeDayCircle : styles.inactiveDayCircle]}
                    >
                        <Text style={[styles.dayText, index >= completedDays && styles.inactiveDayText]}>
                            {day}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
});

const WorkoutActionsSection = React.memo(({ upcomingWorkouts, onPreview }) => {
    return (
        <View style={styles.mergedCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Coming Up</Text>
            </View>
            <View style={styles.upcomingGrid}>
                {upcomingWorkouts.map((workout, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.upcomingGridItem, workout.isRest && styles.upcomingGridItemRest]}
                        onPress={() => !workout.isRest && onPreview(workout)}
                        disabled={workout.isRest}
                        activeOpacity={workout.isRest ? 1 : 0.7}
                    >
                        <View style={styles.upcomingGridHeader}>
                            <Text style={styles.upcomingGridDay}>{workout.day}</Text>
                            {!workout.isRest && (
                                <Ionicons name="arrow-forward" size={normalize(12)} color="#00d4ff" />
                            )}
                        </View>
                        <Text style={[styles.upcomingGridName, workout.isRest && styles.upcomingGridNameRest]}>
                            {workout.name}
                        </Text>
                        <Text style={styles.upcomingGridInfo}>{workout.details}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
});

const WorkoutScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [previewWorkout, setPreviewWorkout] = useState(null);
    const [activeSplit, setActiveSplit] = useState(null);
    const [todayWorkout, setTodayWorkout] = useState(null);
    const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState({ streak: 0, weeklyTime: '0h 0m', workoutCount: 0 });

    const loadActiveSplit = useCallback(async () => {
        try {
            setLoading(true);
            const splits = await fetchSplitsFromFirestore();
            
            if (splits.length === 0) {
                setLoading(false);
                return;
            }

            const active = splits[0];
            setActiveSplit(active);
            
            // Stats logic - replace with your actual stats fetch logic
            setUserStats({
                streak: active.data?.streak || 0,
                weeklyTime: active.data?.weeklyTime || '0h 0m',
                workoutCount: active.data?.totalWorkouts || 0
            });

            const today = new Date().getDay();
            const todayKey = DAYS_MAP[today];
            const schedule = active.data?.schedule || active.schedule;

            if (schedule && schedule[todayKey]) {
                const workout = schedule[todayKey];
                setTodayWorkout({
                    name: workout.templateName || 'Rest Day',
                    duration: workout.duration ? `${workout.duration} mins` : '0 mins',
                    exercises: workout.exercises || []
                });
            }

            const upcoming = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            for (let i = 1; i <= 6; i++) {
                const futureDay = (today + i) % 7;
                const futureDayKey = DAYS_MAP[futureDay];
                const workout = schedule?.[futureDayKey];
                const exercises = workout?.exercises || [];
                
                if (exercises.length > 0) {
                    const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].join(', ');
                    upcoming.push({
                        name: workout.templateName,
                        day: dayNames[futureDay],
                        details: muscleGroups,
                        exercises: exercises,
                        duration: workout.duration ? `${workout.duration} mins` : '45 mins',
                        isRest: false
                    });
                } else {
                    upcoming.push({
                        name: 'Rest',
                        day: dayNames[futureDay],
                        details: 'Recovery day',
                        exercises: [],
                        duration: '0 mins',
                        isRest: true
                    });
                }
                if (upcoming.length >= 3) break;
            }
            setUpcomingWorkouts(upcoming);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadActiveSplit(); }, [loadActiveSplit]));

    const handleStartWorkout = useCallback(() => { navigation.replace('StartWorkout'); }, [navigation]);
    const handlePreviewWorkout = useCallback((workout) => { setPreviewWorkout(workout); setIsModalVisible(true); }, []);
    const handleCloseModal = useCallback(() => { setIsModalVisible(false); setPreviewWorkout(null); }, []);
    const handleTemplatesPress = useCallback(() => { navigation.navigate('WorkoutLibrary', { initialSegment: 'Templates' }); }, [navigation]);
    const handleHistoryPress = useCallback(() => { navigation.navigate('WorkoutHistory'); }, [navigation]);
    const handleSplitsPress = useCallback(() => { navigation.navigate('WorkoutLibrary', { initialSegment: 'Splits' }); }, [navigation]);

    const isRestDay = useMemo(() => !todayWorkout || !todayWorkout.exercises || todayWorkout.exercises.length === 0, [todayWorkout]);

    const primaryWorkout = useMemo(() => {
        if (!isRestDay) return { workout: todayWorkout, isRestDay: false };
        if (upcomingWorkouts.length > 0 && !upcomingWorkouts[0].isRest) {
            return { 
                workout: {
                    name: upcomingWorkouts[0].name,
                    duration: upcomingWorkouts[0].duration,
                    exercises: upcomingWorkouts[0].exercises
                }, 
                isRestDay: false
            };
        }
        return { workout: null, isRestDay: true };
    }, [isRestDay, todayWorkout, upcomingWorkouts]);

    const remainingUpcoming = useMemo(() => isRestDay && upcomingWorkouts.length > 0 && !upcomingWorkouts[0].isRest ? upcomingWorkouts.slice(1, 3) : upcomingWorkouts.slice(0, 2), [isRestDay, upcomingWorkouts]);
    const allExercises = useMemo(() => !primaryWorkout.workout || !primaryWorkout.workout.exercises ? [] : primaryWorkout.workout.exercises.map(e => e.exerciseName), [primaryWorkout]);

    if (loading) return <ApplicationCustomScreen><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF9500" /></View></ApplicationCustomScreen>;

    return (
        <ApplicationCustomScreen>
            <View style={[styles.container, { paddingBottom: 70 + insets.bottom, paddingHorizontal: normalize(16) }]}>
                <HeaderSection stats={userStats} />
                
                <MainWorkoutCard
                    workoutData={primaryWorkout.workout}
                    onPreview={() => primaryWorkout.workout && handlePreviewWorkout(primaryWorkout.workout)}
                    onStart={handleStartWorkout}
                    allExercises={allExercises}
                    isRestDay={primaryWorkout.isRestDay}
                />

                <WeeklyProgressSection completedDays={userStats.streak % 7} totalDays={7} />

                {remainingUpcoming.length > 0 && (
                    <WorkoutActionsSection 
                        upcomingWorkouts={remainingUpcoming}
                        onPreview={handlePreviewWorkout}
                    />
                )}

                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleTemplatesPress}>
                        <Ionicons name="albums-outline" size={normalize(20)} color="#FF9500" />
                        <Text style={styles.quickActionButtonText}>Templates</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleHistoryPress}>
                        <Ionicons name="stats-chart-outline" size={normalize(20)} color="#06B6D4" />
                        <Text style={styles.quickActionButtonText}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleSplitsPress}>
                        <Ionicons name="calendar-outline" size={normalize(20)} color="#a855f7" />
                        <Text style={styles.quickActionButtonText}>Programs</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={handleCloseModal}>
                <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
                    <View style={[styles.modalContent, { marginTop: insets.top, marginBottom: insets.bottom }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{previewWorkout?.name || 'Workout'}</Text>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={normalize(18)} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScrollView}>
                            {previewWorkout?.exercises?.map((exercise, index) => (
                                <View key={index} style={styles.modalExerciseItem}>
                                    <View style={styles.modalExerciseNumber}><Text style={styles.modalExerciseNumberText}>{index + 1}</Text></View>
                                    <View style={styles.modalExerciseContent}>
                                        <Text style={styles.modalExerciseText}>{exercise.exerciseName}</Text>
                                        <Text style={styles.modalExerciseReps}>{exercise.numSets} sets × {exercise.repRange} reps</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalStartButton} onPress={() => { setIsModalVisible(false); handleStartWorkout(); }}>
                            <Ionicons name="play" size={normalize(14)} color="#0A0E13" style={{ marginRight: normalize(6) }} />
                            <Text style={styles.modalStartButtonText}>Start Workout</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </ApplicationCustomScreen>
    );
};

export default React.memo(WorkoutScreen);
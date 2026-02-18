import React, { useCallback, useMemo, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import { fetchSplitsFromFirestore } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { colors, spacing } from '../../../../shared/theme';
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

const LiveTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    React.useEffect(() => {
        const updateElapsed = () => {
            const now = Date.now();
            const seconds = Math.floor((now - startTime) / 1000);
            setElapsed(seconds);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (timeInSeconds) => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = timeInSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        }
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    };

    return <Text style={styles.compactTimerText}>{formatTime(elapsed)}</Text>;
};

const HeaderSection = React.memo(({ stats }) => (
    <View style={styles.headerStatsRow}>
        <View style={styles.headerStatItem}>
            <Ionicons name="flame-outline" size={14} color="#ff8535" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.streak}</Text>
            <Text style={styles.headerStatLabel}>Day Streak</Text>
        </View>
        <View style={styles.headerStatItem}>
            <Ionicons name="time-outline" size={14} color="#00d4ff" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.weeklyTime}</Text>
            <Text style={styles.headerStatLabel}>This Week</Text>
        </View>
        <View style={styles.headerStatItem}>
            <Ionicons name="barbell-outline" size={14} color="#a855f7" style={styles.headerStatIcon} />
            <Text style={styles.headerStatValue}>{stats.workoutCount}</Text>
            <Text style={styles.headerStatLabel}>Workouts</Text>
        </View>
    </View>
));

const MainWorkoutCard = React.memo(({ workoutData, onPreview, onStart, allExercises, isRestDay, hasActiveWorkout, isToday }) => {
    const visibleExercises = allExercises.slice(0, 3);
    const hasMoreExercises = allExercises.length > 3;

    if (isRestDay) {
        return (
            <View style={styles.restDayCard}>
                <View style={styles.restDayContent}>
                    <View style={styles.restDayIconContainer}>
                        <Ionicons name="moon" size={28} color={colors.accent.cyan} />
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
                            <Ionicons name="time-outline" size={14} color="#d1d5db" />
                            <Text style={styles.metricText}>{workoutData.duration}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="barbell-outline" size={14} color="#d1d5db" />
                            <Text style={styles.metricText}>{allExercises.length} exercises</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.previewButton} onPress={onPreview}>
                    <Ionicons name="eye-outline" size={spacing[3]} color={colors.accent.cyan} />
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
                <TouchableOpacity
                    style={[styles.startButton, hasActiveWorkout && styles.startButtonDisabled]}
                    onPress={onStart}
                    activeOpacity={0.8}
                    disabled={hasActiveWorkout}
                >
                    <Ionicons name="play" size={16} style={styles.playIcon} />
                    <Text style={styles.startButtonText}>
                        {hasActiveWorkout ? 'WORKOUT IN PROGRESS' : 'START'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const WeeklyProgressSection = React.memo(({ completedDays }) => {
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
                <Text style={styles.sectionTitle}>Weekly Progress</Text>
                <Text style={styles.progressSubtitle}>{completedDays.length}/7 Days</Text>
            </View>
            <View style={styles.daysContainer}>
                {daysOfWeek.map((day, index) => {
                    const dayIndex = index === 6 ? 0 : index + 1;
                    const isCompleted = completedDays.includes(dayIndex);
                    return (
                        <View
                            key={index}
                            style={[styles.dayCircle, isCompleted ? styles.activeDayCircle : styles.inactiveDayCircle]}
                        >
                            <Text style={[styles.dayText, !isCompleted && styles.inactiveDayText]}>
                                {day}
                            </Text>
                        </View>
                    );
                })}
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
                                <Ionicons name="arrow-forward" size={12} color={colors.accent.cyan} />
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

    const { activeWorkout, workoutHistory } = useContext(WorkoutContext);

    const userStats = useMemo(() => {
        const completedDaysThisWeek = [];
        const now = new Date();
        
        const weekStart = new Date(now);
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        let totalMinutes = 0;
        let streak = 0;

        if (workoutHistory && workoutHistory.length > 0) {
            const sortedHistory = [...workoutHistory].sort((a, b) => {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                return bTime - aTime;
            });

            sortedHistory.forEach(workout => {
                const workoutDate = workout.timestamp?.toDate ? workout.timestamp.toDate() : null;
                if (!workoutDate) return;

                if (workoutDate >= weekStart) {
                    const dayOfWeek = workoutDate.getUTCDay();
                    if (!completedDaysThisWeek.includes(dayOfWeek)) {
                        completedDaysThisWeek.push(dayOfWeek);
                    }

                    const duration = workout.duration || '0:00';
                    const parts = duration.split(':');
                    if (parts.length === 2) {
                        totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
                    } else if (parts.length === 3) {
                        totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
                    }
                }
            });

            let currentDate = new Date(now);
            currentDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < sortedHistory.length; i++) {
                const workoutDate = sortedHistory[i].timestamp?.toDate();
                if (!workoutDate) break;

                const wDate = new Date(workoutDate);
                wDate.setHours(0, 0, 0, 0);

                if (wDate.getTime() === currentDate.getTime()) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else if (wDate.getTime() < currentDate.getTime()) {
                    break;
                }
            }
        }

        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const weeklyTime = `${hours}h ${mins}m`;

        return {
            streak,
            weeklyTime,
            workoutCount: workoutHistory?.length || 0,
            completedDaysThisWeek
        };
    }, [workoutHistory]);

    const loadActiveSplit = useCallback(async () => {
        try {
            setLoading(true);
            const splits = await fetchSplitsFromFirestore();

            if (splits.length === 0) {
                setLoading(false);
                return;
            }

            const rawSplit = splits[0];
            const active = {
                id: rawSplit.id || rawSplit.data?.id,
                name: rawSplit.name || rawSplit.data?.name,
                schedule: rawSplit.schedule || rawSplit.data?.schedule || {},
            };
            
            setActiveSplit(active);

            const today = new Date().getDay();
            const todayKey = DAYS_MAP[today];
            const schedule = active.schedule;

            if (schedule && schedule[todayKey]) {
                const workout = schedule[todayKey];
                const exercises = workout.exercises || [];
                
                if (exercises.length > 0) {
                    setTodayWorkout({
                        name: workout.templateName || 'Workout',
                        duration: workout.duration ? `${workout.duration} mins` : '45 mins',
                        exercises: exercises
                    });
                } else {
                    setTodayWorkout(null);
                }
            } else {
                setTodayWorkout(null);
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
            console.error('Error loading split:', error);
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadActiveSplit(); }, [loadActiveSplit]));

    const isRestDay = useMemo(() => !todayWorkout || !todayWorkout.exercises || todayWorkout.exercises.length === 0, [todayWorkout]);

    const primaryWorkout = useMemo(() => {
        if (!isRestDay && todayWorkout) {
            return { workout: todayWorkout, isRestDay: false, isToday: true };
        }
        
        if (upcomingWorkouts.length > 0 && !upcomingWorkouts[0].isRest) {
            return {
                workout: {
                    name: upcomingWorkouts[0].name,
                    duration: upcomingWorkouts[0].duration,
                    exercises: upcomingWorkouts[0].exercises,
                    day: upcomingWorkouts[0].day
                },
                isRestDay: false,
                isToday: false
            };
        }
        
        return { workout: null, isRestDay: true, isToday: false };
    }, [isRestDay, todayWorkout, upcomingWorkouts]);

    const handleStartWorkout = useCallback(() => {
        if (primaryWorkout && primaryWorkout.workout && primaryWorkout.workout.exercises && primaryWorkout.workout.exercises.length > 0 && !primaryWorkout.isRestDay) {
            navigation.navigate('StartWorkout', {
                selectedWorkout: {
                    note: '',
                    templateName: primaryWorkout.workout.name,
                    exercises: primaryWorkout.workout.exercises
                }
            });
        } else {
            navigation.navigate('StartWorkout');
        }
    }, [navigation, primaryWorkout]);

    const handleResumeWorkout = useCallback(() => { navigation.navigate('StartWorkout'); }, [navigation]);
    const handlePreviewWorkout = useCallback((workout) => { setPreviewWorkout(workout); setIsModalVisible(true); }, []);
    const handleCloseModal = useCallback(() => { setIsModalVisible(false); setPreviewWorkout(null); }, []);
    const handleTemplatesPress = useCallback(() => { navigation.navigate('WorkoutLibrary', { initialSegment: 'Templates' }); }, [navigation]);
    const handleHistoryPress = useCallback(() => { navigation.navigate('WorkoutHistory'); }, [navigation]);
    const handleSplitsPress = useCallback(() => { navigation.navigate('WorkoutLibrary', { initialSegment: 'Splits' }); }, [navigation]);

    const remainingUpcoming = useMemo(() => {
    if (!primaryWorkout.isToday && upcomingWorkouts.length > 0) {
        return upcomingWorkouts.slice(1, 3);
    }
    return upcomingWorkouts.slice(0, 2);
    }, [primaryWorkout.isToday, upcomingWorkouts]);

    const allExercises = useMemo(() => !primaryWorkout || !primaryWorkout.workout || !primaryWorkout.workout.exercises ? [] : primaryWorkout.workout.exercises.map(e => e.exerciseName), [primaryWorkout]);

    if (loading || !primaryWorkout) {
        return (
            <ApplicationCustomScreen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
            </ApplicationCustomScreen>
        );
    }

    return (
        <ApplicationCustomScreen>
            <View style={[styles.container, { paddingBottom: 70 + insets.bottom, paddingHorizontal: spacing[4] }]}>
                {activeWorkout && (
                    <TouchableOpacity
                        style={styles.compactBanner}
                        onPress={handleResumeWorkout}
                        activeOpacity={0.8}
                    >
                        <View style={styles.bannerLeft}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.bannerText}>Workout Active</Text>
                            <Text style={styles.bannerExercises}>{activeWorkout.exercises.length} exercises</Text>
                        </View>
                        <View style={styles.bannerRight}>
                            <LiveTimer startTime={activeWorkout.startTime} />
                            <Ionicons name="chevron-forward" size={14} color="#666" />
                        </View>
                    </TouchableOpacity>
                )}

                <HeaderSection stats={userStats} />

                <MainWorkoutCard
                    workoutData={primaryWorkout.workout}
                    onPreview={() => primaryWorkout.workout && handlePreviewWorkout(primaryWorkout.workout)}
                    onStart={handleStartWorkout}
                    allExercises={allExercises}
                    isRestDay={primaryWorkout.isRestDay}
                    hasActiveWorkout={!!activeWorkout}
                    isToday={primaryWorkout.isToday}
                />

                <WeeklyProgressSection completedDays={userStats.completedDaysThisWeek} />

                {remainingUpcoming.length > 0 && (
                    <WorkoutActionsSection
                        upcomingWorkouts={remainingUpcoming}
                        onPreview={handlePreviewWorkout}
                    />
                )}

                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleTemplatesPress}>
                        <Ionicons name="albums-outline" size={20} color={colors.accent.primary} />
                        <Text style={styles.quickActionButtonText}>Templates</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleHistoryPress}>
                        <Ionicons name="stats-chart-outline" size={20} color={colors.accent.cyan} />
                        <Text style={styles.quickActionButtonText}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleSplitsPress}>
                        <Ionicons name="calendar-outline" size={20} color={colors.accent.purple} />
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
                                <Ionicons name="close" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalStatsRow}>
                                <View style={styles.modalStatItem}>
                                    <Text style={styles.modalStatValue}>{previewWorkout?.duration?.replace(' mins', 'm') || '0m'}</Text>
                                    <Text style={styles.modalStatLabel}>Time</Text>
                                </View>
                                <View style={styles.modalStatDivider} />
                                <View style={styles.modalStatItem}>
                                    <Text style={styles.modalStatValue}>{previewWorkout?.exercises?.reduce((acc, ex) => acc + (parseInt(ex.numSets) || 0), 0) || 0}</Text>
                                    <Text style={styles.modalStatLabel}>Sets</Text>
                                </View>
                                <View style={styles.modalStatDivider} />
                                <View style={styles.modalStatItem}>
                                    <Text style={styles.modalStatValue}>{previewWorkout?.exercises?.length || 0}</Text>
                                    <Text style={styles.modalStatLabel}>Exercises</Text>
                                </View>
                            </View>

                            <View style={styles.modalExercisesList}>
                                {previewWorkout?.exercises?.map((exercise, index) => {
                                    const isLast = index === previewWorkout.exercises.length - 1;
                                    return (
                                        <View key={index} style={[styles.modalExerciseRow, isLast && styles.modalExerciseRowLast]}>
                                            <View style={styles.modalExerciseLeft}>
                                                <Text style={styles.modalExerciseSets}>{exercise.numSets}x</Text>
                                                <Text style={styles.modalExerciseName} numberOfLines={1}>
                                                    {exercise.exerciseName}
                                                </Text>
                                            </View>
                                            <View style={styles.modalBestSetContainer}>
                                                <Text style={styles.modalBestSetValue}>
                                                    {exercise.repRange} reps
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.modalStartButton,
                                activeWorkout && styles.modalStartButtonDisabled
                            ]}
                            onPress={() => {
                                if (activeWorkout) return;
                                setIsModalVisible(false);
                                navigation.navigate('StartWorkout', {
                                    selectedWorkout: {
                                        note: '',
                                        templateName: previewWorkout?.name,
                                        exercises: previewWorkout?.exercises || []
                                    }
                                });
                            }}
                            disabled={!!activeWorkout}
                        >
                            <Ionicons name="play" size={14} color={colors.background.primary} style={{ marginRight: spacing[2] }} />
                            <Text style={styles.modalStartButtonText}>
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
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '../../../../shared/hooks/useResponsive';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import styles from './WorkoutScreenStyles';

const MOCK_WORKOUT_DATA = {
    current: {
        name: 'Back & Chest Workout',
        duration: '45-60 mins',
        difficulty: 'Intermediate',
        exercises: {
            back: ['Barbell Row', 'Lat Pulldown', 'Cable Row', 'Deadlifts'],
            chest: ['DB Bench', 'Incline Press', 'Bench Press', 'Dips'],
        },
    },
    upcoming: [
        { name: 'Leg Day', day: 'Thu', details: 'Quads, Hamstrings, Calves' },
        { name: 'Arms & Shoulders', day: 'Fri', details: 'Biceps, Triceps, Delts' },
    ],
    completedDays: 3,
    totalDays: 7,
};

const HeaderSection = React.memo(() => (
    <View>
        <View style={styles.headerStatsRow}>
            <View style={styles.headerStatItem}>
                <Ionicons name="flame-outline" size={normalize(14)} color="#ff8535" style={styles.headerStatIcon} />
                <Text style={styles.headerStatValue}>15</Text>
                <Text style={styles.headerStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.headerStatItem}>
                <Ionicons name="time-outline" size={normalize(14)} color="#00d4ff" style={styles.headerStatIcon} />
                <Text style={styles.headerStatValue}>2h 15m</Text>
                <Text style={styles.headerStatLabel}>This Week</Text>
            </View>
            <View style={styles.headerStatItem}>
                <Ionicons name="barbell-outline" size={normalize(14)} color="#a855f7" style={styles.headerStatIcon} />
                <Text style={styles.headerStatValue}>5</Text>
                <Text style={styles.headerStatLabel}>Workouts</Text>
            </View>
        </View>
    </View>
));

const MainWorkoutCard = React.memo(({ workoutData, onPreview, onStart, allExercises }) => {
    const visibleExercises = allExercises.slice(0, 3);
    const hasMoreExercises = allExercises.length > 3;

    return (
        <View style={styles.workoutCard}>
            <View style={styles.workoutCardHeader}>
                <View style={styles.workoutInfo}>
                    <View style={styles.planIndicator}>
                        <View style={styles.planDot} />
                        <Text style={styles.planText}>Today's Plan</Text>
                    </View>
                    <Text style={styles.workoutCardTitle}>{workoutData.name}</Text>
                    <View style={styles.workoutMetrics}>
                        <View style={styles.metricItem}>
                            <Ionicons name="time-outline" size={normalize(14)} color="#d1d5db" />
                            <Text style={styles.metricText}>{workoutData.duration}</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Ionicons name="fitness-outline" size={normalize(14)} color="#d1d5db" />
                            <Text style={styles.metricText}>{workoutData.difficulty}</Text>
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

const WorkoutActionsSection = React.memo(({ upcomingWorkouts }) => (
    <View style={styles.mergedCard}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coming Up</Text>
        </View>
        {upcomingWorkouts.map((workout, index) => (
            <View key={index} style={styles.upcomingItem}>
                <View style={styles.upcomingDayContainer}>
                    <Text style={styles.upcomingDay}>{workout.day}</Text>
                </View>
                <View style={styles.upcomingDetails}>
                    <Text style={styles.upcomingName}>{workout.name}</Text>
                    <Text style={styles.upcomingInfo}>{workout.details}</Text>
                </View>
                <TouchableOpacity style={styles.upcomingPlayButton}>
                    <Ionicons name="arrow-forward" size={normalize(14)} color="#00d4ff" />
                </TouchableOpacity>
            </View>
        ))}
    </View>
));

const WorkoutScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleStartWorkout = useCallback(() => {
        navigation.replace('StartWorkout');
    }, [navigation]);

    const handlePreviewWorkout = useCallback(() => setIsModalVisible(true), []);
    const handleCloseModal = useCallback(() => setIsModalVisible(false), []);

    const handleTemplatesPress = useCallback(() => {
        navigation.navigate('WorkoutLibrary');
    }, [navigation]);

    const handleHistoryPress = useCallback(() => {
        navigation.navigate('WorkoutHistory');
    }, [navigation]);

    const handleSplitsPress = useCallback(() => {
        navigation.navigate('WorkoutSplits');
    }, [navigation]);

    const allExercises = useMemo(() => {
        const { back, chest } = MOCK_WORKOUT_DATA.current.exercises;
        return [...back, ...chest];
    }, []);

    const navBarHeight = 70;

    return (
        <ApplicationCustomScreen>
            <View style={styles.container}>
                <View style={[styles.contentWrapper, { paddingBottom: navBarHeight + insets.bottom }]}>
                    <HeaderSection />
                    
                    <MainWorkoutCard
                        workoutData={MOCK_WORKOUT_DATA.current}
                        onPreview={handlePreviewWorkout}
                        onStart={handleStartWorkout}
                        allExercises={allExercises}
                    />

                    <WeeklyProgressSection
                        completedDays={MOCK_WORKOUT_DATA.completedDays}
                        totalDays={MOCK_WORKOUT_DATA.totalDays}
                    />

                    <WorkoutActionsSection
                        upcomingWorkouts={MOCK_WORKOUT_DATA.upcoming}
                    />

                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity style={styles.quickActionCard} onPress={handleTemplatesPress}>
                            <View style={styles.quickActionIconContainer}>
                                <Ionicons name="albums-outline" size={normalize(20)} color="#FF9500" />
                            </View>
                            <Text style={styles.quickActionText}>Templates</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickActionCard} onPress={handleHistoryPress}>
                            <View style={styles.quickActionIconContainer}>
                                <Ionicons name="stats-chart" size={normalize(20)} color="#00d4ff" />
                            </View>
                            <Text style={styles.quickActionText}>History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickActionCard} onPress={handleSplitsPress}>
                            <View style={styles.quickActionIconContainer}>
                                <Ionicons name="calendar-outline" size={normalize(20)} color="#a855f7" />
                            </View>
                            <Text style={styles.quickActionText}>Programs</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={handleCloseModal}>
                <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
                    <View style={[styles.modalContent, { 
                        marginTop: insets.top,
                        marginBottom: insets.bottom 
                    }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Workout Preview</Text>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={normalize(18)} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalScrollView}>
                            {Object.entries(MOCK_WORKOUT_DATA.current.exercises).map(([category, exercises]) => (
                                <View key={category} style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                    {exercises.map((exercise, index) => (
                                        <View key={index} style={styles.modalExerciseItem}>
                                            <Text style={styles.modalExerciseText}>{exercise}</Text>
                                            <Text style={styles.modalExerciseReps}>3 sets</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.modalStartButton}
                            onPress={() => {
                                setIsModalVisible(false);
                                handleStartWorkout();
                            }}
                        >
                            <Ionicons name="play" size={normalize(14)} color="#02111B" style={{ marginRight: normalize(6) }} />
                            <Text style={styles.modalStartButtonText}>Start</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </ApplicationCustomScreen>
    );
};

export default React.memo(WorkoutScreen);
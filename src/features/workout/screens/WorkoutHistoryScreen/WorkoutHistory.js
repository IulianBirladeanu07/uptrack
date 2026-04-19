import { useContext, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutContext } from '../../context/WorkoutContext';
import { findBestSet } from '../../handlers/WorkoutHandler';
import styles from './WorkoutHistoryStyles';

const WorkoutHistoryScreen = ({ navigation }) => {
    const { workoutHistory, activeWorkout } = useContext(WorkoutContext);

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return 'RECENT';

        const date = new Date(timestamp.seconds * 1000);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'TODAY';
        if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    };

    const getMonthYear = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return 'RECENT';
        const date = new Date(timestamp.seconds * 1000);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getWorkoutLabel = (timestamp, templateName) => {
        if (templateName && templateName !== 'Workout') return templateName;
        if (!timestamp || !timestamp.seconds) return 'Recent Workout';

        const hour = new Date(timestamp.seconds * 1000).getHours();
        if (hour >= 5 && hour < 12) return 'Morning Workout';
        if (hour >= 12 && hour < 17) return 'Afternoon Workout';
        if (hour >= 17 && hour < 21) return 'Evening Workout';
        return 'Night Workout';
    };

    const getDurationInMinutes = (duration) => {
        const [hours, minutes] = duration.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    };

    const calculateTotalSets = (exercises) => {
        return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    };

    const handleStartWorkout = (workout) => {
        if (activeWorkout) return;

        const exercisesForWorkout = workout.exercises.map(exercise => ({
            exerciseName: exercise.exerciseName,
            imageURL: exercise.imageURL || '',
            muscleGroup: exercise.muscleGroup || '',
            category: exercise.category || '',
            numSets: exercise.numSets || exercise.sets.length.toString(),
            repRange: exercise.repRange || '',
            note: exercise.note || '',
            restBetweenSets: exercise.restBetweenSets || '',
            lastWorkoutSets: exercise.lastWorkoutSets || [],
            sets: exercise.sets.map(set => ({
                weight: String(set.weight || ''),
                reps: String(set.reps || ''),
                isValidated: false,
                repsModified: false,
            })),
        }));

        navigation.navigate('StartWorkout', {
            selectedWorkout: {
                note: workout.note || '',
                exercises: exercisesForWorkout,
            },
        });
    };

    const sections = useMemo(() => {
        const grouped = workoutHistory.reduce((groups, workout) => {
            const monthYear = getMonthYear(workout.timestamp);
            if (!groups[monthYear]) groups[monthYear] = [];
            groups[monthYear].push(workout);
            return groups;
        }, {});

        return Object.keys(grouped).map(monthYear => ({
            title: monthYear,
            data: grouped[monthYear],
        }));
    }, [workoutHistory]);

    const renderWorkout = ({ item }) => {
        const exercises = item.exercises || [];
        const totalSets = calculateTotalSets(exercises);
        const durationMinutes = getDurationInMinutes(item.duration);
        const workoutTitle = getWorkoutLabel(item.timestamp, item.workoutName);

        return (
            <TouchableOpacity
                style={[styles.workoutCard, activeWorkout && styles.workoutCardDisabled]}
                onPress={() => handleStartWorkout(item)}
                activeOpacity={activeWorkout ? 1 : 0.7}
                disabled={!!activeWorkout}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.workoutTitle}>{workoutTitle}</Text>
                    <View style={styles.headerRight}>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                        </View>
                        {item.totalPRs > 0 && (
                            <View style={styles.prBadge}>
                                <Ionicons name="trophy" size={10} color="#FFD700" />
                                <Text style={styles.prText}>{item.totalPRs}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{durationMinutes}m</Text>
                        <Text style={styles.statLabel}>TIME</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalSets}</Text>
                        <Text style={styles.statLabel}>SETS</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{exercises.length}</Text>
                        <Text style={styles.statLabel}>EXERCISES</Text>
                    </View>
                </View>

                <View style={styles.exerciseListHeader}>
                    <Text style={styles.exerciseListHeaderLabel}>EXERCISE</Text>
                    <Text style={styles.exerciseListHeaderLabel}>BEST</Text>
                </View>

                <View style={styles.exercisesList}>
                    {exercises.map((exercise, exIndex) => {
                        const bestSet = findBestSet(exercise.sets);
                        const hasPR = exercise.sets.some(s => s.isPR);
                        const isLast = exIndex === exercises.length - 1;
                        return (
                            <View key={exIndex} style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}>
                                <View style={styles.exerciseLeft}>
                                    <Text style={styles.exerciseSets}>{exercise.sets.length}x</Text>
                                    <Text style={styles.exerciseName} numberOfLines={1}>
                                        {exercise.exerciseName}
                                    </Text>
                                </View>
                                <View style={styles.bestSetContainer}>
                                    <Text style={[styles.bestSetValue, hasPR && styles.bestSetValuePR]}>
                                        {bestSet.weight && bestSet.reps ? `${bestSet.weight}kg × ${bestSet.reps}` : '-'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </TouchableOpacity>
        );
    };
    const renderSectionHeader = ({ section: { title } }) => (
        <Text style={styles.monthDivider}>{title}</Text>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="time-outline" size={56} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No workout history yet</Text>
            <Text style={styles.emptySubtitle}>
                Your completed workouts will appear here.{'\n'}Start your first workout to track your progress!
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.heading}>History</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SectionList
                sections={sections}
                renderItem={renderWorkout}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.contentWrapper}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
            />
        </SafeAreaView>
    );
};

export default WorkoutHistoryScreen;
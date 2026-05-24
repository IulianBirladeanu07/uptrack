import { useCallback, useContext, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutContext } from '../../context/WorkoutContext';
import { findBestSet } from '../../handlers/WorkoutHandler';
import { colors } from '../../../../shared/theme';
import styles from './WorkoutHistoryStyles';

const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'RECENT';
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getMonthYear = (timestamp) => {
    if (!timestamp?.seconds) return 'Recent';
    const date = new Date(timestamp.seconds * 1000);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getWorkoutLabel = (timestamp, templateName) => {
    if (templateName && templateName !== 'Workout') return templateName;
    if (!timestamp?.seconds) return 'Recent Workout';
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

const WorkoutCard = ({ item, activeWorkout, onPress }) => {
    const exercises = item.exercises || [];
    const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);
    const durationMinutes = getDurationInMinutes(item.duration);
    const workoutTitle = getWorkoutLabel(item.timestamp, item.workoutName);

    return (
        <TouchableOpacity
            style={[styles.workoutCard, activeWorkout && styles.workoutCardDisabled]}
            onPress={() => onPress(item)}
            activeOpacity={activeWorkout ? 1 : 0.7}
            disabled={!!activeWorkout}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.workoutTitle} numberOfLines={1}>{workoutTitle}</Text>
                <View style={styles.headerRight}>
                    {item.totalPRs > 0 && (
                        <View style={styles.prBadge}>
                            <Ionicons name="trophy" size={10} color="#FFD700" />
                            <Text style={styles.prText}>{item.totalPRs}</Text>
                        </View>
                    )}
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsMeta}>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{durationMinutes}m</Text>
                </View>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{totalSets} sets</Text>
                </View>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="barbell-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{exercises.length} exercises</Text>
                </View>
            </View>

            <View style={styles.exerciseListHeader}>
                <Text style={styles.exerciseListHeaderLabel}>EXERCISE</Text>
                <Text style={styles.exerciseListHeaderLabel}>BEST</Text>
            </View>

            <View style={styles.exercisesList}>
                {exercises.map((exercise, i) => {
                    const bestSet = findBestSet(exercise.sets);
                    const hasPR = exercise.sets.some(s => s.isPR);
                    return (
                        <View key={i} style={[styles.exerciseRow, i === exercises.length - 1 && styles.exerciseRowLast]}>
                            <View style={styles.exerciseLeft}>
                                <Text style={styles.exerciseSets}>{exercise.sets.length}x</Text>
                                <Text style={styles.exerciseName} numberOfLines={1}>{exercise.exerciseName}</Text>
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

const WorkoutHistoryScreen = ({ navigation }) => {
    const { workoutHistory, activeWorkout } = useContext(WorkoutContext);

    const handleStartWorkout = useCallback((workout) => {
        if (activeWorkout) return;
        navigation.navigate('StartWorkout', {
            selectedWorkout: {
                note: workout.note || '',
                exercises: workout.exercises.map(ex => ({
                    exerciseName: ex.exerciseName,
                    imageURL: ex.imageURL || '',
                    muscleGroup: ex.muscleGroup || '',
                    category: ex.category || '',
                    numSets: ex.numSets || ex.sets.length.toString(),
                    repRange: ex.repRange || '',
                    note: ex.note || '',
                    restBetweenSets: ex.restBetweenSets || '',
                    lastWorkoutSets: ex.lastWorkoutSets || [],
                    sets: ex.sets.map(s => ({
                        weight: String(s.weight || ''),
                        reps: String(s.reps || ''),
                        isValidated: false,
                        repsModified: false,
                    })),
                })),
            },
        });
    }, [activeWorkout, navigation]);

    const sections = useMemo(() => {
        const grouped = workoutHistory.reduce((groups, workout) => {
            const key = getMonthYear(workout.timestamp);
            if (!groups[key]) groups[key] = [];
            groups[key].push(workout);
            return groups;
        }, {});
        return Object.keys(grouped).map(title => ({ title, data: grouped[title] }));
    }, [workoutHistory]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SectionList
                sections={sections}
                renderItem={({ item }) => (
                    <WorkoutCard
                        item={item}
                        activeWorkout={activeWorkout}
                        onPress={handleStartWorkout}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.monthDivider}>{title}</Text>
                )}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.heading}>History</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="time-outline" size={48} color={colors.text.quaternary} />
                        </View>
                        <Text style={styles.emptyTitle}>No workout history yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your completed workouts will appear here.{'\n'}Start your first workout to track your progress!
                        </Text>
                    </View>
                }
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
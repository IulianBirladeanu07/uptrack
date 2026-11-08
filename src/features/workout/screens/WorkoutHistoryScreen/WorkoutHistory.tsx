import { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WorkoutContext } from '../../context/WorkoutContext';
import ExerciseListToggle from '../../components/ExerciseListToggle';
import { colors, fontSize, spacing } from '../../../../shared/theme';
import { formatWorkoutDate } from '../../utils/formatWorkoutDate';
import styles from './WorkoutHistoryStyles';
import { useAppNavigation } from '../../../../shared/navigation';
import { getWorkoutMonthYear, groupWorkoutHistoryByMonth } from './workoutHistorySections';
import {
    toHistorySelectedWorkout,
    type WorkoutHistoryForSelection,
} from './workoutHistorySelection';
import { getWorkoutHistoryCardData, PREVIEW_EXERCISE_COUNT, type WorkoutHistoryCardItem } from './workoutHistoryCardData';

type HistoryWorkout = WorkoutHistoryCardItem & WorkoutHistoryForSelection & { id?: string };

const getExerciseSetLabel = (exercise: ReturnType<typeof getWorkoutHistoryCardData>['exercises'][number]) =>
    exercise.setGroups.map(group => group.label).join(' · ');

const getPRSetLabel = (exercise: ReturnType<typeof getWorkoutHistoryCardData>['exercises'][number]) =>
    exercise.setGroups.flatMap(group => group.reps
        .filter(set => set.isPR)
        .map(set => group.weight ? `${group.weight} × ${set.label}` : set.label))
        .join(', ');

const WorkoutCard = ({
    item,
    activeWorkout,
    onRepeat,
    onView,
}: {
    item: HistoryWorkout;
    activeWorkout?: boolean;
    onRepeat: (item: HistoryWorkout) => void;
    onView: (item: HistoryWorkout) => void;
}) => {
    const cardData = getWorkoutHistoryCardData(item);
    const [expanded, setExpanded] = useState(false);
    const canExpand = cardData.exercises.length > PREVIEW_EXERCISE_COUNT;
    const remainingExercises = cardData.exercises.slice(PREVIEW_EXERCISE_COUNT);
    const visibleExercises = expanded
        ? cardData.exercises
        : cardData.exercises.slice(0, PREVIEW_EXERCISE_COUNT);
    const showMoreLabel = `Show ${remainingExercises.length} more`;
    const showMoreAccessibilityLabel = `Show ${remainingExercises.length} more ${remainingExercises.length === 1 ? 'exercise' : 'exercises'}`;
    const toggle = () => setExpanded(value => !value);

    return (
        <View style={styles.workoutCard} testID="workout-card">
            <View style={styles.cardContent} testID="workout-card-content">
                <View>
                <View style={styles.cardHeader} testID="workout-card-header">
                    <View style={styles.cardHeaderTitle}>
                        <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>
                            {cardData.workoutTitle}
                        </Text>
                    </View>
                    <Text style={styles.dateText} numberOfLines={1} allowFontScaling>{cardData.dateLabel}</Text>
                </View>

                <View
                    style={styles.statsMeta}
                    testID="workout-stats-meta"
                >
                    <View style={styles.metaItem} accessible accessibilityLabel={`${cardData.durationMinutes} minutes`}>
                        <Ionicons name="time-outline" size={fontSize[14]} color={colors.text.secondary} />
                        <Text style={styles.statsMetaText} allowFontScaling>{cardData.durationMinutes} min</Text>
                    </View>
                    <View
                        style={styles.metaItem}
                        accessible
                        accessibilityLabel={`${cardData.exercises.length} ${cardData.exercises.length === 1 ? 'exercise' : 'exercises'}`}
                    >
                        <Ionicons name="barbell-outline" size={fontSize[14]} color={colors.text.secondary} />
                        <Text style={styles.statsMetaText} allowFontScaling>
                            {cardData.exercises.length} {cardData.exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Text>
                    </View>
                    <View style={styles.metaItem} accessible accessibilityLabel={`${cardData.totalSets} sets`}>
                        <Ionicons name="layers-outline" size={fontSize[14]} color={colors.text.secondary} />
                        <Text style={styles.statsMetaText} allowFontScaling>
                            {cardData.totalSets} {cardData.totalSets === 1 ? 'set' : 'sets'}
                        </Text>
                    </View>
                    {cardData.hasPRs && (
                        <View style={styles.metaItem} accessible accessibilityLabel={`${cardData.totalPRs} personal ${cardData.totalPRs === 1 ? 'record' : 'records'}`}>
                            <Ionicons name="trophy" size={fontSize[14]} color={colors.accent.primary} />
                            <Text style={styles.prText} allowFontScaling>{cardData.totalPRs} {cardData.totalPRs === 1 ? 'PR' : 'PRs'}</Text>
                        </View>
                    )}
                </View>
                </View>

                <View style={styles.exercisesList}>
                {visibleExercises.map((exercise, i) => (
                    <View
                        key={`${exercise.exerciseName}-${i}`}
                        testID={`exercise-group-${i}`}
                        style={[
                            styles.exerciseGroup,
                            i < visibleExercises.length - 1 && styles.exerciseGroupDivider,
                        ]}
                    >
                        <View
                            style={styles.exerciseRow}
                            testID={`exercise-row-${i}`}
                            accessible
                            accessibilityLabel={`${exercise.exerciseName}, ${exercise.setCount} ${exercise.setCount === 1 ? 'set' : 'sets'}, ${getExerciseSetLabel(exercise)}${exercise.hasPR ? `, personal record set: ${getPRSetLabel(exercise)}` : ''}`}
                        >
                            <View style={styles.exerciseContent}>
                                <View style={styles.exerciseNameRow} testID={`exercise-name-row-${i}`}>
                                    <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail" allowFontScaling>
                                        {exercise.exerciseName}
                                    </Text>
                                    <View style={styles.prIndicator} testID={`pr-indicator-${i}`}>
                                        {exercise.hasPR && (
                                            <Ionicons
                                                name="trophy"
                                                size={fontSize[12]}
                                                color={colors.accent.primary}
                                                accessibilityLabel="Personal record"
                                            />
                                        )}
                                    </View>
                                </View>
                                <View
                                    style={styles.setDetails}
                                    testID={`exercise-set-details-${i}`}
                                    accessible
                                    accessibilityLabel={`Sets: ${getExerciseSetLabel(exercise)}${exercise.hasPR ? `, personal record set: ${getPRSetLabel(exercise)}` : ''}`}
                                >
                                    <Text style={styles.setDetailsText} numberOfLines={2} ellipsizeMode="tail" allowFontScaling>
                                        {exercise.setGroups.map((group, g) => {
                                            const hasRepUnit = !group.weight && group.reps.every(set => set.label.endsWith(' reps'));
                                            return (
                                                <Text key={g}>
                                                    {g > 0 && <Text style={styles.setDetailsSeparator}> · </Text>}
                                                    {group.weight && <Text>{`${group.weight} × `}</Text>}
                                                    {group.reps.map((set, setIndex) => (
                                                        <Text key={setIndex}>
                                                            {setIndex > 0 && ', '}
                                                            <Text>
                                                                {hasRepUnit ? set.label.slice(0, -5) : set.label}
                                                            </Text>
                                                        </Text>
                                                    ))}
                                                    {hasRepUnit && <Text> reps</Text>}
                                                </Text>
                                            );
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
                </View>

                {canExpand && (
                    <ExerciseListToggle
                        expanded={expanded}
                        collapsedLabel={showMoreLabel}
                        collapsedAccessibilityLabel={showMoreAccessibilityLabel}
                        layout="inline"
                        showDivider={false}
                        onPress={toggle}
                    />
                )}
            </View>
            <View style={styles.cardActions} testID="workout-card-actions">
                <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => onView(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${cardData.workoutTitle} details`}
                >
                    <Ionicons name="eye-outline" size={fontSize[18]} color={colors.text.secondary} />
                    <Text style={styles.secondaryActionText}>View workout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.secondaryAction,
                        styles.secondaryActionDivider,
                        activeWorkout && styles.secondaryActionDisabled,
                    ]}
                    onPress={() => onRepeat(item)}
                    activeOpacity={0.7}
                    disabled={!!activeWorkout}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !!activeWorkout }}
                    accessibilityLabel={activeWorkout
                        ? 'A workout is already in progress'
                        : `Repeat ${cardData.workoutTitle}`}
                >
                    <Ionicons
                        name={activeWorkout ? 'pause-circle-outline' : 'repeat-outline'}
                        size={fontSize[18]}
                        color={activeWorkout ? colors.text.quaternary : colors.text.secondary}
                    />
                    <Text style={styles.secondaryActionText}>Repeat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const WorkoutHistoryScreen = () => {
    const navigation = useAppNavigation();
    const insets = useSafeAreaInsets();
    const {
        workoutHistory,
        workoutHistoryLoading,
        workoutHistoryRefreshing,
        workoutHistoryError,
        retryWorkoutHistory,
        activeWorkout,
        hasMoreWorkoutHistory,
        loadingMoreWorkoutHistory,
        workoutHistoryLoadMoreError,
        loadMoreWorkoutHistory,
    } = useContext(WorkoutContext)!;

    const handleStartWorkout = useCallback((workout: HistoryWorkout) => {
        if (activeWorkout) return;
        navigation.navigate('StartWorkout', {
            selectedWorkout: toHistorySelectedWorkout(workout),
        });
    }, [activeWorkout, navigation]);

    const handleViewWorkout = useCallback((workout: HistoryWorkout) => {
        navigation.navigate('WorkoutDetails', {
            exercises: workout.exercises,
            timestamp: formatWorkoutDate(workout.timestamp),
            ...(typeof workout.duration === 'string' ? { duration: workout.duration } : {}),
            ...(workout.note != null ? { notes: workout.note } : {}),
            ...(workout.workoutName !== undefined ? { workoutName: workout.workoutName } : {}),
        });
    }, [navigation]);

    const sections = useMemo(() => {
        return groupWorkoutHistoryByMonth(
            workoutHistory as unknown as HistoryWorkout[],
            workout => workout.timestamp,
        );
    }, [workoutHistory]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="chevron-back" size={fontSize[20]} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.heading}>Workout history</Text>
                {workoutHistoryRefreshing && <ActivityIndicator color={colors.accent.primary} />}
            </View>
            <SectionList
                style={styles.list}
                sections={sections}
                renderItem={({ item }) => (
                    <WorkoutCard
                        item={item}
                        activeWorkout={!!activeWorkout}
                        onRepeat={handleStartWorkout}
                        onView={handleViewWorkout}
                    />
                )}
                renderSectionHeader={({ section: { title, data } }) => (
                    <View style={styles.monthHeading}>
                        <Text style={styles.monthTitle}>{title}</Text>
                        <Text style={styles.monthCount}>{data.length} {data.length === 1 ? 'workout' : 'workouts'}</Text>
                    </View>
                )}
                keyExtractor={(item, index) => item.id || `${getWorkoutMonthYear(item.timestamp)}_${index}`}
                ListEmptyComponent={
                    workoutHistoryLoading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator color={colors.accent.primary} />
                        </View>
                    ) : workoutHistoryError ? (
                        <TouchableOpacity style={styles.emptyContainer} onPress={() => void retryWorkoutHistory()}>
                            <Text style={styles.emptyTitle}>Couldn’t load workout history</Text>
                            <Text style={styles.emptySubtitle}>Tap to retry.</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="time-outline" size={fontSize[48]} color={colors.text.quaternary} />
                            </View>
                            <Text style={styles.emptyTitle}>No workout history yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Your completed workouts will appear here.{'\n'}Start your first workout to track your progress!
                            </Text>
                        </View>
                    )
                }
                contentContainerStyle={[styles.contentWrapper, { paddingBottom: spacing[20] + spacing[12] + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                onEndReached={() => {
                    if (hasMoreWorkoutHistory) void loadMoreWorkoutHistory();
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMoreWorkoutHistory
                    ? <ActivityIndicator color={colors.accent.primary} />
                    : workoutHistoryLoadMoreError
                        ? (
                            <TouchableOpacity onPress={() => void loadMoreWorkoutHistory()}>
                                <Text style={styles.emptySubtitle}>
                                    Couldn't load more workouts. Tap to retry.
                                </Text>
                            </TouchableOpacity>
                        )
                        : null}
                windowSize={5}
                removeClippedSubviews
                stickySectionHeadersEnabled
            />
        </SafeAreaView>
    );
};

export default WorkoutHistoryScreen;

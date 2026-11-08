import { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WorkoutContext } from '../../context/WorkoutContext';
import ExerciseListToggle from '../../components/ExerciseListToggle';
import { colors } from '../../../../shared/theme';
import styles from './WorkoutHistoryStyles';
import { useAppNavigation } from '../../../../shared/navigation';
import { getWorkoutMonthYear, groupWorkoutHistoryByMonth } from './workoutHistorySections';
import {
    toHistorySelectedWorkout,
    type WorkoutHistoryForSelection,
} from './workoutHistorySelection';
import { getWorkoutHistoryCardData, PREVIEW_EXERCISE_COUNT, type WorkoutHistoryCardItem } from './workoutHistoryCardData';

type HistoryWorkout = WorkoutHistoryCardItem & WorkoutHistoryForSelection & { id?: string };

const WorkoutCard = ({ item, activeWorkout, onPress }: { item: HistoryWorkout; activeWorkout?: boolean; onPress: (item: HistoryWorkout) => void }) => {
    const cardData = getWorkoutHistoryCardData(item);
    const [expanded, setExpanded] = useState(false);
    const canExpand = cardData.exercises.length > PREVIEW_EXERCISE_COUNT;
    const previewIndices = new Set(
        cardData.exercises
            .map((exercise, index) => ({ exercise, index }))
            .sort((a, b) => Number(b.exercise.hasPR) - Number(a.exercise.hasPR) || a.index - b.index)
            .slice(0, PREVIEW_EXERCISE_COUNT)
            .map(({ index }) => index),
    );
    const remainingExercises = cardData.exercises.filter((_, index) => !previewIndices.has(index));
    const hiddenPRCount = remainingExercises.filter(exercise => exercise.hasPR).length;
    const visibleExercises = expanded
        ? cardData.exercises
        : cardData.exercises.filter((_, index) => previewIndices.has(index));
    const showMoreLabel = hiddenPRCount > 0
        ? `Show ${remainingExercises.length} more · ${hiddenPRCount} ${hiddenPRCount === 1 ? 'PR' : 'PRs'}`
        : `Show ${remainingExercises.length} more exercises`;
    const toggle = () => setExpanded(value => !value);

    return (
        <View style={styles.workoutCard} testID="workout-card">
            <View>
                <View style={styles.cardHeader} testID="workout-card-header">
                    <TouchableOpacity
                        style={styles.cardHeaderTitle}
                        onPress={toggle}
                        disabled={!canExpand}
                        activeOpacity={0.7}
                        accessibilityRole={canExpand ? 'button' : undefined}
                        accessibilityState={canExpand ? { expanded } : undefined}
                        accessibilityLabel={canExpand
                            ? `${expanded ? 'Collapse' : 'Expand'} ${cardData.workoutTitle} exercises`
                            : undefined}
                    >
                        <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
                            {cardData.workoutTitle}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.repeatButton, activeWorkout && styles.repeatButtonDisabled]}
                        onPress={() => onPress(item)}
                        activeOpacity={0.7}
                        hitSlop={6}
                        disabled={!!activeWorkout}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !!activeWorkout }}
                        accessibilityLabel={activeWorkout
                            ? 'A workout is already in progress'
                            : `Repeat ${cardData.workoutTitle}`}
                    >
                        <Ionicons
                            name={activeWorkout ? 'pause-circle-outline' : 'repeat-outline'}
                            size={18}
                            color={activeWorkout ? colors.text.quaternary : colors.text.secondary}
                        />
                        <Text style={styles.repeatButtonText}>Repeat</Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={styles.statsMeta}
                    testID="workout-stats-meta"
                    accessible
                    accessibilityLabel={`${cardData.dateLabel} · ${cardData.durationMinutes} min · ${cardData.exercises.length} exercises · ${cardData.totalSets} sets${cardData.hasPRs ? ` · ${cardData.totalPRs} ${cardData.totalPRs === 1 ? 'PR' : 'PRs'}` : ''}`}
                >
                    <Text style={styles.statsMetaText} allowFontScaling>
                        {cardData.dateLabel} · {cardData.durationMinutes} min · {cardData.exercises.length} exercises · {cardData.totalSets} sets
                        {cardData.hasPRs && (
                            <Text style={styles.prText}>
                                {' · '}
                                <Ionicons name="trophy" size={12} color={colors.accent.primary} />
                                {' '}{cardData.totalPRs} {cardData.totalPRs === 1 ? 'PR' : 'PRs'}
                            </Text>
                        )}
                    </Text>
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
                            accessible
                            accessibilityLabel={`${exercise.exerciseName}, ${exercise.setCount} ${exercise.setCount === 1 ? 'set' : 'sets'}, ${exercise.setGroups.map(group => group.label).join(', ')}${exercise.hasPR ? ', personal record' : ''}`}
                        >
                            <View style={styles.exerciseContent}>
                                <View style={styles.exerciseNameRow} testID={`exercise-name-row-${i}`}>
                                    <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                                        {exercise.exerciseName}
                                    </Text>
                                </View>
                                <View
                                    style={styles.setDetails}
                                    testID={`exercise-set-details-${i}`}
                                    accessible
                                    accessibilityLabel={`Sets: ${exercise.setGroups.map(group => group.label).join(', ')}`}
                                >
                                    <Text style={styles.setDetailsText} numberOfLines={2} ellipsizeMode="tail">
                                        {exercise.setGroups.map((group, g) => {
                                            const hasRepUnit = !group.weight && group.reps.every(set => set.label.endsWith(' reps'));
                                            return (
                                                <Text key={g}>
                                                    {g > 0 && <Text style={styles.setDetailsSeparator}> · </Text>}
                                                    {group.weight && (
                                                        <Text style={group.reps.some(set => set.isPR) ? styles.setDetailsPR : undefined}>
                                                            {`${group.weight} × `}
                                                        </Text>
                                                    )}
                                                    {group.reps.map((set, setIndex) => (
                                                        <Text
                                                            key={setIndex}
                                                            testID={set.isPR ? `pr-set-${i}-${g}-${setIndex}` : undefined}
                                                            style={set.isPR ? styles.setDetailsPR : undefined}
                                                        >
                                                            {setIndex > 0 && ', '}
                                                            {hasRepUnit ? set.label.slice(0, -5) : set.label}
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
                    collapsedAccessibilityLabel={`Show ${remainingExercises.length} more exercises${hiddenPRCount > 0 ? `, including ${hiddenPRCount} personal ${hiddenPRCount === 1 ? 'record' : 'records'}` : ''}`}
                    onPress={toggle}
                />
            )}
        </View>
    );
};

const WorkoutHistoryScreen = () => {
    const navigation = useAppNavigation();
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

    const sections = useMemo(() => {
        return groupWorkoutHistoryByMonth(
            workoutHistory as unknown as HistoryWorkout[],
            workout => workout.timestamp,
        );
    }, [workoutHistory]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.heading}>Workout history</Text>
                {workoutHistoryRefreshing && <ActivityIndicator color={colors.accent.primary} />}
            </View>
            <SectionList
                style={styles.list}
                sections={sections}
                renderItem={({ item }) => (
                    <WorkoutCard item={item} activeWorkout={!!activeWorkout} onPress={handleStartWorkout} />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.monthDivider}>{title}</Text>
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
                                <Ionicons name="time-outline" size={48} color={colors.text.quaternary} />
                            </View>
                            <Text style={styles.emptyTitle}>No workout history yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Your completed workouts will appear here.{'\n'}Start your first workout to track your progress!
                            </Text>
                        </View>
                    )
                }
                contentContainerStyle={styles.contentWrapper}
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
                removeClippedSubviews={true}
                stickySectionHeadersEnabled={false}
            />
        </SafeAreaView>
    );
};

export default WorkoutHistoryScreen;

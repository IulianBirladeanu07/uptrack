import { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WorkoutContext } from '../../context/WorkoutContext';
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

const BestValue = ({ weight, reps, highlight }: { weight: string; reps: string; highlight: boolean }) => (
    <View style={styles.valueRow}>
        {weight ? (
            <>
                <Text style={[styles.valueWeight, styles.bestSetValue, highlight && styles.bestSetValuePR]}>{weight}</Text>
                <Text style={[styles.valueTimes, styles.bestSetValue, highlight && styles.bestSetValuePR]}>×</Text>
                <Text style={[styles.valueReps, styles.bestSetValue, highlight && styles.bestSetValuePR]}>{reps}</Text>
            </>
        ) : (
            <Text style={[styles.valueBodyweight, styles.bestSetValue, highlight && styles.bestSetValuePR]}>{reps}</Text>
        )}
    </View>
);

const WorkoutCard = ({ item, activeWorkout, onPress }: { item: HistoryWorkout; activeWorkout?: boolean; onPress: (item: HistoryWorkout) => void }) => {
    const cardData = getWorkoutHistoryCardData(item);
    const [expanded, setExpanded] = useState(false);
    const visibleExercises = expanded ? cardData.exercises : cardData.exercises.slice(0, PREVIEW_EXERCISE_COUNT);
    const toggle = () => setExpanded(value => !value);

    return (
        <View style={styles.workoutCard}>
            <TouchableOpacity
                onPress={toggle}
                activeOpacity={0.7}
                disabled={cardData.exercises.length === 0}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`${cardData.workoutTitle}, ${cardData.dateLabel}. ${expanded ? 'Collapse' : 'Expand'} full workout`}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.workoutTitle} numberOfLines={1}>{cardData.workoutTitle}</Text>
                    <View style={styles.headerRight}>
                        {cardData.hasPRs && (
                            <View
                                style={styles.prBadge}
                                accessible
                                accessibilityLabel={`${cardData.totalPRs} personal ${cardData.totalPRs === 1 ? 'record' : 'records'}`}
                            >
                                <Ionicons name="trophy" size={10} color={colors.accent.primary} />
                                <Text style={styles.prText}>{cardData.totalPRs}</Text>
                            </View>
                        )}
                        <View style={[styles.dateBadge, cardData.isToday && styles.dateBadgeToday]}>
                            <Text style={[styles.dateText, cardData.isToday && styles.dateTextToday]}>{cardData.dateLabel}</Text>
                        </View>
                        {cardData.exercises.length > 0 && (
                            <Ionicons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={colors.text.tertiary}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.statsMeta}>
                    <View style={styles.statsMetaItem}>
                        <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                        <Text style={styles.statsMetaText}>{cardData.durationMinutes}m</Text>
                    </View>
                    <View style={styles.statsMetaItem}>
                        <Ionicons name="layers-outline" size={12} color={colors.text.tertiary} />
                        <Text style={styles.statsMetaText}>{cardData.totalSets} sets</Text>
                    </View>
                    <View style={styles.statsMetaItem}>
                        <Ionicons name="barbell-outline" size={12} color={colors.text.tertiary} />
                        <Text style={styles.statsMetaText}>{cardData.exercises.length} exercises</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.exerciseListHeader}>
                <Text style={styles.exerciseListHeaderLabel}>EXERCISE</Text>
                <Text style={styles.exerciseListHeaderLabel}>BEST</Text>
            </View>

            <View style={styles.exercisesList}>
                {visibleExercises.map((exercise, i) => (
                    <View
                        key={`${exercise.exerciseName}-${i}`}
                        style={[styles.exerciseGroup, i < visibleExercises.length - 1 && styles.exerciseGroupDivider]}
                    >
                        <View
                            style={styles.exerciseRow}
                            accessible
                            accessibilityLabel={`${exercise.exerciseName}, ${exercise.setCount} sets, best ${exercise.bestSetLabel}${exercise.hasPR ? ', personal record' : ''}`}
                        >
                            <View style={styles.exerciseLeft}>
                                <Text style={styles.exerciseSets}>{exercise.setCount}x</Text>
                                <View style={styles.exerciseNameRow}>
                                    <Text style={styles.exerciseName} numberOfLines={1}>{exercise.exerciseName}</Text>
                                    {exercise.hasPR && <Ionicons name="trophy" size={12} color={colors.accent.primary} />}
                                </View>
                            </View>
                            <BestValue weight={exercise.best.weight} reps={exercise.best.reps} highlight={exercise.hasPR} />
                        </View>
                        {expanded && (
                            <View
                                style={styles.setChips}
                                accessible
                                accessibilityLabel={`Sets: ${exercise.setGroups.map(group => group.label).join(', ')}`}
                            >
                                {exercise.setGroups.map((group, g) => (
                                    <View key={g} style={[styles.setChip, group.isPR && styles.setChipPR]}>
                                        <Text style={[styles.setChipText, group.isPR && styles.setChipTextPR]}>{group.label}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </View>

            <View style={styles.footerRow}>
                {cardData.exercises.length > 0 ? (
                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={toggle}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={expanded ? 'Collapse full workout' : 'Show full workout'}
                    >
                        <Text style={styles.expandButtonText}>
                            {expanded ? 'Show less' : 'View full workout'}
                        </Text>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={colors.text.secondary}
                        />
                    </TouchableOpacity>
                ) : <View />}
                <TouchableOpacity
                    style={[styles.repeatButton, activeWorkout && styles.repeatButtonDisabled]}
                    onPress={() => onPress(item)}
                    activeOpacity={0.7}
                    disabled={!!activeWorkout}
                    accessibilityRole="button"
                    accessibilityLabel={activeWorkout ? 'A workout is already in progress' : `Repeat ${cardData.workoutTitle}`}
                >
                    <Ionicons
                        name={activeWorkout ? 'pause-circle-outline' : 'repeat-outline'}
                        size={14}
                        color={activeWorkout ? colors.text.quaternary : colors.accent.primary}
                    />
                    <Text style={[styles.repeatButtonText, activeWorkout && styles.repeatButtonTextDisabled]}>
                        {activeWorkout ? 'In progress' : 'Repeat'}
                    </Text>
                </TouchableOpacity>
            </View>
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
                <View style={styles.headerTrailing}>
                    {workoutHistoryRefreshing && <ActivityIndicator color={colors.accent.primary} />}
                </View>
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

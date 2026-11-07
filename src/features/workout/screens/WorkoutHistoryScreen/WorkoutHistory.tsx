import { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WorkoutContext } from '../../context/WorkoutContext';
import { colors } from '../../../../shared/theme';
import styles from './WorkoutHistoryStyles';
import { useAppNavigation } from '../../../../shared/navigation';
import {
    getWorkoutMonthYear,
    groupWorkoutHistoryByMonth,
    type WorkoutHistoryTimestamp,
} from './workoutHistorySections';
import {
    toHistorySelectedWorkout,
    type WorkoutHistoryForSelection,
} from './workoutHistorySelection';
import { getWorkoutHistoryCardData, type WorkoutHistoryCardItem } from './workoutHistoryCardData';

type HistoryWorkout = WorkoutHistoryCardItem & WorkoutHistoryForSelection;

const WorkoutCard = ({ item, activeWorkout, onPress }: { item: HistoryWorkout; activeWorkout?: boolean; onPress: (item: HistoryWorkout) => void }) => {
    const cardData = getWorkoutHistoryCardData(item);
    const [expanded, setExpanded] = useState(false);
    const visibleExercises = expanded ? cardData.exercises : cardData.exercises.slice(0, 3);

    return (
        <View style={styles.workoutCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.workoutTitle} numberOfLines={1}>{cardData.workoutTitle}</Text>
                <View style={styles.headerRight}>
                    {cardData.hasPRs && (
                        <View style={styles.prBadge}>
                            <Ionicons name="trophy" size={10} color="#FFD700" />
                            <Text style={styles.prText}>{cardData.totalPRs}</Text>
                        </View>
                    )}
                    <View style={[styles.dateBadge, cardData.isToday && styles.dateBadgeToday]}>
                        <Text style={[styles.dateText, cardData.isToday && styles.dateTextToday]}>{cardData.dateLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsMeta}>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{cardData.durationMinutes}m</Text>
                </View>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{cardData.totalSets} sets</Text>
                </View>
                <View style={styles.statsMetaItem}>
                    <Ionicons name="barbell-outline" size={12} color={colors.text.quaternary} />
                    <Text style={styles.statsMetaText}>{cardData.exercises.length} exercises</Text>
                </View>
            </View>

            <View style={styles.exerciseListHeader}>
                <Text style={styles.exerciseListHeaderLabel}>EXERCISE</Text>
                <Text style={styles.exerciseListHeaderLabel}>BEST</Text>
            </View>

            <View style={styles.exercisesList}>
                {visibleExercises.map((exercise, i) => {
                    return (
                        <View key={i}>
                            <View style={[styles.exerciseRow, !expanded && i === visibleExercises.length - 1 && styles.exerciseRowLast]}>
                                <View style={styles.exerciseLeft}>
                                    <Text style={styles.exerciseSets}>{exercise.setCount}x</Text>
                                    <Text style={styles.exerciseName} numberOfLines={1}>{exercise.exerciseName}</Text>
                                </View>
                                <View style={styles.bestSetContainer}>
                                    <Text style={[styles.bestSetValue, exercise.hasPR && styles.bestSetValuePR]}>
                                        {exercise.bestSetLabel}
                                    </Text>
                                </View>
                            </View>
                            {expanded && exercise.sets.map(set => (
                                <View key={set.number} style={styles.setDetailRow}>
                                    <Text style={styles.setDetailLabel}>Set {set.number}</Text>
                                    <Text style={[styles.setDetailValue, set.isPR && styles.bestSetValuePR]}>
                                        {set.label}{set.isPR ? ' · PR' : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    );
                })}
            </View>
            {cardData.exercises.length > 0 && (
                <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setExpanded(value => !value)}
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
                        color={colors.accent.primary}
                    />
                </TouchableOpacity>
            )}
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
                    size={16}
                    color={activeWorkout ? colors.text.quaternary : colors.accent.primary}
                />
                <Text style={[styles.repeatButtonText, activeWorkout && styles.repeatButtonTextDisabled]}>
                    {activeWorkout ? 'Workout in progress' : 'Repeat workout'}
                </Text>
            </TouchableOpacity>
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
            workoutHistory,
            workout => workout['timestamp'] as WorkoutHistoryTimestamp,
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
                sections={sections as any}
                renderItem={({ item }) => (
                    <WorkoutCard item={item} activeWorkout={!!activeWorkout} onPress={handleStartWorkout} />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.monthDivider}>{title}</Text>
                )}
                keyExtractor={(item, index) => (typeof item['id'] === 'string' && item['id'] ? item['id'] : `${getWorkoutMonthYear(item['timestamp'] as WorkoutHistoryTimestamp)}_${index}`)}
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

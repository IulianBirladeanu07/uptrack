import { useCallback, useContext, useMemo } from 'react';
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

    return (
        <TouchableOpacity
            style={[styles.workoutCard, activeWorkout && styles.workoutCardDisabled]}
            onPress={() => onPress(item)}
            activeOpacity={activeWorkout ? 1 : 0.7}
            disabled={!!activeWorkout}
        >
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
                {cardData.exercises.map((exercise, i) => {
                    return (
                        <View key={i} style={[styles.exerciseRow, i === cardData.exercises.length - 1 && styles.exerciseRowLast]}>
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
                    );
                })}
            </View>
        </TouchableOpacity>
    );
};

const WorkoutHistoryScreen = () => {
    const navigation = useAppNavigation();
    const {
        workoutHistory,
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
            <SectionList
                sections={sections as any}
                renderItem={({ item }) => (
                    <WorkoutCard
                        item={item}
                        activeWorkout={!!activeWorkout}
                        onPress={handleStartWorkout}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.monthDivider}>{title}</Text>
                )}
                keyExtractor={(item, index) => (typeof item['id'] === 'string' && item['id'] ? item['id'] : `${getWorkoutMonthYear(item['timestamp'] as WorkoutHistoryTimestamp)}_${index}`)}
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
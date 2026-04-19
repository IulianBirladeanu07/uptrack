import React, { useCallback, useMemo, useState, useContext } from 'react';
import {
    View, Text, TouchableOpacity, Modal, Pressable,
    ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import { fetchSplitsFromFirestore } from '../../handlers/WorkoutHandler';
import { WorkoutContext } from '../../context/WorkoutContext';
import { colors, spacing } from '../../../../shared/theme';
import styles from './WorkoutScreenStyles';

const DAYS_MAP = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WEEK_DAYS = [
    { key: 'monday', jsDay: 1 }, { key: 'tuesday', jsDay: 2 },
    { key: 'wednesday', jsDay: 3 }, { key: 'thursday', jsDay: 4 },
    { key: 'friday', jsDay: 5 }, { key: 'saturday', jsDay: 6 },
    { key: 'sunday', jsDay: 0 },
];

const LiveTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    React.useEffect(() => {
        const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const pad = n => (n < 10 ? '0' + n : n);
    const fmt = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;

    return <Text style={styles.resumeTimer}>{fmt}</Text>;
};

const PulseDot = () => {
    const scale = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, [scale]);

    return <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />;
};

const ExerciseRow = ({ sets, name, reps }) => (
    <View style={styles.exerciseRow}>
        <Text style={styles.exerciseSetsInline}>{sets}x</Text>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.exerciseReps}>{reps}</Text>
    </View>
);

const WorkoutStatsMeta = ({ duration, exerciseCount, totalSets }) => (
    <View style={styles.workoutStatsMeta}>
        {!!duration && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="time-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{duration}</Text>
            </View>
        )}
        {!!exerciseCount && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="barbell-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{exerciseCount} exercises</Text>
            </View>
        )}
        {!!totalSets && (
            <View style={styles.workoutMetaItem}>
                <Ionicons name="layers-outline" size={12} color={colors.text.quaternary} />
                <Text style={styles.workoutMetaText}>{totalSets} sets</Text>
            </View>
        )}
    </View>
);

const MainWorkoutCard = React.memo(({
    workoutData, onStart, onResume, onPreview,
    allExercises, isRestDay, activeWorkout, isToday, lastWorkoutStats,
    splitName, weekNumber,
}) => {
    if (isRestDay) {
        const stats = lastWorkoutStats;
        const extraCount = (stats?.exercises?.length ?? 0) - 3;

        return (
            <View style={styles.workoutCard}>
                <Text style={styles.cardEyebrow}>Rest Day</Text>
                {stats ? (
                    <>
                        <Text style={styles.workoutCardTitle}>{stats.name ?? 'Last Workout'}</Text>
                        <View style={styles.workoutMeta}>
                            <Text style={styles.metaText}>{stats.duration}</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.exerciseCount} exercises</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.totalSets} sets</Text>
                        </View>
                        <View style={styles.exerciseList}>
                            {stats.exercises.slice(0, 3).map((ex, i) => (
                                <ExerciseRow key={i} sets={ex.sets} name={ex.name} reps={ex.bestSet} />
                            ))}
                            {extraCount > 0 && (
                                <TouchableOpacity
                                    onPress={() => onPreview({
                                        name: stats.name ?? 'Last Workout',
                                        duration: stats.duration,
                                        exercises: stats.exercises.map(ex => ({
                                            exerciseName: ex.name,
                                            numSets: ex.sets,
                                            repRange: ex.bestSet ?? '',
                                        })),
                                    })}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                ) : (
                    <Text style={styles.metaText}>Let your muscles recover today.</Text>
                )}
            </View>
        );
    }

    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const totalSets = workoutData.exercises?.reduce((acc, ex) => acc + (parseInt(ex.numSets) || 0), 0) ?? 0;
    const extraCount = allExercises.length - 3;

    const eyebrowParts = ['Today', dayName];
    if (splitName) eyebrowParts.push(splitName);
    if (weekNumber) eyebrowParts.push(`Week ${weekNumber}`);
    const eyebrow = eyebrowParts.join(' · ');

    const muscleGroups = useMemo(() => {
        return [...new Set((workoutData.exercises ?? []).map(e => e.muscleGroup).filter(Boolean))];
    }, [workoutData]);

    return (
        <View style={styles.workoutCard}>
            {isToday && <Text style={styles.cardEyebrow}>{eyebrow}</Text>}

            <View style={styles.workoutTitleRow}>
                <Text style={styles.workoutCardTitle}>{workoutData.name}</Text>
                {!isToday && workoutData.day && (
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>{workoutData.day}</Text>
                    </View>
                )}
            </View>

            <WorkoutStatsMeta
                duration={workoutData.duration}
                exerciseCount={allExercises.length}
                totalSets={totalSets}
            />

            <View style={styles.exerciseListHeader}>
                <Text style={styles.exerciseListLabel}>EXERCISES</Text>
                {extraCount > 0 && (
                    <TouchableOpacity
                        onPress={() => onPreview({
                            name: workoutData.name,
                            duration: workoutData.duration,
                            exercises: workoutData.exercises,
                        })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.exerciseMore}>+{extraCount} more</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.exerciseList}>
                {allExercises.slice(0, 3).map((name, i) => (
                    <ExerciseRow
                        key={i}
                        sets={workoutData.exercises?.[i]?.numSets}
                        name={name}
                        reps={workoutData.exercises?.[i]?.repRange}
                    />
                ))}
            </View>

            {activeWorkout ? (
                <TouchableOpacity style={styles.resumeButton} onPress={onResume} activeOpacity={0.8}>
                    <View style={styles.resumeButtonLeft}>
                        <PulseDot />
                        <Text style={styles.resumeButtonText}>Resume Workout</Text>
                    </View>
                    <LiveTimer startTime={activeWorkout.startTime} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.8}>
                    <Ionicons name="play" size={14} color={colors.accent.buttonText} />
                    <Text style={styles.startButtonText}>Start Workout</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

const ThisWeekCard = React.memo(({ completedDays, schedule, onDayPress }) => {
    const today = new Date().getDay();

    const days = WEEK_DAYS.map(d => ({
        ...d,
        short: DAY_LABELS[d.jsDay],
        hasWorkout: (schedule?.[d.key]?.exercises?.length ?? 0) > 0,
        workoutData: schedule?.[d.key] ?? null,
        done: completedDays.includes(d.jsDay),
        isToday: d.jsDay === today,
    }));

    const doneCount = days.filter(d => d.done && d.hasWorkout).length;
    const totalCount = days.filter(d => d.hasWorkout).length;

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>This Week</Text>
                <Text style={styles.cardTitleRight}>{doneCount} / {totalCount}</Text>
            </View>
            <View style={styles.weekRow}>
                {days.map((d, i) => {
                    const circleStyle = d.done
                        ? styles.dayCircleDone
                        : d.isToday
                        ? styles.dayCircleToday
                        : d.hasWorkout
                        ? styles.dayCircleWorkout
                        : styles.dayCircleRest;

                    return (
                        <TouchableOpacity
                            key={i}
                            style={styles.weekCol}
                            activeOpacity={d.hasWorkout ? 0.7 : 1}
                            onPress={() => {
                                if (!d.hasWorkout || !d.workoutData) return;
                                onDayPress({
                                    name: d.workoutData.templateName ?? 'Workout',
                                    duration: d.workoutData.duration ? `${d.workoutData.duration} min` : '45 min',
                                    exercises: d.workoutData.exercises ?? [],
                                    day: d.short,
                                });
                            }}
                        >
                            <View style={[styles.dayCircle, circleStyle]}>
                                {d.done ? (
                                    <Ionicons name="checkmark" size={14} color={colors.accent.buttonText} />
                                ) : d.isToday && d.hasWorkout ? (
                                    <Text style={styles.dayCirclePlusText}>+</Text>
                                ) : d.isToday ? (
                                    <Ionicons name="play" size={9} color={colors.accent.primary} />
                                ) : (
                                    <Text style={[styles.dayCircleText, !d.hasWorkout && styles.dayCircleTextRest]}>
                                        {d.short[0]}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.weekDayLabel, d.isToday && styles.weekDayLabelToday]}>
                                {d.short}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

const UpcomingWorkoutRow = React.memo(({ workout, isLast, onPreview }) => {
    const muscleGroups = useMemo(() => {
        return [...new Set((workout.exercises ?? []).map(e => e.muscleGroup).filter(Boolean))].join(' · ');
    }, [workout]);

    return (
        <TouchableOpacity
            style={[styles.upcomingRow, isLast && styles.upcomingRowLast]}
            onPress={() => onPreview(workout)}
            activeOpacity={0.7}
        >
            <View style={styles.upcomingDayChip}>
                <Text style={styles.upcomingDayChipLabel}>{workout.day}</Text>
            </View>
            <View style={styles.upcomingInfo}>
                <View style={styles.upcomingNameRow}>
                    <Text style={styles.upcomingName} numberOfLines={1}>{workout.name}</Text>
                    <Text style={styles.upcomingDuration}>{workout.duration}</Text>
                </View>
                {muscleGroups.length > 0 && (
                    <Text style={styles.upcomingMuscles} numberOfLines={1}>{muscleGroups}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
});

const ComingUpCard = React.memo(({ upcomingWorkouts, onPreview, onViewAll }) => {
    if (!upcomingWorkouts.length) return null;

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>Up Next</Text>
                <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
                    <Text style={styles.cardTitleRight}>View all</Text>
                </TouchableOpacity>
            </View>
            {upcomingWorkouts.map((workout, i) => (
                <UpcomingWorkoutRow
                    key={i}
                    workout={workout}
                    isLast={i === upcomingWorkouts.length - 1}
                    onPreview={onPreview}
                />
            ))}
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
        const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        let lastWorkoutStats = null;

        if (workoutHistory?.length > 0) {
            const sorted = [...workoutHistory].sort((a, b) => {
                const at = a.timestamp?.toDate?.()?.getTime() ?? 0;
                const bt = b.timestamp?.toDate?.()?.getTime() ?? 0;
                return bt - at;
            });

            const last = sorted[0];
            if (last) {
                const exercises = last.exercises ?? [];
                lastWorkoutStats = {
                    name: last.workoutName ?? last.templateName ?? null,
                    duration: last.duration ?? '0:00',
                    totalSets: exercises.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0),
                    exerciseCount: exercises.length,
                    exercises: exercises.map(ex => {
                        const sets = ex.sets ?? [];
                        const bestSet = sets.reduce((best, s) => {
                            return (parseFloat(s.weight) || 0) > (parseFloat(best.weight) || 0) ? s : best;
                        }, sets[0] ?? {});
                        const weight = parseFloat(bestSet?.weight);
                        const reps = parseInt(bestSet?.reps);
                        return {
                            name: ex.exerciseName ?? ex.name ?? '',
                            sets: sets.length,
                            bestSet: weight && reps ? `${weight}kg × ${reps}` : reps ? `${reps} reps` : null,
                        };
                    }),
                };
            }

            sorted.forEach(w => {
                const d = w.timestamp?.toDate?.();
                if (!d || d < weekStart) return;
                const day = d.getDay();
                if (!completedDaysThisWeek.includes(day)) completedDaysThisWeek.push(day);
            });
        }

        return { completedDaysThisWeek, lastWorkoutStats };
    }, [workoutHistory]);

    const loadActiveSplit = useCallback(async () => {
        try {
            setLoading(true);
            const splits = await fetchSplitsFromFirestore();
            if (!splits.length) { setLoading(false); return; }

            const raw = splits[0];
            const active = {
                id: raw.id ?? raw.data?.id,
                name: raw.name ?? raw.data?.name,
                schedule: raw.schedule ?? raw.data?.schedule ?? {},
            };
            setActiveSplit(active);

            const todayIdx = new Date().getDay();
            const todayKey = DAYS_MAP[todayIdx];
            const schedule = active.schedule;
            const todayData = schedule?.[todayKey];

            setTodayWorkout(todayData?.exercises?.length > 0 ? {
                name: todayData.templateName ?? 'Workout',
                duration: todayData.duration ? `${todayData.duration} min` : '45 min',
                exercises: todayData.exercises,
            } : null);

            const upcoming = [];
            for (let i = 1; i <= 13 && upcoming.length < 2; i++) {
                const futureDay = (todayIdx + i) % 7;
                const futureKey = DAYS_MAP[futureDay];
                const w = schedule?.[futureKey];
                const exercises = w?.exercises ?? [];

                if (exercises.length > 0) {
                    upcoming.push({
                        name: w.templateName,
                        day: DAY_LABELS[futureDay],
                        exercises,
                        duration: w.duration ? `${w.duration} min` : '45 min',
                        isRest: false,
                    });
                }
            }

            setUpcomingWorkouts(upcoming);
        } catch (e) {
            console.error('Error loading split:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadActiveSplit(); }, [loadActiveSplit]));

    const isRestDay = useMemo(() => !todayWorkout?.exercises?.length, [todayWorkout]);

    const primaryWorkout = useMemo(() => {
        if (!isRestDay && todayWorkout) {
            return { workout: todayWorkout, isRestDay: false, isToday: true };
        }
        const next = upcomingWorkouts.find(w => !w.isRest);
        if (next) {
            return {
                workout: { name: next.name, duration: next.duration, exercises: next.exercises, day: next.day },
                isRestDay: false,
                isToday: false,
            };
        }
        return { workout: null, isRestDay: true, isToday: false };
    }, [isRestDay, todayWorkout, upcomingWorkouts]);

    const allExercises = useMemo(
        () => primaryWorkout?.workout?.exercises?.map(e => e.exerciseName) ?? [],
        [primaryWorkout]
    );

    const handleStartWorkout = useCallback(() => {
        navigation.navigate('StartWorkout', primaryWorkout?.workout?.exercises?.length && !primaryWorkout.isRestDay ? {
            selectedWorkout: {
                note: '',
                templateName: primaryWorkout.workout.name,
                exercises: primaryWorkout.workout.exercises,
            },
        } : undefined);
    }, [navigation, primaryWorkout]);

    const handleResumeWorkout = useCallback(() => navigation.navigate('StartWorkout'), [navigation]);

    const handlePreviewWorkout = useCallback((workout) => {
        setPreviewWorkout(workout);
        setIsModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        setPreviewWorkout(null);
    }, []);

    const handleLibraryPress = useCallback(() => navigation.navigate('WorkoutLibrary'), [navigation]);
    const handleHistoryPress = useCallback(() => navigation.navigate('WorkoutHistory'), [navigation]);

    if (loading || !primaryWorkout) {
        return (
            <ApplicationCustomScreen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                </View>
                <BottomNav />
            </ApplicationCustomScreen>
        );
    }

    return (
        <ApplicationCustomScreen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingBottom: 70 + insets.bottom,
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                }}
                showsVerticalScrollIndicator={false}
            >
                <MainWorkoutCard
                    workoutData={primaryWorkout.workout}
                    onStart={handleStartWorkout}
                    onResume={handleResumeWorkout}
                    onPreview={handlePreviewWorkout}
                    allExercises={allExercises}
                    isRestDay={primaryWorkout.isRestDay}
                    activeWorkout={activeWorkout}
                    isToday={primaryWorkout.isToday}
                    lastWorkoutStats={userStats.lastWorkoutStats}
                    splitName={activeSplit?.name}
                    weekNumber={null}
                />

                <ThisWeekCard
                    completedDays={userStats.completedDaysThisWeek}
                    schedule={activeSplit?.schedule}
                    onDayPress={handlePreviewWorkout}
                />

                <ComingUpCard
                    upcomingWorkouts={upcomingWorkouts.slice(0, 2)}
                    onPreview={handlePreviewWorkout}
                    onViewAll={handleLibraryPress}
                />

                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleLibraryPress} activeOpacity={0.7}>
                        <Ionicons name="albums-outline" size={spacing.icon} color={colors.accent.primary} />
                        <Text style={styles.quickActionText}>Library</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleHistoryPress} activeOpacity={0.7}>
                        <Ionicons name="stats-chart-outline" size={spacing.icon} color={colors.accent.primary} />
                        <Text style={styles.quickActionText}>History</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <BottomNav />

            <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={handleCloseModal}>
                <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing[4] }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                {previewWorkout?.day && (
                                    <Text style={styles.modalDayLabel}>{previewWorkout.day}</Text>
                                )}
                                <Text style={styles.modalTitle}>{previewWorkout?.name ?? 'Workout'}</Text>
                            </View>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalStatsRow}>
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>
                                    {previewWorkout?.duration?.replace(' min', 'm') ?? '0m'}
                                </Text>
                                <Text style={styles.modalStatLabel}>Time</Text>
                            </View>
                            <View style={styles.modalStatDivider} />
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>
                                    {previewWorkout?.exercises?.reduce((a, e) => a + (parseInt(e.numSets) || 0), 0) ?? 0}
                                </Text>
                                <Text style={styles.modalStatLabel}>Sets</Text>
                            </View>
                            <View style={styles.modalStatDivider} />
                            <View style={styles.modalStatItem}>
                                <Text style={styles.modalStatValue}>{previewWorkout?.exercises?.length ?? 0}</Text>
                                <Text style={styles.modalStatLabel}>Exercises</Text>
                            </View>
                        </View>

                        <ScrollView style={styles.modalExList} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalExercisesList}>
                                {previewWorkout?.exercises?.map((ex, i) => (
                                    <View
                                        key={i}
                                        style={[styles.modalExRow, i === (previewWorkout.exercises.length - 1) && styles.modalExRowLast]}
                                    >
                                        <Text style={styles.modalExSets}>{ex.numSets}x</Text>
                                        <Text style={styles.modalExName} numberOfLines={1}>{ex.exerciseName}</Text>
                                        <Text style={styles.modalExReps}>{ex.repRange}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.startButton, activeWorkout && styles.startButtonDisabled]}
                            onPress={() => {
                                if (activeWorkout) return;
                                setIsModalVisible(false);
                                navigation.navigate('StartWorkout', {
                                    selectedWorkout: {
                                        note: '',
                                        templateName: previewWorkout?.name,
                                        exercises: previewWorkout?.exercises ?? [],
                                    },
                                });
                            }}
                            disabled={!!activeWorkout}
                        >
                            {!activeWorkout && <Ionicons name="play" size={14} color={colors.accent.buttonText} />}
                            <Text style={[styles.startButtonText, activeWorkout && styles.startButtonTextDisabled]}>
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
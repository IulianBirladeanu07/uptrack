import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../../../shared/theme';
import PulseDot from '../../../../shared/components/PulseDot/PulseDot';
import type { PersistedWorkoutState, TemplateExercise } from '../../types';
import type { WorkoutSummary } from './workoutHistorySummary';
import type { WorkoutPreview } from './ComingUpCard';
import styles from './WorkoutScreenStyles';

export type WorkoutDisplayData = {
    name: string;
    duration: string;
    exercises: TemplateExercise[];
    day?: string | undefined;
};

type ExerciseRowProps = {
    sets?: string | number | null | undefined;
    name?: string | null | undefined;
    reps?: string | number | null | undefined;
    isLast: boolean;
};

type WorkoutStatsMetaProps = {
    duration?: string | number;
    exerciseCount?: number;
    totalSets?: number;
};

type MainWorkoutCardProps = {
    workoutData: WorkoutDisplayData | null;
    onStart: () => void;
    onStartAgain: () => void;
    onResume: () => void;
    onPreview: (workout: WorkoutPreview) => void;
    allExercises: string[];
    isRestDay: boolean;
    activeWorkout: PersistedWorkoutState | null;
    isToday: boolean;
    lastWorkoutStats: WorkoutSummary | null;
    todayCompletedStats: WorkoutSummary | null;
};

const LiveTimer = ({ startTime }: { startTime: number }) => {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
        const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const fmt = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;

    return <Text style={styles.resumeTimer}>{fmt}</Text>;
};


const ExerciseRow = ({ sets, name, reps, isLast }: ExerciseRowProps) => (
    <View style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}>
        <Text style={styles.exerciseSetsInline}>{sets}x</Text>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.exerciseReps}>{reps}</Text>
    </View>
);

const WorkoutStatsMeta = ({ duration, exerciseCount, totalSets }: WorkoutStatsMetaProps) => (
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
    workoutData, onStart, onStartAgain, onResume, onPreview,
    allExercises, isRestDay, activeWorkout, isToday, lastWorkoutStats, todayCompletedStats,
}: MainWorkoutCardProps) => {
    if (activeWorkout) {
        return (
            <View style={styles.workoutCard}>
                <Text style={styles.workoutCardTitle}>{activeWorkout.templateName || 'Workout'}</Text>
                <TouchableOpacity style={styles.resumeButton} onPress={onResume} activeOpacity={0.8}>
                    <PulseDot style={styles.pulseDot} />
                    <Text style={styles.resumeButtonText}>Resume Workout</Text>
                    <Text style={styles.resumeTimer}>· <LiveTimer startTime={activeWorkout.startTime} /></Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isToday && todayCompletedStats) {
        const stats = todayCompletedStats;
        const extraCount = (stats.exercises?.length ?? 0) - 3;

        return (
            <View style={styles.workoutCard}>
                <View style={styles.workoutTitleRow}>
                    <Text style={styles.workoutCardTitle}>{stats.name ?? 'Workout'}</Text>
                    <View style={styles.doneBadge}>
                        <Ionicons name="checkmark" size={11} color={colors.accent.success} />
                        <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                </View>
                <View style={styles.workoutMeta}>
                    <Text style={styles.metaText}>{stats.duration}</Text>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.metaText}>{stats.exerciseCount} exercises</Text>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.metaText}>{stats.totalSets} sets</Text>
                </View>
                <View style={styles.exerciseList}>
                    {stats.exercises.slice(0, 3).map((ex, i) => (
                        <ExerciseRow
                            key={i}
                            sets={ex.sets}
                            name={ex.name}
                            reps={ex.bestSet}
                            isLast={i === Math.min(2, stats.exercises.length - 1)}
                        />
                    ))}
                </View>
                {extraCount > 0 && (
                    <TouchableOpacity
                        onPress={() => onPreview({
                            name: stats.name ?? 'Workout',
                            duration: stats.duration,
                            exercises: stats.exercises.map(ex => ({
                                exerciseName: ex.name,
                                numSets: ex.sets,
                                repRange: ex.bestSet ?? '',
                            })),
                        })}
                        activeOpacity={0.7}
                        style={styles.exerciseMoreRow}
                    >
                        <View style={styles.exerciseMoreLine} />
                        <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                        <View style={styles.exerciseMoreLine} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.startAgainButton} onPress={onStartAgain} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={14} color={colors.text.secondary} />
                    <Text style={styles.startAgainButtonText}>Do It Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isRestDay) {
        const stats = lastWorkoutStats;
        const extraCount = (stats?.exercises?.length ?? 0) - 3;

        return (
            <View style={styles.workoutCard}>
                <Text style={styles.workoutCardTitle}>{stats ? (stats.name ?? 'Last Workout') : 'Rest Day'}</Text>
                {stats ? (
                    <>
                        <View style={styles.workoutMeta}>
                            <Text style={styles.metaText}>{stats.duration}</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.exerciseCount} exercises</Text>
                            <Text style={styles.metaSep}>·</Text>
                            <Text style={styles.metaText}>{stats.totalSets} sets</Text>
                        </View>
                        <View style={styles.exerciseList}>
                            {stats.exercises.slice(0, 3).map((ex, i) => (
                                <ExerciseRow
                                    key={i}
                                    sets={ex.sets}
                                    name={ex.name}
                                    reps={ex.bestSet}
                                    isLast={i === Math.min(2, stats.exercises.length - 1)}
                                />
                            ))}
                        </View>
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
                                style={styles.exerciseMoreRow}
                            >
                                <View style={styles.exerciseMoreLine} />
                                <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                                <View style={styles.exerciseMoreLine} />
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <Text style={styles.metaText}>Let your muscles recover today.</Text>
                )}
            </View>
        );
    }

    if (!workoutData) return null;

    const totalSets = workoutData.exercises?.reduce((acc, ex) => acc + (parseInt(String(ex.numSets ?? 0), 10) || 0), 0) ?? 0;
    const visibleExercises = allExercises.slice(0, 3);
    const extraCount = allExercises.length - 3;

    return (
        <View style={styles.workoutCard}>
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

            <View style={styles.exerciseList}>
                {visibleExercises.map((name, i) => (
                    <ExerciseRow
                        key={i}
                        sets={workoutData.exercises?.[i]?.numSets}
                        name={name}
                        reps={workoutData.exercises?.[i]?.repRange}
                        isLast={i === visibleExercises.length - 1}
                    />
                ))}
            </View>

            {extraCount > 0 && (
                <TouchableOpacity
                    onPress={() => onPreview({
                        name: workoutData.name,
                        duration: workoutData.duration,
                        exercises: workoutData.exercises,
                    })}
                    activeOpacity={0.7}
                    style={styles.exerciseMoreRow}
                >
                    <View style={styles.exerciseMoreLine} />
                    <Text style={styles.exerciseMore}>+{extraCount} more exercises</Text>
                    <View style={styles.exerciseMoreLine} />
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.startButton} onPress={onStart} activeOpacity={0.8}>
                <Ionicons name="play" size={14} color={colors.accent.buttonText} />
                <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
        </View>
    );
});

export default MainWorkoutCard;

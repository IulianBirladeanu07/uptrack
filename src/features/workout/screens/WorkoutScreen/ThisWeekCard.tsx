import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../../shared/theme';
import styles from './WorkoutScreenStyles';
import type { WorkoutPreview } from './ComingUpCard';
import {
    buildWeekDayDisplay,
    countCompletedScheduledDays,
    countScheduledWorkoutDays,
    toScheduledWorkoutPreview,
} from './thisWeekSchedule';
import type { WorkoutWeekSchedule } from './thisWeekSchedule';

type ThisWeekCardProps = {
    completedDays: number[];
    schedule: WorkoutWeekSchedule | null;
    onDayPress: (workout: WorkoutPreview) => void;
};

const ThisWeekCard = React.memo(({ completedDays, schedule, onDayPress }: ThisWeekCardProps) => {
    const days = useMemo(() => buildWeekDayDisplay(completedDays, schedule), [completedDays, schedule]);
    const doneCount = countCompletedScheduledDays(days);
    const totalCount = countScheduledWorkoutDays(days);
    const weekSummary = totalCount > 0
        ? `${doneCount} / ${totalCount}`
        : `${days.filter(day => day.done).length} logged`;

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>This Week</Text>
                <Text style={styles.cardTitleRight}>{weekSummary}</Text>
            </View>
            <View style={styles.weekRow}>
                {days.map(day => {
                    const circleStyle = day.done
                        ? styles.dayCircleDone
                        : day.isToday && day.hasWorkout
                            ? styles.dayCircleToday
                            : styles.dayCircleRest;

                    return (
                        <TouchableOpacity
                            key={day.key}
                            style={styles.weekCol}
                            activeOpacity={day.hasWorkout ? 0.7 : 1}
                            onPress={() => {
                                if (!day.hasWorkout) return;
                                const preview = toScheduledWorkoutPreview(day);
                                if (preview) onDayPress(preview);
                            }}
                        >
                            <View style={[styles.dayCircle, circleStyle]}>
                                {day.done ? (
                                    <Ionicons name="checkmark" size={14} color={colors.accent.buttonText} />
                                ) : day.isToday && day.hasWorkout ? (
                                    <Ionicons name="play" size={9} color={colors.accent.primary} />
                                ) : (
                                    <Text style={[styles.dayCircleText, !day.hasWorkout && styles.dayCircleTextRest]}>
                                        {day.short[0]}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.weekDayLabel, day.isToday && styles.weekDayLabelToday]}>
                                {day.short}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

export default ThisWeekCard;

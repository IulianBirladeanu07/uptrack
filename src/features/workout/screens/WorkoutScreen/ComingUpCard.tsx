import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { TemplateExercise } from '../../types';
import styles from './WorkoutScreenStyles';

export type WorkoutPreview = {
    name: string;
    duration: string;
    exercises: TemplateExercise[];
    day?: string;
};

export type UpcomingWorkout = WorkoutPreview & { isRest: boolean };

type UpcomingWorkoutRowProps = {
    workout: UpcomingWorkout;
    isLast: boolean;
    onPreview: (workout: WorkoutPreview) => void;
};

type ComingUpCardProps = {
    upcomingWorkouts: UpcomingWorkout[];
    onPreview: (workout: WorkoutPreview) => void;
    onViewAll: () => void;
};

const UpcomingWorkoutRow = React.memo(({ workout, isLast, onPreview }: UpcomingWorkoutRowProps) => {
    const muscleGroups = useMemo(() =>
        [...new Set((workout.exercises ?? []).map(exercise => exercise.muscleGroup).filter(Boolean))].join(' · '),
    [workout]);

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

const ComingUpCard = React.memo(({ upcomingWorkouts, onPreview, onViewAll }: ComingUpCardProps) => {
    if (!upcomingWorkouts.length) return null;

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>Up Next</Text>
                <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
                    <Text style={styles.cardTitleRight}>View all</Text>
                </TouchableOpacity>
            </View>
            {upcomingWorkouts.map((workout, index) => (
                <UpcomingWorkoutRow
                    key={index}
                    workout={workout}
                    isLast={index === upcomingWorkouts.length - 1}
                    onPreview={onPreview}
                />
            ))}
        </View>
    );
});

export default ComingUpCard;

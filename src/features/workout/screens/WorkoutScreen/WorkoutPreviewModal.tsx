import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../../../shared/theme';
import { ExercisePreviewList } from '../../components/WorkoutExercisePreview/WorkoutExercisePreview';
import type { WorkoutPreview } from './ComingUpCard';
import styles from './WorkoutScreenStyles';
import { getWorkoutPreviewStats } from './workoutPreviewSummary';

type WorkoutPreviewModalProps = {
    visible: boolean;
    workout: WorkoutPreview | null;
    bottomPadding: number;
    isWorkoutActive: boolean;
    onClose: () => void;
    onStart: () => void;
};

const WorkoutPreviewModal = ({
    visible,
    workout,
    bottomPadding,
    isWorkoutActive,
    onClose,
    onStart,
}: WorkoutPreviewModalProps) => {
    const stats = getWorkoutPreviewStats(workout);
    return (
      <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
            <View style={[styles.modalContent, { paddingBottom: bottomPadding }]}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                        {workout?.day && (
                            <Text style={styles.modalDayLabel}>{workout.day}</Text>
                        )}
                        <Text style={styles.modalTitle}>{workout?.name ?? 'Workout'}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                        <Ionicons name="close" size={16} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalStatsRow}>
                    <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatValue}>
                            {stats.durationLabel}
                        </Text>
                        <Text style={styles.modalStatLabel}>Time</Text>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatValue}>
                            {stats.totalSets}
                        </Text>
                        <Text style={styles.modalStatLabel}>Sets</Text>
                    </View>
                    <View style={styles.modalStatDivider} />
                    <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatValue}>{stats.exerciseCount}</Text>
                        <Text style={styles.modalStatLabel}>Exercises</Text>
                    </View>
                </View>

                <ScrollView style={styles.modalExList} showsVerticalScrollIndicator={false}>
                    <ExercisePreviewList exercises={workout?.exercises} />
                </ScrollView>

                <TouchableOpacity
                    style={[styles.startButton, isWorkoutActive && styles.startButtonDisabled]}
                    onPress={onStart}
                    disabled={isWorkoutActive}
                >
                    {!isWorkoutActive && <Ionicons name="play" size={14} color={colors.accent.buttonText} />}
                    <Text style={[styles.startButtonText, isWorkoutActive && styles.startButtonTextDisabled]}>
                        {isWorkoutActive ? 'Workout in Progress' : 'Start Workout'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>
    );
};

export default WorkoutPreviewModal;

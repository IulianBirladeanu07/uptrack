import { useCallback, useMemo, useState, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerImpactFeedback, triggerSelectionFeedback } from '../../../../../shared/services/hapticFeedback';
import { colors, spacing } from '../../../../../shared/theme';
import styles from './WorkoutPreviewCardStyles';

type PreviewExercise = {
  numSets?: number | string | null;
  exerciseName?: string | null;
  repRange?: string | number | null;
};

type PreviewWorkout = {
  id?: string;
  name?: string;
  templateName?: string;
  exercises?: PreviewExercise[];
  duration?: number | string;
  [key: string]: unknown;
};

type SplitDataLike = {
  schedule?: Record<string, { id?: string } | null | undefined> | null;
};

type WorkoutPreviewCardProps = {
  workout?: PreviewWorkout | null;
  onSelect?: (workout: PreviewWorkout) => void;
  selectedDay?: string | null;
  splitData?: SplitDataLike | null;
  onRemove?: (dayId: string) => void;
};

const WorkoutPreviewCardContent = ({
  workout,
  onSelect,
  selectedDay,
  splitData,
  onRemove,
}: WorkoutPreviewCardProps & { workout: PreviewWorkout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const buttonScaleAnimation = useRef(new Animated.Value(1)).current;

  const isAssigned = useMemo(() => {
    const schedule = splitData?.schedule;
    if (!schedule) return null;
    return Object.keys(schedule).find(day =>
      schedule[day]?.id === workout.id
    ) ?? null;
  }, [splitData?.schedule, workout.id]);

  const animationConfig = {
    duration: 250,
    update: { type: LayoutAnimation.Types.easeInEaseOut, duration: 250 },
  };

  const exercises = workout.exercises ?? [];

  const handleToggleExpand = useCallback(() => {
    if (!exercises.length) return;

    void triggerSelectionFeedback();

    LayoutAnimation.configureNext(animationConfig);
    setIsExpanded(prev => !prev);

    if (isExpanded) {
      setShowAllExercises(false);
    }
  }, [isExpanded, exercises.length]);

  const handleQuickAdd = useCallback((event: { stopPropagation: () => void }) => {
    event.stopPropagation();

    if (onSelect && selectedDay && !isAssigned) {
      void triggerImpactFeedback(Haptics.ImpactFeedbackStyle.Light);

      onSelect(workout);

      Animated.sequence([
        Animated.timing(buttonScaleAnimation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScaleAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [selectedDay, onSelect, workout, isAssigned, buttonScaleAnimation]);

  const handleRemoveFromDay = useCallback((event: { stopPropagation: () => void }) => {
    event.stopPropagation();

    if (!onRemove || !isAssigned) return;

    void triggerImpactFeedback(Haptics.ImpactFeedbackStyle.Light);

    onRemove(isAssigned);
    LayoutAnimation.configureNext(animationConfig);

    Animated.sequence([
      Animated.timing(buttonScaleAnimation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [onRemove, isAssigned, buttonScaleAnimation]);

  const handleShowMoreExercises = useCallback(() => {
    LayoutAnimation.configureNext(animationConfig);
    setShowAllExercises(prev => !prev);
  }, []);

  const totalSets = useMemo(() => {
    return exercises?.reduce((total, exercise) => total + (parseInt(String(exercise.numSets ?? 0), 10) || 0), 0) || 0;
  }, [exercises]);

  const estimatedDuration = useMemo(
    () => workout.duration || Math.ceil(totalSets * 2.5 + (exercises.length * 1.5)),
    [workout.duration, totalSets, exercises.length]
  );

  const isRestDay = workout.templateName?.toLowerCase() === 'rest';
  const canAdd = !isAssigned && selectedDay && !isRestDay;
  const hasExercises = exercises.length > 0;

  const exercisesToShow = useMemo(() => {
    if (!exercises.length) return [];
    if (showAllExercises) return exercises;
    return exercises.slice(0, 4);
  }, [exercises, showAllExercises]);

  const hasMoreExercises = exercises.length > 4;

  return (
    <View style={[styles.workoutCard, isAssigned && styles.workoutCardAssigned]}>
      <TouchableOpacity
        activeOpacity={hasExercises ? 0.85 : 1}
        onPress={hasExercises ? handleToggleExpand : undefined}
        style={styles.cardHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.workoutName} numberOfLines={1}>
                {workout.templateName || 'Unnamed Workout'}
              </Text>
            </View>
            {!isRestDay ? (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                  <Text style={styles.metaText}>{estimatedDuration}m</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                  <Text style={styles.metaText}>{exercises.length || 0} exercises</Text>
                </View>
                {totalSets > 0 && (
                  <>
                    <View style={styles.metaDivider} />
                    <Text style={styles.metaText}>{totalSets} sets</Text>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.restMeta}>
                <Ionicons name="moon-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.metaText}>Rest day</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {canAdd && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnimation }] }}>
              <TouchableOpacity
                style={[styles.selectionButton, styles.addButton]}
                onPress={handleQuickAdd}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={spacing.iconSm} color={colors.text.tertiary} />
              </TouchableOpacity>
            </Animated.View>
          )}
          {isAssigned && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnimation }] }}>
              <TouchableOpacity
                style={[styles.selectionButton, styles.removeButton]}
                onPress={handleRemoveFromDay}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="checkmark" size={spacing.iconSm} color={colors.accent.success} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && hasExercises && (
        <View style={styles.expandedContent}>
          {exercisesToShow.map((exercise, index) => (
            <View
              key={index}
              style={[
                styles.exerciseRow,
                index === exercisesToShow.length - 1 && !hasMoreExercises && styles.exerciseRowLast,
              ]}
            >
              <Text style={styles.exerciseSetsInline}>{exercise.numSets}x</Text>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.exerciseName || 'Unknown Exercise'}
              </Text>
              <Text style={styles.exerciseReps}>{exercise.repRange || 'N/A'}</Text>
            </View>
          ))}
          {hasMoreExercises && (
            <TouchableOpacity onPress={handleShowMoreExercises} activeOpacity={0.7} style={styles.showMoreRow}>
              <View style={styles.showMoreLine} />
              <Text style={styles.showMoreText}>
                {showAllExercises ? 'Show less' : `+${exercises.length - 4} more exercises`}
              </Text>
              <View style={styles.showMoreLine} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const WorkoutPreviewCard = memo((props: WorkoutPreviewCardProps) => (
  props.workout ? <WorkoutPreviewCardContent {...props} workout={props.workout} /> : null
));

export default WorkoutPreviewCard;
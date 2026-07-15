import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Haptics } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../../../shared/theme';
import styles from './WorkoutPreviewCardStyles';
import { workoutColors } from '../constants/CreateSplitScreenConstants';

const WorkoutPreviewCard = React.memo(({
  workout,
  onSelect,
  selectedDay,
  colorIndex,
  splitData,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const buttonScaleAnimation = useRef(new Animated.Value(1)).current;

  const getWorkoutVisualization = useCallback((wk) => {
    const isRest = wk.templateName?.toLowerCase() === 'rest';
    if (isRest) {
      return workoutColors.find(c => c.category === 'rest') || { bg: colors.faded.surfaceMedium, text: colors.text.quaternary, icon: 'bed' };
    }
    const workoutName = (wk.templateName || '').toLowerCase();
    const muscleGroups = (wk.exercises || []).map(ex => (ex.muscleGroup || '').toLowerCase()).join(' ');

    if (workoutName.includes('cardio') || muscleGroups.includes('cardio')) {
      return workoutColors.find(c => c.category === 'cardio') || { bg: colors.accent.blue, text: colors.text.primary, icon: 'bicycle' };
    }
    if (workoutName.includes('hiit') || workoutName.includes('circuit')) {
      return workoutColors.find(c => c.category === 'hiit') || { bg: colors.accent.amber, text: colors.text.primary, icon: 'flame' };
    }
    if (workoutName.includes('yoga') || workoutName.includes('stretch')) {
      return workoutColors.find(c => c.category === 'recovery') || { bg: colors.accent.success, text: colors.text.primary, icon: 'yoga' };
    }
    if (workoutName.includes('functional') || muscleGroups.includes('functional')) {
      return workoutColors.find(c => c.category === 'functional') || { bg: colors.accent.purple, text: colors.text.primary, icon: 'walk' };
    }
    return workoutColors[colorIndex % workoutColors.length] || { bg: colors.accent.primary, text: colors.text.primary, icon: 'barbell' };
  }, [colorIndex]);

  const workoutVisualization = useMemo(() => getWorkoutVisualization(workout), [getWorkoutVisualization, workout]);

  const isAssigned = useMemo(() => {
    if (!splitData?.schedule) return null;
    return Object.keys(splitData.schedule).find(day =>
      splitData.schedule[day]?.id === workout.id
    );
  }, [splitData?.schedule, workout.id]);

  const animationConfig = {
    duration: 250,
    update: { type: LayoutAnimation.Types.easeInEaseOut, duration: 250 },
  };

  const handleToggleExpand = useCallback(() => {
    if (!workout.exercises?.length) return;

    if (Haptics?.selectionAsync) {
      Haptics.selectionAsync();
    }

    LayoutAnimation.configureNext(animationConfig);
    setIsExpanded(prev => !prev);

    if (isExpanded) {
      setShowAllExercises(false);
    }

    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnimation, workout.exercises?.length]);

  const handleQuickAdd = useCallback((event) => {
    event.stopPropagation();

    if (onSelect && selectedDay && !isAssigned) {
      if (Haptics?.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onSelect(workout);

      Animated.sequence([
        Animated.timing(buttonScaleAnimation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScaleAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [selectedDay, onSelect, workout, isAssigned, buttonScaleAnimation]);

  const handleRemoveFromDay = useCallback((event) => {
    event.stopPropagation();

    if (!onRemove || !isAssigned) return;

    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

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

  if (!workout) return null;

  const totalSets = useMemo(() => {
    return workout.exercises?.reduce((total, exercise) => total + (parseInt(exercise.numSets) || 0), 0) || 0;
  }, [workout.exercises]);

  const estimatedDuration = useMemo(
    () => workout.duration || Math.ceil(totalSets * 2.5 + (workout.exercises?.length * 1.5)),
    [workout.duration, totalSets, workout.exercises?.length]
  );

  const isRestDay = workout.templateName?.toLowerCase() === 'rest';
  const canAdd = !isAssigned && selectedDay && !isRestDay;
  const hasExercises = workout.exercises?.length > 0;

  const chevronRotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const exercisesToShow = useMemo(() => {
    if (!workout.exercises?.length) return [];
    if (showAllExercises) return workout.exercises;
    return workout.exercises.slice(0, 4);
  }, [workout.exercises, showAllExercises]);

  const hasMoreExercises = workout.exercises?.length > 4;

  return (
    <View style={[styles.workoutCard, isAssigned && styles.workoutCardAssigned]}>
      <TouchableOpacity
        activeOpacity={hasExercises ? 0.85 : 1}
        onPress={hasExercises ? handleToggleExpand : undefined}
        style={styles.cardHeader}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.workoutIcon, { backgroundColor: workoutVisualization.bg }]}>
            <Ionicons
              name={workoutVisualization.icon}
              size={spacing.iconMd}
              color={workoutVisualization.text}
            />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.workoutName} numberOfLines={1}>
                {workout.templateName || 'Unnamed Workout'}
              </Text>
              {isAssigned && (
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedText}>Assigned</Text>
                </View>
              )}
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
                  <Text style={styles.metaText}>{workout.exercises?.length || 0} exercises</Text>
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
                style={styles.addButton}
                onPress={handleQuickAdd}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={spacing.iconMd} color={colors.accent.primary} />
              </TouchableOpacity>
            </Animated.View>
          )}
          {isAssigned && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnimation }] }}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveFromDay}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="checkmark" size={spacing.iconSm} color={colors.accent.success} />
              </TouchableOpacity>
            </Animated.View>
          )}
          {hasExercises && (
            <View style={styles.chevronButton}>
              <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                <Ionicons name="chevron-down" size={spacing.iconSm} color={colors.text.quaternary} />
              </Animated.View>
            </View>
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
                {showAllExercises ? 'Show less' : `+${workout.exercises.length - 4} more exercises`}
              </Text>
              <View style={styles.showMoreLine} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

export default WorkoutPreviewCard;
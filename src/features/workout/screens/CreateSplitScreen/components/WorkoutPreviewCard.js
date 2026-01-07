import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Haptics } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles from './WorkoutPreviewCardStyles';
import { workoutColors, daysOfWeek } from '../constants/CreateSplitScreenConstants';

const colors = {
  bg: '#0A0E13',
  primary: '#FF9500',
  textPrimary: '#F9FAFB',
  textTertiary: '#6B7280',
};

const WorkoutPreviewCard = React.memo(({
  workout,
  onSelect,
  selectedDay,
  colorIndex,
  splitData,
  onRemove,
  isRotationSchedule = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const buttonScaleAnimation = useRef(new Animated.Value(1)).current;
  const footerFadeAnimation = useRef(new Animated.Value(1)).current;

  const getWorkoutVisualization = useCallback((wk) => {
    const isRest = wk.templateName?.toLowerCase() === 'rest';
    if (isRest) {
      return workoutColors.find(c => c.category === 'rest') || { bg: 'rgba(107, 114, 128, 0.2)', text: colors.textPrimary, icon: 'bed' };
    }
    const workoutName = (wk.templateName || '').toLowerCase();
    const muscleGroups = (wk.exercises || []).map(ex => (ex.muscleGroup || '').toLowerCase()).join(' ');

    if (workoutName.includes('cardio') || muscleGroups.includes('cardio')) {
      return workoutColors.find(c => c.category === 'cardio') || { bg: '#3B82F6', text: '#FFFFFF', icon: 'bicycle' };
    }
    if (workoutName.includes('hiit') || workoutName.includes('circuit')) {
      return workoutColors.find(c => c.category === 'hiit') || { bg: '#F59E0B', text: '#FFFFFF', icon: 'flame' };
    }
    if (workoutName.includes('yoga') || workoutName.includes('stretch')) {
      return workoutColors.find(c => c.category === 'recovery') || { bg: '#10B981', text: '#FFFFFF', icon: 'yoga' };
    }
    if (workoutName.includes('functional') || muscleGroups.includes('functional')) {
      return workoutColors.find(c => c.category === 'functional') || { bg: '#8B5CF6', text: '#FFFFFF', icon: 'walk' };
    }
    return workoutColors[colorIndex % workoutColors.length] || { bg: colors.primary, text: colors.textPrimary, icon: 'barbell' };
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

    Animated.timing(fadeAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(footerFadeAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnimation, fadeAnimation, footerFadeAnimation, workout.exercises?.length]);

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

  const getDayDisplayName = useCallback((dayId) => {
    if (isRotationSchedule) {
      return `Day ${dayId}`;
    } else {
      const dayInfo = daysOfWeek.find(d => d.id === dayId);
      return dayInfo?.name || 'day';
    }
  }, [isRotationSchedule]);

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

  const cardStyles = useMemo(() => {
    const baseStyles = [styles.workoutCard, { transform: [{ scale: scaleAnimation }] }];
    if (isAssigned && isExpanded) {
      baseStyles.push(styles.workoutCardAssignedExpanded);
    } else if (isAssigned) {
      baseStyles.push(styles.workoutCardAssigned);
    } else if (isExpanded) {
      baseStyles.push(styles.workoutCardExpanded);
    }
    return baseStyles;
  }, [isAssigned, isExpanded, scaleAnimation]);

  return (
    <Animated.View style={cardStyles}>
      <TouchableOpacity
        activeOpacity={hasExercises ? 0.95 : 1}
        onPress={hasExercises ? handleToggleExpand : undefined}
        style={styles.cardContainer}
        delayPressIn={50}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.workoutIcon, { backgroundColor: workoutVisualization.bg }]}>
              <Ionicons
                name={workoutVisualization.icon}
                size={normalize(22)}
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
                    <Text style={styles.assignedText}>ASSIGNED</Text>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                {!isRestDay ? (
                  <>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={normalize(12)} color={colors.textTertiary} />
                      <Text style={styles.metaText}>{estimatedDuration}m</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons name="fitness-outline" size={normalize(12)} color={colors.textTertiary} />
                      <Text style={styles.metaText}>{workout.exercises?.length || 0} exercises</Text>
                    </View>
                    {totalSets > 0 && (
                      <>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                          <Text style={styles.metaText}>{totalSets} sets</Text>
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  <View style={styles.restMeta}>
                    <Ionicons name="moon-outline" size={normalize(12)} color={colors.textPrimary} />
                    <Text style={[styles.metaText, { color: colors.textPrimary }]}>Rest day</Text>
                  </View>
                )}
              </View>
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
                  <Ionicons
                    name="add"
                    size={normalize(20)}
                    color={colors.primary}
                  />
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
                  <Ionicons
                    name="checkmark"
                    size={normalize(18)}
                    color="#10b981"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && hasExercises && (
        <Animated.View style={[styles.expandedContent, { opacity: fadeAnimation }]}>
          <View style={styles.exerciseList}>
            {exercisesToShow.map((exercise, index) => (
              <View
                key={index}
                style={[
                  styles.exerciseRow,
                  index === exercisesToShow.length - 1 && !hasMoreExercises && styles.exerciseRowLast
                ]}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exercise.exerciseName || 'Unknown Exercise'}
                  </Text>
                  <Text style={styles.exerciseMuscle}>{exercise.muscleGroup}</Text>
                </View>
                <View style={styles.exerciseStats}>
                  <Text style={styles.exerciseStatsText}>
                    {exercise.numSets} × {exercise.repRange || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
            {hasMoreExercises && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={handleShowMoreExercises}
                activeOpacity={0.8}
              >
                <Text style={styles.showMoreText}>
                  {showAllExercises
                    ? 'Show less'
                    : `Show ${workout.exercises.length - 4} more exercises`
                  }
                </Text>
                <Ionicons
                  name={showAllExercises ? "chevron-up" : "chevron-down"}
                  size={normalize(12)}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
});

export default WorkoutPreviewCard;
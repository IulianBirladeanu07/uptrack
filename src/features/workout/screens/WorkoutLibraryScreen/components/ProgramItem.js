import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';
import styles, { COLORS } from '../WorkoutLibraryScreenStyle';

const ProgramItem = React.memo(({ item, expandedCards, onToggleExpanded, onEdit, onActivate, onViewSchedule, isActive }) => {
  const split = item;
  const splitId = split.id;
  const isExpanded = expandedCards[splitId];

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const schedule = split.schedule || {};

  const activeDays = Object.values(schedule).filter(day => day?.exercises?.length > 0).length;
  const totalExercises = Object.values(schedule).reduce((total, day) => total + (day?.exercises?.length || 0), 0);
  const durationWeeks = split.durationWeeks || 8;

  const workoutDays = useMemo(() => {
    return dayOrder
      .map(dayName => [dayName, schedule[dayName]])
      .filter(([day, workout]) => workout?.exercises?.length > 0)
      .slice(0, isExpanded ? 7 : 3);
  }, [schedule, isExpanded, dayOrder]);

  const hasMoreThanThreeDays = Object.values(schedule).filter(day => day?.exercises?.length > 0).length > 3;

  return (
    <View style={[styles.workoutCard, isActive && styles.activeCard]}>
      {isActive && (
        <View style={styles.activeBadgeCorner}>
          <Text style={styles.activeBadgeText}>ACTIVE</Text>
        </View>
      )}
      <View style={styles.workoutCardHeader}>
        <Text style={styles.workoutTitleLarge}>{split.name || split.templateName || 'Workout Split'}</Text>
        <View style={styles.workoutMetrics}>
          <View style={styles.metricItem}>
            <Ionicons name="calendar-outline" size={normalize(16)} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{activeDays} days</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="fitness" size={normalize(16)} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{totalExercises} exercises</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={normalize(16)} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{durationWeeks} weeks</Text>
          </View>
        </View>
      </View>

      {workoutDays.length > 0 && (
        <View style={styles.exerciseList}>
          {workoutDays.map(([dayName, workout], index) => {
            const exerciseCount = workout?.exercises?.length || 0;
            const duration = workout?.duration || 45;
            const isLastItem = index === workoutDays.length - 1;

            return (
              <View key={dayName} style={[styles.exerciseItem, isLastItem && styles.exerciseItemLast]}>
                <View style={styles.exerciseImageContainer}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={normalize(20)}
                    color={COLORS.cyan}
                  />
                </View>
                <View style={styles.exerciseDetails}>
                  <View style={styles.exerciseInfoContainer}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                    </Text>
                    <Text style={styles.exerciseMuscleGroup}>
                      {workout?.templateName || workout?.name || 'Training Session'}
                    </Text>
                  </View>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.setReps}>{exerciseCount} exercises</Text>
                    <Text style={styles.exerciseMetaSmall}>{workout.duration}m</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {hasMoreThanThreeDays && (
            <TouchableOpacity style={styles.showMore} onPress={() => onToggleExpanded(splitId)}>
              <Text style={styles.showMoreText}>
                {isExpanded ? 'Show less ↑' : `+${activeDays - 3} more ↓`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.workoutActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(split)}>
          <Ionicons name="create-outline" size={normalize(16)} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton} onPress={() => onViewSchedule(split)}>
          <Ionicons name="calendar-outline" size={normalize(16)} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={() => onActivate(split)}>
          <Ionicons
            name={isActive ? 'checkmark-circle' : 'play'}
            size={normalize(18)}
            color={COLORS.bg}
          />
          <Text style={styles.startButtonText}>{isActive ? 'Active' : 'Activate'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default ProgramItem;
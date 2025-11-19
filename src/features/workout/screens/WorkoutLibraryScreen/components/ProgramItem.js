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
    <View style={[styles.workoutCard, isActive && { borderColor: COLORS.accentPrimary, borderWidth: normalize(2) }]}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutHeaderLeft}>
          <View style={styles.titleContainer}>
            <Text style={styles.workoutTitle}>{split.name || split.templateName || 'Workout Split'}</Text>
            {isActive && (
              <View style={[styles.categoryTagContainer, { marginLeft: normalize(8), backgroundColor: COLORS.accentPrimary }]}>
                <Text style={[styles.categoryTag, { color: COLORS.secondary }]}>ACTIVE</Text>
              </View>
            )}
          </View>
          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={normalize(14)} color={COLORS.textSecondary} />
              <Text style={styles.metaItemText}>{activeDays} days</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={normalize(14)} color={COLORS.textSecondary} />
              <Text style={styles.metaItemText}>{totalExercises} exercises</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={normalize(14)} color={COLORS.textSecondary} />
              <Text style={styles.metaItemText}>{durationWeeks} weeks</Text>
            </View>
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
                    color={COLORS.accentSecondary}
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
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.setReps}>{exerciseCount} exercises</Text>
                    <Text style={[styles.exerciseMuscleGroup, { fontSize: normalize(11) }]}>{duration} min</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {hasMoreThanThreeDays && (
            <TouchableOpacity style={styles.showMore} onPress={() => onToggleExpanded(splitId)}>
              <Text style={styles.showMoreText}>
                {isExpanded ? 'Show less days ↑' : `Show ${activeDays - 3} more days ↓`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.workoutActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(split)}>
          <Ionicons name="create-outline" size={normalize(18)} color={COLORS.textSecondary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton} onPress={() => onViewSchedule(split)}>
          <Ionicons name="calendar-outline" size={normalize(18)} color={COLORS.textSecondary} />
          <Text style={styles.editButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.startButton, { flex: 1.5 }]} onPress={() => onActivate(split)}>
          <Ionicons
            name={isActive ? 'checkmark-circle' : 'play'}
            size={normalize(20)}
            color={COLORS.secondary}
          />
          <Text style={styles.startButtonText}>{isActive ? 'Active Split' : 'Set Active'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default ProgramItem;
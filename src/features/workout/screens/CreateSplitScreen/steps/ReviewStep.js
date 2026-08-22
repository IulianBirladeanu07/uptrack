// src/features/workout/screens/CreateSplitScreen/steps/ReviewStep.js
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../../../../shared/theme';
import { MUSCLE_GROUP_COLORS, FALLBACK_MUSCLE_COLORS } from '../../../../../shared/theme/constants';
import styles from './ReviewStepStyles';
import { daysOfWeek } from '../constants/CreateSplitScreenConstants';

const MAJOR_MUSCLE_GROUPS = ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'];

const ReviewStep = ({ splitData, setCurrentStep }) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const [selectedDay, setSelectedDay] = useState(null);

  const isWeeklySchedule = splitData.type === 'weekly';
  const isRotationSchedule = splitData.type === 'rotation';

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const scheduleDays = useMemo(() => {
    if (isWeeklySchedule) {
      return daysOfWeek;
    } else if (isRotationSchedule) {
      const schedule = splitData.schedule || {};
      const existingNumbers = Object.keys(schedule)
        .map(key => parseInt(key))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

      const dayCount = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

      return Array.from({ length: dayCount }, (_, i) => ({
        id: `${i + 1}`,
        name: `Day ${i + 1}`,
        shortLabel: `${i + 1}`,
      }));
    }
    return [];
  }, [isWeeklySchedule, isRotationSchedule, splitData.schedule]);

  useEffect(() => {
    if (scheduleDays.length > 0 && !scheduleDays.some(day => day.id === selectedDay)) {
      setSelectedDay(scheduleDays[0].id);
    }
  }, [scheduleDays, selectedDay]);

  const stats = useMemo(() => {
    const schedule = splitData.schedule || {};
    const workouts = Object.values(schedule).filter(w => w !== null);
    const workoutDays = workouts.length;

    let totalDuration = 0;
    let totalSets = 0;
    let muscleGroupSets = {};

    workouts.forEach(workout => {
      totalDuration += workout.duration || 0;

      workout.exercises?.forEach(exercise => {
        const sets = parseInt(exercise.numSets) || parseInt(exercise.sets) || 0;
        totalSets += sets;

        if (exercise.muscleGroup) {
          muscleGroupSets[exercise.muscleGroup] = (muscleGroupSets[exercise.muscleGroup] || 0) + sets;
        }
      });
    });

    const muscleGroupsArray = Object.entries(muscleGroupSets)
      .sort(([, a], [, b]) => b - a)
      .map(([muscle, sets]) => ({ muscle, sets }));

    return {
      workoutDays,
      totalDuration,
      totalSets,
      muscleGroupSets: muscleGroupsArray,
    };
  }, [splitData]);

  const uncoveredMuscles = useMemo(() => {
    return MAJOR_MUSCLE_GROUPS.filter(
      muscle => !stats.muscleGroupSets.some(item => item.muscle === muscle)
    );
  }, [stats]);

  const renderHeader = () => (
    <Animated.View style={[styles.headerCard, {
      opacity: animatedValue,
      transform: [{
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      }]
    }]}>
      <LinearGradient
        colors={[colors.faded.primary, colors.faded.cyan, 'transparent']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradientOverlay}
      />

      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <Text style={styles.splitName}>{splitData.name || 'Your Training Split'}</Text>
            <Text style={styles.splitType}>
              {isWeeklySchedule ? 'Weekly Schedule' : isRotationSchedule ? 'Rotation Schedule' : 'Training Plan'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setCurrentStep(0)}
            activeOpacity={0.8}
          >
            <Feather name="edit-3" size={spacing.iconMd} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statPill}>
            <Ionicons name="fitness" size={spacing.iconSm} color={colors.accent.primary} />
            <Text style={styles.statText}>{stats.workoutDays} workouts</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="time" size={spacing.iconSm} color={colors.accent.cyan} />
            <Text style={styles.statText}>{Math.round((stats.totalDuration) / 60 * 10) / 10}h total</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="barbell" size={spacing.iconSm} color={colors.accent.successAlt} />
            <Text style={styles.statText}>{stats.totalSets} sets</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderSchedule = () => {
    const schedule = splitData.schedule || {};
    const selectedWorkout = schedule[selectedDay];
    const isRestDay = !selectedWorkout;

    const muscleGroups = selectedWorkout?.exercises
      ? [...new Set(selectedWorkout.exercises.map(ex => ex.muscleGroup))]
      : [];

    const totalDays = scheduleDays.length;
    const restDays = totalDays - stats.workoutDays;
    const trainingFrequency = totalDays > 0 ? Math.round((stats.workoutDays / totalDays) * 100) : 0;

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>
            {isWeeklySchedule ? 'Weekly Schedule' : 'Training Split'}
          </Text>
          <Text style={styles.scheduleSubtitle}>
            {isWeeklySchedule ? 'Mon - Sun Cycle' : `${scheduleDays.length} Day Cycle`}
          </Text>
        </View>

        <View style={styles.dayPillsContainer}>
          <View style={styles.dayPills}>
            {scheduleDays.map((day) => {
              const isActive = day.id === selectedDay;
              const dayWorkout = schedule[day.id];
              const dayIsRest = !dayWorkout;
              return (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayPillWrapper}
                  onPress={() => setSelectedDay(day.id)}
                >
                  <View style={[
                    styles.dayPill,
                    isActive && styles.dayPillActive,
                    dayIsRest && !isActive && styles.restDayPill
                  ]}>
                    <Text style={[
                      styles.dayPillText,
                      isActive && styles.dayPillTextActive,
                      dayIsRest && !isActive && styles.dayPillTextRest
                    ]}>
                      {day.shortLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isRestDay ? (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayTitle}>Rest & Recover</Text>
            <View style={styles.restMetrics}>
              <View style={styles.restMetric}>
                <Ionicons name="time" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.restMetricText}>Full Day Off</Text>
              </View>
              <View style={styles.restMetric}>
                <Ionicons name="walk" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.restMetricText}>Light Activity</Text>
              </View>
              <View style={styles.restMetric}>
                <Ionicons name="body" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.restMetricText}>Recovery Focus</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.currentWorkoutCard}>
            <Text style={styles.currentWorkoutTitle}>
              {selectedWorkout.templateName || `Day ${selectedDay} - Workout`}
            </Text>
            <View style={styles.workoutMetrics}>
              <View style={styles.workoutMetric}>
                <Ionicons name="time" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.workoutMetricText}>{selectedWorkout.duration || 0} min</Text>
              </View>
              <View style={styles.workoutMetric}>
                <Ionicons name="repeat" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.workoutMetricText}>{selectedWorkout.exercises?.length || 0} exercises</Text>
              </View>
              <View style={styles.workoutMetric}>
                <Ionicons name="barbell" size={spacing.iconSm} color={colors.text.quaternary} />
                <Text style={styles.workoutMetricText}>
                  {selectedWorkout.exercises?.reduce((total, ex) => total + (parseInt(ex.numSets) || 0), 0) || 0} sets
                </Text>
              </View>
            </View>

            <View style={styles.muscleGroupTags}>
              {muscleGroups.length > 0 ? muscleGroups.map((muscle, idx) => (
                <View key={idx} style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>{muscle}</Text>
                </View>
              )) : (
                <Text style={styles.muscleTagText}>No muscle groups defined</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{stats.workoutDays}</Text>
            <Text style={styles.summaryStatLabel}>Workout Days</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{restDays}</Text>
            <Text style={styles.summaryStatLabel}>Rest Days</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{trainingFrequency}%</Text>
            <Text style={styles.summaryStatLabel}>Frequency</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMuscleBalance = () => {
    const maxSets = Math.max(...stats.muscleGroupSets.map(item => item.sets), 1);

    return (
      <View style={styles.volumeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.faded.purple }]}>
              <Ionicons name="body" size={spacing.iconSm} color={colors.accent.purple} />
            </View>
            <Text style={styles.cardTitle}>Muscle Balance</Text>
          </View>
        </View>
        <Text style={styles.cardSubtext}>sets per muscle group this split</Text>

        {stats.muscleGroupSets.length > 0 ? (
          <View style={styles.volumeList}>
            {stats.muscleGroupSets.map((item, index) => {
              const color = MUSCLE_GROUP_COLORS[item.muscle] ?? FALLBACK_MUSCLE_COLORS[index % FALLBACK_MUSCLE_COLORS.length];
              return (
                <View key={item.muscle} style={styles.volumeRow}>
                  <View style={styles.volumeLabelWrap}>
                    <View style={[styles.volumeDot, { backgroundColor: color }]} />
                    <Text style={styles.volumeLabel} numberOfLines={1}>{item.muscle}</Text>
                  </View>
                  <View style={styles.volumeBarTrack}>
                    <View
                      style={[
                        styles.volumeBarFill,
                        {
                          width: `${Math.max((item.sets / maxSets) * 100, 6)}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.volumeValue}>{item.sets}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.volumeEmptyText}>No exercises added yet</Text>
        )}

        {uncoveredMuscles.length > 0 && (
          <View style={styles.coverageNote}>
            <Ionicons name="alert-circle-outline" size={spacing.iconSm} color={colors.accent.warning} />
            <Text style={styles.coverageNoteText}>
              Not targeted: {uncoveredMuscles.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}
      {renderSchedule()}
      {renderMuscleBalance()}
    </ScrollView>
  );
};

export default React.memo(ReviewStep);
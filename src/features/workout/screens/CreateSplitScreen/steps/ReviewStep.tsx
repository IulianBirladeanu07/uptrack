import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../../../shared/theme';
import styles from './ReviewStepStyles';
import DaySelector from '../components/DaySelector';
import MuscleCoverageCard from '../components/MuscleCoverageCard';
import { daysOfWeek } from '../constants/CreateSplitScreenConstants';
import { hasScheduledWorkout } from '../../../utils/splitSchedule';

const MAJOR_MUSCLE_GROUPS = ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'];

type DayWorkout = {
  id?: string;
  name?: string;
  templateName?: string;
  duration?: number | string;
  exercises?: Array<{
    exerciseName?: string;
    numSets?: number | string;
    sets?: number | string;
    muscleGroup?: string;
    repRange?: string;
  }>;
  [key: string]: unknown;
};

type SplitReviewData = {
  name?: string;
  type?: string;
  durationWeeks?: number | string;
  schedule?: Record<string, DayWorkout | null | undefined>;
  [key: string]: unknown;
};

type ReviewStepProps = {
  splitData: SplitReviewData;
  setCurrentStep: (step: number) => void;
};

const ReviewStep = ({ splitData, setCurrentStep }: ReviewStepProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const isWeeklySchedule = splitData.type === 'weekly';
  const isRotationSchedule = splitData.type === 'rotation';

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
    const workouts = Object.values(schedule).filter((w): w is DayWorkout => hasScheduledWorkout(w));
    const workoutDays = workouts.length;

    let totalDuration = 0;
    let totalSets = 0;
    let muscleGroupSets: Record<string, number> = {};

    workouts.forEach(workout => {
      totalDuration += Number(workout?.duration) || 0;

      workout.exercises?.forEach((exercise: NonNullable<DayWorkout['exercises']>[number]) => {
        const sets = parseInt(String(exercise.numSets ?? 0), 10) || parseInt(String(exercise.sets ?? 0), 10) || 0;
        totalSets += sets;

        if (exercise.muscleGroup) {
          muscleGroupSets[exercise.muscleGroup] = (muscleGroupSets[exercise.muscleGroup] || 0) + sets;
        }
      });
    });

    const muscleGroupsArray = Object.entries(muscleGroupSets)
      .sort(([, a], [, b]) => Number(b) - Number(a))
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
    <View style={styles.headerCard}>
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
          <Ionicons name="fitness" size={spacing.iconSm} color={colors.text.quaternary} />
          <Text style={styles.statText}>{stats.workoutDays} workouts</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="time" size={spacing.iconSm} color={colors.text.quaternary} />
          <Text style={styles.statText}>{Math.round((stats.totalDuration) / 60 * 10) / 10}h total</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="barbell" size={spacing.iconSm} color={colors.text.quaternary} />
          <Text style={styles.statText}>{stats.totalSets} sets</Text>
        </View>
      </View>
    </View>
  );

  const renderSchedule = () => {
    const schedule = splitData.schedule || {};
    const selectedWorkoutCandidate = schedule[selectedDay ?? ''] ?? null;
    const selectedWorkout = hasScheduledWorkout(selectedWorkoutCandidate) ? selectedWorkoutCandidate : null;
    const isRestDay = !selectedWorkout;

    const muscleGroups = selectedWorkout?.exercises
      ? [...new Set(selectedWorkout.exercises.map(ex => ex.muscleGroup))]
      : [];

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleSubtitle}>
            {isWeeklySchedule ? 'Mon - Sun Cycle' : `${scheduleDays.length} Day Cycle`}
          </Text>
        </View>

        <View style={styles.dayPillsContainer}>
          <DaySelector
            days={scheduleDays.map(day => ({
              id: day.id,
              name: day.name ?? day.id,
              shortLabel: day.shortLabel,
              hasWorkout: hasScheduledWorkout(schedule[day.id]),
            }))}
            selectedDayId={selectedDay}
            onSelectDay={setSelectedDay}
            layout="wrap"
          />
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
                <Ionicons name="moon" size={spacing.iconSm} color={colors.text.quaternary} />
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
                  {selectedWorkout.exercises?.reduce((total: number, ex: { numSets?: number | string }) => total + (parseInt(String(ex.numSets ?? 0), 10) || 0), 0) || 0} sets
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
      <MuscleCoverageCard
        muscleGroupSets={stats.muscleGroupSets}
        uncoveredMuscles={uncoveredMuscles}
        subtitle="sets per muscle group this split"
      />
    </ScrollView>
  );
};

export default React.memo(ReviewStep);
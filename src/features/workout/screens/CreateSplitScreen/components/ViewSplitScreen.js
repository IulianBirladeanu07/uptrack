import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { colors, spacing } from '../../../../../shared/theme';
import { db } from '../../../../auth/services/firebaseConfigService';
import { AuthContext } from '../../../../auth/context/AuthContext';
import { fetchSplitsFromFirestore } from '../../../handlers/WorkoutHandler';
import styles from './ViewSplitScreenStyle';
import DaySelector from './DaySelector';
import MuscleCoverageCard from './MuscleCoverageCard';

const MAJOR_MUSCLE_GROUPS = ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'];

const ViewSplitScreen = ({ route, navigation }) => {
  const { splitData } = route.params || {};
  const [split, setSplit] = useState(splitData);

  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(false);

  const { userData, refreshUserData } = useContext(AuthContext);
  const isActiveSplit = !!split?.id && userData?.activeSplitId === split.id;

  useEffect(() => {
    if (split && !selectedDay) {
      if (split.type === 'weekly') {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        setSelectedDay(dayNames[today.getDay()]);
      } else if (split.type === 'rotation') {
        const rotationDays = Object.keys(split.schedule).sort((a, b) => parseInt(a) - parseInt(b));
        if (rotationDays.length > 0) {
          setSelectedDay(rotationDays[0]);
        }
      }
    }
  }, [split, selectedDay]);

  const scheduleDays = useMemo(() => {
    if (split?.type === 'weekly') {
      return [
        { id: 'monday', name: 'Monday', shortLabel: 'M' },
        { id: 'tuesday', name: 'Tuesday', shortLabel: 'T' },
        { id: 'wednesday', name: 'Wednesday', shortLabel: 'W' },
        { id: 'thursday', name: 'Thursday', shortLabel: 'T' },
        { id: 'friday', name: 'Friday', shortLabel: 'F' },
        { id: 'saturday', name: 'Saturday', shortLabel: 'S' },
        { id: 'sunday', name: 'Sunday', shortLabel: 'S' },
      ];
    } else if (split?.type === 'rotation') {
      const dayCount = Object.keys(split.schedule).length;
      return Array.from({ length: dayCount }, (_, i) => ({
        id: `${i + 1}`,
        name: `Day ${i + 1}`,
        shortLabel: `${i + 1}`,
      }));
    }
    return [];
  }, [split]);

  const selectedDayWorkout = useMemo(() => {
    return selectedDay ? split?.schedule?.[selectedDay] : null;
  }, [selectedDay, split]);

  const compositionStats = useMemo(() => {
    const schedule = split?.schedule || {};
    const workouts = Object.values(schedule).filter(w => w !== null);
    const workoutDays = workouts.length;
    const totalDays = scheduleDays.length;
    const restDays = Math.max(totalDays - workoutDays, 0);

    let totalSets = 0;
    let totalDuration = 0;
    workouts.forEach(workout => {
      totalDuration += workout.duration || 0;
      workout.exercises?.forEach(exercise => {
        totalSets += parseInt(exercise.numSets) || parseInt(exercise.sets) || 0;
      });
    });

    return { workoutDays, restDays, totalSets, totalDuration };
  }, [split, scheduleDays]);

  const muscleGroupSets = useMemo(() => {
    const schedule = split?.schedule || {};
    const workouts = Object.values(schedule).filter(w => w !== null);
    const sets = {};

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const count = parseInt(exercise.numSets) || parseInt(exercise.sets) || 0;
        if (exercise.muscleGroup) {
          sets[exercise.muscleGroup] = (sets[exercise.muscleGroup] || 0) + count;
        }
      });
    });

    return Object.entries(sets)
      .sort(([, a], [, b]) => b - a)
      .map(([muscle, count]) => ({ muscle, sets: count }));
  }, [split]);

  const uncoveredMuscles = useMemo(() => {
    return MAJOR_MUSCLE_GROUPS.filter(
      muscle => !muscleGroupSets.some(item => item.muscle === muscle)
    );
  }, [muscleGroupSets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [splitsData] = await Promise.all([
        fetchSplitsFromFirestore(),
        refreshUserData(),
      ]);

      const match = splitsData?.find(s => (s.id || s.data?.id) === split?.id);
      if (match) {
        setSplit({
          id: match.id || match.data?.id,
          name: match.name || match.data?.name,
          templateName: match.templateName || match.data?.templateName,
          description: match.description || match.data?.description,
          type: match.type || match.data?.type,
          schedule: match.schedule || match.data?.schedule || {},
          durationWeeks: match.durationWeeks || match.data?.durationWeeks || 8,
        });
      }
    } catch (error) {
      console.error('Error refreshing split:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, [split?.id, refreshUserData]);

  const handleStartWorkout = useCallback((workout) => {
    if (!workout) return;
    navigation.navigate('StartWorkout', {
      selectedWorkout: workout,
    });
  }, [navigation]);

  const handleEditSplit = useCallback(() => {
    navigation.navigate('CreateSplit', {
      splitId: split.id,
      isEditing: true,
      returnScreen: 'ViewSplit',
    });
  }, [navigation, split]);

  const handleActivateSplit = useCallback(async () => {
    if (isActiveSplit || activating) return;

    setActivating(true);
    try {
      const schedule = split.schedule || {};
      const targetWorkouts = Object.values(schedule).filter(day => day?.exercises?.length > 0).length;
      const uid = getAuth().currentUser?.uid;

      await setDoc(doc(db, 'users', uid), {
        activeSplitId: split.id,
        targetWorkoutsPerWeek: targetWorkouts || 5,
      }, { merge: true });

      await refreshUserData();
      Alert.alert('Split Activated', `"${split.name}" is now your active split.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to activate split.');
    } finally {
      setActivating(false);
    }
  }, [split, isActiveSplit, activating, refreshUserData]);

  if (!split) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={spacing[16]} color={colors.text.quaternary} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Split data is missing</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.startButton}>
          <Text style={styles.startButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeLabel = split.type === 'weekly' ? 'Weekly Split' : split.type === 'rotation' ? 'Rotation Split' : 'Training Split';
  const cycleLabel = split.type === 'weekly' ? '7-day cycle' : `${scheduleDays.length}-day cycle`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.secondary} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={spacing.iconMd} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.splitType}>{typeLabel} · {cycleLabel}</Text>
              <Text style={styles.splitName} numberOfLines={1}>
                {split?.name || 'Training Split'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={handleEditSplit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={spacing.iconMd} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.faded.primary }]}>
                <Ionicons name="barbell" size={spacing.iconSm} color={colors.accent.primary} />
              </View>
              <Text style={styles.statValue}>{compositionStats.workoutDays}</Text>
              <Text style={styles.statLabel}>Workout Days</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.faded.surface }]}>
                <Ionicons name="moon" size={spacing.iconSm} color={colors.text.secondary} />
              </View>
              <Text style={styles.statValue}>{compositionStats.restDays}</Text>
              <Text style={styles.statLabel}>Rest Days</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.faded.cyan }]}>
                <Ionicons name="repeat" size={spacing.iconSm} color={colors.accent.cyan} />
              </View>
              <Text style={styles.statValue}>{compositionStats.totalSets}</Text>
              <Text style={styles.statLabel}>Total Sets</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.faded.error }]}>
                <Ionicons name="time" size={spacing.iconSm} color={colors.accent.warning} />
              </View>
              <Text style={styles.statValue}>{Math.round((compositionStats.totalDuration / 60) * 10) / 10}h</Text>
              <Text style={styles.statLabel}>Per Cycle</Text>
            </View>
          </View>

          {isActiveSplit ? (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={spacing.iconMd} color={colors.accent.primary} />
              <Text style={styles.activeBadgeText}>This is your active split</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.activateButton}
              onPress={handleActivateSplit}
              activeOpacity={0.8}
              disabled={activating}
            >
              <Ionicons name="flash" size={spacing.iconMd} color={colors.accent.buttonText} />
              <Text style={styles.activateButtonText}>
                {activating ? 'Activating…' : 'Set as Active Split'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
          />
        }
      >
        <View style={styles.contentContainer}>
          <MuscleCoverageCard
            muscleGroupSets={muscleGroupSets}
            uncoveredMuscles={uncoveredMuscles}
            subtitle="sets per muscle group this split"
          />

          <DaySelector
            days={scheduleDays.map(day => ({
              id: day.id,
              shortLabel: day.shortLabel,
              name: day.name,
              hasWorkout: !!split?.schedule?.[day.id],
            }))}
            selectedDayId={selectedDay}
            onSelectDay={setSelectedDay}
            layout="scroll"
            showLabels={split?.type === 'weekly'}
          />

          {selectedDayWorkout ? (
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutIconContainer}>
                  <Ionicons name="fitness" size={spacing.iconMd} color={colors.accent.primary} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{selectedDayWorkout.templateName || 'Workout'}</Text>
                  <View style={styles.workoutMeta}>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="time-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                      <Text style={styles.workoutMetaText}>{selectedDayWorkout.duration || 45}m</Text>
                    </View>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="barbell-outline" size={spacing.iconSm} color={colors.text.quaternary} />
                      <Text style={styles.workoutMetaText}>{selectedDayWorkout.exercises?.length || 0} exercises</Text>
                    </View>
                  </View>
                </View>
              </View>

              {selectedDayWorkout.exercises && selectedDayWorkout.exercises.length > 0 && (
                <View style={styles.exercisesList}>
                  {selectedDayWorkout.exercises.slice(0, 5).map((exercise, index, arr) => (
                    <View
                      key={index}
                      style={[styles.exerciseRow, index === arr.length - 1 && styles.exerciseRowLast]}
                    >
                      <Text style={styles.exerciseSetsInline}>{exercise.numSets}x</Text>
                      <Text style={styles.exerciseName} numberOfLines={1}>{exercise.exerciseName || 'Exercise'}</Text>
                      <Text style={styles.exerciseReps}>{exercise.repRange || 'N/A'}</Text>
                    </View>
                  ))}
                  {selectedDayWorkout.exercises.length > 5 && (
                    <View style={styles.moreExercisesRow}>
                      <View style={styles.moreExercisesLine} />
                      <Text style={styles.moreExercisesText}>+{selectedDayWorkout.exercises.length - 5} more exercises</Text>
                      <View style={styles.moreExercisesLine} />
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.startWorkoutButton} onPress={() => handleStartWorkout(selectedDayWorkout)} activeOpacity={0.8}>
                <Ionicons name="play" size={spacing.iconMd} color={colors.accent.buttonText} />
                <Text style={styles.startWorkoutText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.restDayCard}>
              <Ionicons name="moon" size={spacing[8]} color={colors.text.quaternary} style={styles.restDayIcon} />
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDayDescription}>Time to recover and let your muscles repair</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewSplitScreen; 
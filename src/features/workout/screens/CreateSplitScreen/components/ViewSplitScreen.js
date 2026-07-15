import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { colors, spacing } from '../../../../../shared/theme';
import styles from './ViewSplitScreenStyle';

const ViewSplitScreen = ({ route, navigation }) => {
  const { splitData } = route.params || {};
  const [split, setSplit] = useState(splitData);

  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('4weeks');

  const mockTrainingHistory = {
    totalWeeksUsed: 12,
    totalWorkoutsCompleted: 34,
    totalTimeSpent: 2890,
    currentStreak: 5,
    longestStreak: 9,
    weeklyCompletion: [
      { week: 1, completed: 3, planned: 4, completionRate: 75 },
      { week: 2, completed: 4, planned: 4, completionRate: 100 },
      { week: 3, completed: 2, planned: 4, completionRate: 50 },
      { week: 4, completed: 4, planned: 4, completionRate: 100 },
      { week: 5, completed: 3, planned: 4, completionRate: 75 },
      { week: 6, completed: 4, planned: 4, completionRate: 100 },
      { week: 7, completed: 4, planned: 4, completionRate: 100 },
      { week: 8, completed: 3, planned: 4, completionRate: 75 },
      { week: 9, completed: 4, planned: 4, completionRate: 100 },
      { week: 10, completed: 4, planned: 4, completionRate: 100 },
      { week: 11, completed: 3, planned: 4, completionRate: 75 },
      { week: 12, completed: 2, planned: 4, completionRate: 50 },
    ],
    strengthProgress: {
      'Bench Press': [
        { week: 1, weight: 80, reps: 8 },
        { week: 4, weight: 85, reps: 8 },
        { week: 8, weight: 90, reps: 8 },
        { week: 12, weight: 95, reps: 8 },
      ],
      'Squat': [
        { week: 1, weight: 100, reps: 8 },
        { week: 4, weight: 110, reps: 8 },
        { week: 8, weight: 120, reps: 8 },
        { week: 12, weight: 125, reps: 8 },
      ],
      'Deadlift': [
        { week: 1, weight: 120, reps: 5 },
        { week: 4, weight: 130, reps: 5 },
        { week: 8, weight: 140, reps: 5 },
        { week: 12, weight: 150, reps: 5 },
      ]
    },
    muscleGroupProgress: {
      'Chest': { volumeGrowth: 15, strengthGrowth: 18 },
      'Back': { volumeGrowth: 12, strengthGrowth: 22 },
      'Legs': { volumeGrowth: 20, strengthGrowth: 25 },
      'Shoulders': { volumeGrowth: 10, strengthGrowth: 15 },
      'Arms': { volumeGrowth: 8, strengthGrowth: 12 }
    },
    recentWorkouts: [
      { date: '2024-01-15', day: 'Monday', workout: 'Push Day', duration: 65, completed: true, exercises: 6 },
      { date: '2024-01-13', day: 'Saturday', workout: 'Pull Day', duration: 58, completed: true, exercises: 5 },
      { date: '2024-01-11', day: 'Thursday', workout: 'Legs', duration: 72, completed: true, exercises: 7 },
      { date: '2024-01-09', day: 'Tuesday', workout: 'Push Day', duration: 0, completed: false, exercises: 6 },
      { date: '2024-01-08', day: 'Monday', workout: 'Pull Day', duration: 61, completed: true, exercises: 5 },
    ]
  };

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

  const performanceMetrics = useMemo(() => {
    const history = mockTrainingHistory;
    const avgCompletionRate = Math.round(history.weeklyCompletion.reduce((sum, week) => sum + week.completionRate, 0) / history.weeklyCompletion.length);
    const totalHours = Math.round(history.totalTimeSpent / 60);
    const avgWorkoutDuration = Math.round(history.totalTimeSpent / history.totalWorkoutsCompleted);

    const strengthGains = Object.entries(history.strengthProgress).map(([exercise, progress]) => {
      const firstEntry = progress[0];
      const lastEntry = progress[progress.length - 1];
      const weightGain = ((lastEntry.weight - firstEntry.weight) / firstEntry.weight) * 100;
      return { exercise, gain: Math.round(weightGain) };
    });

    const avgStrengthGain = Math.round(strengthGains.reduce((sum, item) => sum + item.gain, 0) / strengthGains.length);

    return {
      avgCompletionRate,
      totalHours,
      avgWorkoutDuration,
      strengthGains,
      avgStrengthGain,
      consistencyScore: avgCompletionRate >= 80 ? 'Excellent' : avgCompletionRate >= 65 ? 'Good' : 'Needs Improvement'
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStartWorkout = useCallback((workout) => {
    if (!workout) return;
    navigation.navigate('StartWorkout', {
      selectedWorkout: workout,
      splitId: split.id,
      dayId: selectedDay,
      currentWeek,
    });
  }, [navigation, split, selectedDay, currentWeek]);

  const handleEditSplit = useCallback(() => {
    navigation.navigate('CreateSplit', {
      splitId: split.id,
      isEditing: true,
      returnScreen: 'ViewSplit',
    });
  }, [navigation, split]);

  const handleActivateSplit = useCallback(() => {
    Alert.alert(
      'Set Active Split',
      `Make "${split.name}" your active training program?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Active',
          onPress: () => {
            Alert.alert('Success', 'Split activated successfully!');
          },
        },
      ]
    );
  }, [split]);

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

  const renderHeaderAndActions = () => (
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
            <Text style={styles.splitType}>
              {mockTrainingHistory.totalWeeksUsed} weeks · {performanceMetrics.consistencyScore}
            </Text>
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
              <Ionicons name="checkmark-circle" size={spacing.iconSm} color={colors.accent.primary} />
            </View>
            <Text style={styles.statValue}>{mockTrainingHistory.totalWorkoutsCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.faded.primaryLight }]}>
              <Ionicons name="trending-up" size={spacing.iconSm} color={colors.accent.primaryAlt} />
            </View>
            <Text style={styles.statValue}>+{performanceMetrics.avgStrengthGain}%</Text>
            <Text style={styles.statLabel}>Strength</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.faded.error }]}>
              <Ionicons name="flame" size={spacing.iconSm} color={colors.accent.warning} />
            </View>
            <Text style={styles.statValue}>{mockTrainingHistory.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.faded.cyan }]}>
              <Ionicons name="time" size={spacing.iconSm} color={colors.accent.cyan} />
            </View>
            <Text style={styles.statValue}>{performanceMetrics.totalHours}h</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.tabActive]} onPress={() => setActiveTab('overview')} activeOpacity={0.7}>
        <Ionicons name="analytics" size={spacing.icon} color={activeTab === 'overview' ? colors.accent.buttonText : colors.text.quaternary} />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'progress' && styles.tabActive]} onPress={() => setActiveTab('progress')} activeOpacity={0.7}>
        <Ionicons name="trending-up" size={spacing.icon} color={activeTab === 'progress' ? colors.accent.buttonText : colors.text.quaternary} />
        <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>Progress</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && styles.tabActive]} onPress={() => setActiveTab('schedule')} activeOpacity={0.7}>
        <Ionicons name="calendar" size={spacing.icon} color={activeTab === 'schedule' ? colors.accent.buttonText : colors.text.quaternary} />
        <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Schedule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewContent = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Training Performance</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.avgCompletionRate}%</Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.avgWorkoutDuration}m</Text>
            <Text style={styles.metricLabel}>Avg Time</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{mockTrainingHistory.longestStreak}d</Text>
            <Text style={styles.metricLabel}>Best Streak</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{mockTrainingHistory.totalWorkoutsCompleted}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>Weekly Completion (Last 8 Weeks)</Text>
        <View style={styles.chartBars}>
          {mockTrainingHistory.weeklyCompletion.slice(-8).map((week, index, arr) => (
            <View key={week.week} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(week.completionRate, 6)}%` },
                  index !== arr.length - 1 && styles.barDim,
                ]}
              />
              <Text style={styles.barLabel}>W{week.week}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {mockTrainingHistory.recentWorkouts.slice(0, 5).map((workout, index, arr) => (
          <View key={index} style={[styles.activityItem, index === arr.length - 1 && styles.activityItemLast]}>
            <View style={[
              styles.activityIcon,
              { backgroundColor: workout.completed ? colors.faded.primary : colors.faded.errorAlt }
            ]}>
              <Ionicons
                name={workout.completed ? "checkmark" : "close"}
                size={spacing.iconSm}
                color={workout.completed ? colors.accent.primary : colors.accent.errorAlt}
              />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{workout.workout}</Text>
                <Text style={styles.activityDate}>{workout.date}</Text>
              </View>
              <Text style={styles.activityMeta}>
                {workout.completed
                  ? `${workout.duration} min • ${workout.exercises} exercises`
                  : 'Skipped workout'
                }
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.activateButton}
        onPress={handleActivateSplit}
        activeOpacity={0.8}
      >
        <Ionicons name="flash" size={spacing.iconMd} color={colors.accent.buttonText} />
        <Text style={styles.activateButtonText}>Continue Training</Text>
      </TouchableOpacity>
    </>
  );

  const renderProgressContent = () => (
    <>
      <View style={styles.timeSelector}>
        {[
          { id: '4weeks', label: '4 Weeks' },
          { id: '12weeks', label: '12 Weeks' },
          { id: 'all', label: 'All Time' }
        ].map(period => (
          <TouchableOpacity
            key={period.id}
            style={[styles.timePeriodButton, selectedTimeframe === period.id && styles.timePeriodActive]}
            onPress={() => setSelectedTimeframe(period.id)}
          >
            <Text style={[styles.timePeriodText, selectedTimeframe === period.id && styles.timePeriodTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Strength Progress</Text>
        {performanceMetrics.strengthGains.map((item, index) => (
          <View key={index} style={styles.strengthItem}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthExercise}>{item.exercise}</Text>
              <Text style={styles.strengthGain}>+{item.gain}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(item.gain * 2, 100)}%` }
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Muscle Group Development</Text>
        {Object.entries(mockTrainingHistory.muscleGroupProgress).map(([muscle, progress]) => (
          <View key={muscle} style={styles.muscleProgressItem}>
            <Text style={styles.muscleProgressName}>{muscle}</Text>
            <View style={styles.muscleProgressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatLabel}>Volume</Text>
                <Text style={styles.progressStatValue}>+{progress.volumeGrowth}%</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatLabel}>Strength</Text>
                <Text style={styles.progressStatValue}>+{progress.strengthGrowth}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderScheduleContent = () => (
    <>
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
          {scheduleDays.map((day) => {
            const isSelected = selectedDay === day.id;
            const hasWorkout = split?.schedule?.[day.id];

            return (
              <TouchableOpacity
                key={day.id}
                style={styles.dayColumn}
                onPress={() => setSelectedDay(day.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.dayCircle,
                  hasWorkout && styles.dayCircleHasWorkout,
                  isSelected && styles.dayCircleSelected,
                ]}>
                  <Text style={[
                    styles.dayCircleText,
                    hasWorkout && styles.dayCircleTextHasWorkout,
                    isSelected && styles.dayCircleTextSelected,
                  ]}>
                    {day.shortLabel}
                  </Text>
                </View>
                {split?.type === 'weekly' && (
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {day.name.slice(0, 3)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View>
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
    </>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewContent();
      case 'progress': return renderProgressContent();
      case 'schedule': return renderScheduleContent();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderHeaderAndActions()}
      {renderTabNavigation()}
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
        <View style={styles.tabContent}>
          {renderActiveTab()}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewSplitScreen;
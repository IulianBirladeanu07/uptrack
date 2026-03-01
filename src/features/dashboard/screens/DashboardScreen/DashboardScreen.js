import React, { useState, useEffect, useMemo, useContext } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import { AuthContext } from '../../../auth/context/AuthContext';
import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import GoogleFitStepDisplay from '../../../../shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay';
import { colors, spacing } from '../../../../shared/theme';
import { fetchSplitsFromFirestore } from '../../../workout/handlers/WorkoutHandler';
import { styles } from './DashboardScreenStyles';

const DAYS_MAP = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

const toLocalDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const TodayWorkout = ({ workout, onPress }) => {
  if (!workout) {
    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutContent}>
          <View style={styles.restIconContainer}>
            <Ionicons name="moon" size={spacing[6]} color={colors.accent.cyan} />
          </View>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>Rest Day</Text>
            <Text style={styles.workoutSubtitle}>Focus on getting those steps in</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.workoutCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.workoutContent}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <View style={styles.workoutMeta}>
            <Ionicons name="time-outline" size={spacing[3]} color={colors.text.secondary} />
            <Text style={styles.metaText}>{workout.duration} mins</Text>
            <Ionicons name="barbell-outline" size={spacing[3]} color={colors.text.secondary} />
            <Text style={styles.metaText}>{workout.exercises} exercises</Text>
          </View>
        </View>
        <View style={styles.playButton}>
          <Ionicons name="play" size={spacing[4]} color={colors.background.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TodayNutrition = ({ calories, targetCalories, macros, onPress }) => {
  const percentage = targetCalories > 0 ? Math.round((calories / targetCalories) * 100) : 0;
  const remaining = targetCalories - calories;
  const isComplete = calories >= targetCalories;

  return (
    <TouchableOpacity style={styles.nutritionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.nutritionHeader}>
        <View style={styles.caloriesValues}>
          <Text style={styles.caloriesValue}>{Math.round(calories).toLocaleString()}</Text>
          <Text style={styles.caloriesTarget}>/ {Math.round(targetCalories).toLocaleString()}</Text>
        </View>
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>
            {isComplete ? 'Complete' : `${Math.round(remaining)} left`}
          </Text>
        </View>
      </View>
      <Text style={styles.remainingText}>
        {isComplete ? '100% of daily goal' : `${percentage}% of daily goal`}
      </Text>
      <View style={styles.nutritionProgress}>
        <View style={[styles.nutritionProgressFill, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>
      <View style={styles.macroRow}>
        {[
          { label: 'Carbs',   value: macros.carbs,   color: colors.accent.success },
          { label: 'Protein', value: macros.protein,  color: colors.accent.purple },
          { label: 'Fat',     value: macros.fat,      color: colors.accent.cyan },
        ].map(macro => (
          <View key={macro.label} style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
              <Text style={styles.macroLabel}>{macro.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const WeeklyOverview = ({ rollingStats, weeklyWorkouts, targetWorkouts, getCaloriesForDateRange }) => {
  const weekDays = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today);
    const todayKey = toLocalDateKey(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const calMap = {};
    const range = getCaloriesForDateRange(monday, todayEnd);
    range.forEach(d => { calMap[d.date] = d.calories; });

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateKey = toLocalDateKey(day);
      const isFuture = dateKey > todayKey;
      const isToday = dateKey === todayKey;
      return {
        dateKey,
        dayLabel: day.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: isFuture ? null : (calMap[dateKey] || 0),
        isToday,
        isFuture,
      };
    });
  }, [getCaloriesForDateRange]);

  const maxCalories = Math.max(...weekDays.filter(d => !d.isFuture).map(d => d.calories || 0), 2500);

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyCardHeader}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up-outline" size={spacing[3]} color={colors.text.secondary} />
          <Text style={styles.cardLabel}>THIS WEEK</Text>
        </View>
        <Text style={styles.chartTitle}>Daily Calories</Text>
      </View>
      <View style={styles.chartContainer}>
        <View style={styles.chartContent}>
          <View style={styles.barsRow}>
            {weekDays.map((point, index) => {
              const heightPercent = point.calories > 0 ? (point.calories / maxCalories) * 100 : 0;
              return (
                <View key={index} style={styles.barContainer}>
                  {!point.isFuture && point.calories > 0 && (
                    <Text style={[styles.barValueText, point.isToday && styles.barValueTextToday]}>
                      {Math.round(point.calories)}
                    </Text>
                  )}
                  <View style={[
                    styles.bar,
                    { height: point.isFuture ? 4 : `${Math.max(heightPercent, 4)}%` },
                    point.isToday && styles.barToday,
                    point.isFuture && { opacity: 0.15 },
                  ]} />
                </View>
              );
            })}
          </View>
          <View style={styles.daysRow}>
            {weekDays.map((point, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={[styles.dayLabel, point.isToday && styles.dayLabelToday]}>
                  {point.dayLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.weeklyGrid}>
        {[
          {
            icon: <Ionicons name="flame-outline" size={spacing[5]} color={colors.accent.primary} />,
            bg: colors.faded.primary,
            value: rollingStats.avgCalories > 0 ? Math.round(rollingStats.avgCalories).toLocaleString() : '--',
            label: rollingStats.daysLoggedNutrition > 0 ? `Avg Cal (${rollingStats.daysLoggedNutrition}d)` : 'Avg Calories',
          },
          {
            icon: <MaterialCommunityIcons name="scale-bathroom" size={spacing[5]} color={colors.accent.purple} />,
            bg: colors.faded.purple,
            value: rollingStats.avgWeight ? `${rollingStats.avgWeight.toFixed(1)} kg` : '--',
            label: rollingStats.daysLoggedWeight > 0 ? `Avg Weight (${rollingStats.daysLoggedWeight}d)` : 'Avg Weight',          },
          {
            icon: <Ionicons name="walk-outline" size={spacing[5]} color={colors.accent.stepsRed} />,
            bg: colors.faded.error,
            value: rollingStats.avgSteps > 0 ? `${(rollingStats.avgSteps / 1000).toFixed(1)}k` : '--',
            label: rollingStats.daysLoggedSteps > 0 ? `Avg Steps (${rollingStats.daysLoggedSteps}d)` : 'Avg Steps',
          },
          {
            icon: <Ionicons name="barbell-outline" size={spacing[5]} color={colors.accent.cyan} />,
            bg: colors.faded.cyan,
            value: `${weeklyWorkouts}/${targetWorkouts}`,
            label: 'Workouts',
          },
        ].map((stat, i) => (
          <View key={i} style={styles.weeklyStatItem}>
            <View style={[styles.weeklyIconContainer, { backgroundColor: stat.bg }]}>{stat.icon}</View>
            <View style={styles.weeklyStatText}>
              <Text style={styles.weeklyStatValue}>{stat.value}</Text>
              <Text style={styles.weeklyStatLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [todayScheduledWorkout, setTodayScheduledWorkout] = useState(null);

  const { dailyNutrition, userMacros, updateDailySteps, rollingWeekStats, getCaloriesForDateRange, initialLoadComplete } = useFoodContext();
  const { workoutHistory } = useContext(WorkoutContext);
  const { userData } = useContext(AuthContext);

  const targetWorkouts = userData?.targetWorkoutsPerWeek || 5;

  useEffect(() => {
    if (!initialLoadComplete) return;
    const loadTodayWorkout = async () => {
      try {
        const splits = await fetchSplitsFromFirestore();
        if (!splits.length) return;
        const schedule = splits[0].schedule || splits[0].data?.schedule || {};
        const todayKey = DAYS_MAP[new Date().getDay()];
        const workout = schedule[todayKey];
        const exercises = workout?.exercises || [];
        setTodayScheduledWorkout(exercises.length > 0 ? {
          name: workout.templateName || 'Workout',
          duration: workout.duration || 45,
          exercises: exercises.length,
        } : null);
      } catch (error) {
        console.error('loadTodayWorkout error:', error);
      }
    };
    loadTodayWorkout();
  }, [initialLoadComplete]);

  const weeklyWorkoutsCount = useMemo(() => {
    if (!workoutHistory?.length) return 0;
    const weekStart = getMonday(new Date());
    return workoutHistory.filter(w => {
      const d = w.timestamp?.toDate?.();
      return d && d >= weekStart;
    }).length;
  }, [workoutHistory]);

  if (!initialLoadComplete) {
    return (
      <ApplicationCustomScreen>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </ApplicationCustomScreen>
    );
  }

return (
  <ApplicationCustomScreen>
    <View style={styles.container}>
      <GoogleFitStepDisplay onStepsUpdate={updateDailySteps} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 65 + spacing[3],
        }}
        showsVerticalScrollIndicator={false}
      >
        <TodayWorkout
          workout={todayScheduledWorkout}
          onPress={() => navigation.navigate('Workout')}
        />
        <TodayNutrition
          calories={dailyNutrition?.calories || 0}
          targetCalories={userMacros?.targetCalories || 2000}
          macros={{ carbs: dailyNutrition?.carbs || 0, protein: dailyNutrition?.protein || 0, fat: dailyNutrition?.fat || 0 }}
          onPress={() => navigation.navigate('Nutrition')}
        />
        <WeeklyOverview
          rollingStats={rollingWeekStats}
          weeklyWorkouts={weeklyWorkoutsCount}
          targetWorkouts={targetWorkouts}
          getCaloriesForDateRange={getCaloriesForDateRange}
        />
      </ScrollView>
    </View>
    <BottomNav />
  </ApplicationCustomScreen>
);
};

export default DashboardScreen;
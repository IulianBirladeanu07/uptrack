import { useMemo, useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useFoodContext } from '../../../nutrition/context/FoodContext';
import { WorkoutContext } from '../../../workout/context/WorkoutContext';
import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import GoogleFitStepDisplay from '../../../../shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay';
import { colors, spacing } from '../../../../shared/theme';
import { getAuth } from 'firebase/auth';
import { WeightService } from '../../../nutrition/services/weightService';
import { fetchSplitsFromFirestore } from '../../../workout/handlers/WorkoutHandler';
import { styles } from './DashboardScreenStyles';

const DAYS_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

const screens = [
  { name: 'Dashboard', label: 'Home', icon: 'home', iconType: 'Ionicons' },
  { name: 'Workout', label: 'Workout', icon: 'dumbbell', iconType: 'MaterialCommunityIcons' },
  { name: 'Nutrition', label: 'Nutrition', icon: 'restaurant', iconType: 'MaterialIcons' },
  { name: 'Progress', label: 'Progress', icon: 'insert-chart', iconType: 'MaterialIcons' },
];

const NavItem = ({ screen, isActive, onPress }) => {
  const renderIcon = () => {
    const iconProps = {
      size: spacing[6],
      color: isActive ? colors.accent.primary : colors.text.secondary
    };

    switch (screen.iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={screen.icon} {...iconProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={screen.icon} {...iconProps} />;
      default:
        return <Ionicons name={screen.icon} {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderIcon()}
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {screen.label}
      </Text>
    </TouchableOpacity>
  );
};

const TodayWorkout = ({ workout, onPress }) => {
  if (!workout) {
    return (
      <View style={styles.workoutCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={spacing[3]} color={colors.text.secondary} />
          <Text style={styles.cardLabel}>TODAY'S WORKOUT</Text>
        </View>
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
    <TouchableOpacity 
      style={styles.workoutCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={spacing[3]} color={colors.text.secondary} />
        <Text style={styles.cardLabel}>TODAY'S WORKOUT</Text>
      </View>
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
  const remaining = Math.max(0, targetCalories - calories);

  return (
    <TouchableOpacity 
      style={styles.nutritionCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.nutritionHeader}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="restaurant" size={spacing[3]} color={colors.text.secondary} />
          <Text style={styles.cardLabel}>TODAY'S NUTRITION</Text>
        </View> 
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{remaining.toFixed(0) > 0 ? `${remaining.toFixed(0)} left` : 'Complete'}</Text>
        </View>
      </View>

      <View style={styles.caloriesRow}>
        <View style={styles.caloriesValues}>
          <Text style={styles.caloriesValue}>
            {Math.round(calories).toLocaleString()}
          </Text>
          <Text style={styles.caloriesTarget}>
            / {Math.round(targetCalories).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.remainingText}>
          {percentage}% of daily goal
        </Text>
      </View>

      <View style={styles.nutritionProgress}>
        <View style={[styles.nutritionProgressFill, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>

      <View style={styles.macroRow}>
        {[
          { label: 'Carbs', value: macros.carbs, color: colors.accent.success },
          { label: 'Protein', value: macros.protein, color: colors.accent.purple },
          { label: 'Fat', value: macros.fat, color: colors.accent.cyan },
        ].map((macro) => (
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

const WeeklyOverview = ({ avgCalories, avgWeight, weeklyWorkouts, targetWorkouts, getTrendData, getWeeklyAvgSteps }) => {
  const trendData = useMemo(() => {
    const data = getTrendData(7);
    return data.daily.map(d => ({
      date: new Date(d.date),
      calories: d.calories,
      dayLabel: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
  }, [getTrendData]);

  const maxCalories = Math.max(...trendData.map(d => d.calories), 2500);

  const weeklyAvgSteps = getWeeklyAvgSteps();
  
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
        <View style={styles.yAxisContainer}>
          <Text style={styles.yAxisText}>{Math.round(maxCalories)}</Text>
          <Text style={styles.yAxisText}>{Math.round(maxCalories / 2)}</Text>
          <Text style={styles.yAxisText}>0</Text>
        </View>

        <View style={styles.chartContent}>
          <View style={styles.barsRow}>
            {trendData.map((point, index) => {
              const heightPercent = point.calories > 0 
                ? (point.calories / maxCalories) * 100 
                : 0;
              const isToday = index === trendData.length - 1;
              
              return (
                <View key={index} style={styles.barContainer}>
                  {point.calories > 0 && (
                    <Text style={[styles.barValueText, isToday && styles.barValueTextToday]}>
                      {Math.round(point.calories)}
                    </Text>
                  )}
                  <View 
                    style={[
                      styles.bar,
                      { height: `${Math.max(heightPercent, 4)}%` },
                      isToday && styles.barToday
                    ]} 
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.daysRow}>
            {trendData.map((point, index) => {
              const isToday = index === trendData.length - 1;
              return (
                <View key={index} style={styles.dayContainer}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {point.dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.weeklyGrid}>
        <View style={styles.weeklyStatItem}>
          <View style={[styles.weeklyIconContainer, { backgroundColor: colors.faded.primary }]}>
            <Ionicons name="flame-outline" size={spacing[5]} color={colors.accent.primary} />
          </View>
          <View style={styles.weeklyStatText}>
            <Text style={styles.weeklyStatValue}>{Math.round(avgCalories).toLocaleString()}</Text>
            <Text style={styles.weeklyStatLabel}>Avg Calories</Text>
          </View>
        </View>

        <View style={styles.weeklyStatItem}>
          <View style={[styles.weeklyIconContainer, { backgroundColor: colors.faded.purple }]}>
            <MaterialCommunityIcons name="scale-bathroom" size={spacing[5]} color={colors.accent.purple} />
          </View>
          <View style={styles.weeklyStatText}>
            <Text style={styles.weeklyStatValue}>
              {avgWeight ? `${avgWeight.toFixed(1)} kg` : '--'}
            </Text>
            <Text style={styles.weeklyStatLabel}>Avg Weight</Text>
          </View>
        </View>

        <View style={styles.weeklyStatItem}>
          <View style={[styles.weeklyIconContainer, { backgroundColor: colors.faded.error }]}>
            <Ionicons name="walk-outline" size={spacing[5]} color={colors.accent.stepsRed} />
          </View>
          <View style={styles.weeklyStatText}>
            <Text style={styles.weeklyStatValue}>
              {weeklyAvgSteps > 0 ? `${(weeklyAvgSteps / 1000).toFixed(1)}k` : '--'}
            </Text>
            <Text style={styles.weeklyStatLabel}>Avg Steps</Text>
          </View>
        </View>

        <View style={styles.weeklyStatItem}>
          <View style={[styles.weeklyIconContainer, { backgroundColor: colors.faded.cyan }]}>
            <Ionicons name="barbell-outline" size={spacing[5]} color={colors.accent.cyan} />
          </View>
          <View style={styles.weeklyStatText}>
            <Text style={styles.weeklyStatValue}>{weeklyWorkouts}/{targetWorkouts}</Text>
            <Text style={styles.weeklyStatLabel}>Workouts</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [weeklyWeight, setWeeklyWeight] = useState(null);
  const [weightLoading, setWeightLoading] = useState(true);
  const [todayScheduledWorkout, setTodayScheduledWorkout] = useState(null);

  const currentRouteName = useNavigationState(state => {
    const route = state?.routes[state.index];
    return route?.name || 'Dashboard';
  });

  const { dailyNutrition, userMacros, learningData, getTrendData, updateDailySteps, getWeeklyAvgSteps, initialLoadComplete } = useFoodContext();
  const { workoutHistory } = useContext(WorkoutContext);

  useEffect(() => {
    const loadWeight = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setWeightLoading(false);
          return;
        }

        const weekData = await WeightService.getCurrentWeekData(user.uid, new Date());
        if (weekData?.average) {
          setWeeklyWeight(weekData.average);
        }
      } catch (error) {
        console.error('Error loading weekly weight:', error);
      } finally {
        setWeightLoading(false);
      }
    };

    if (initialLoadComplete) {
      loadWeight();
    }
  }, [initialLoadComplete]);

  useEffect(() => {
    const loadTodayWorkout = async () => {
      try {
        const splits = await fetchSplitsFromFirestore();
        if (splits.length === 0) return;

        const rawSplit = splits[0];
        const schedule = rawSplit.schedule || rawSplit.data?.schedule || {};
        
        const today = new Date().getDay();
        const todayKey = DAYS_MAP[today];
        const workout = schedule[todayKey];
        const exercises = workout?.exercises || [];
        
        if (exercises.length > 0) {
          setTodayScheduledWorkout({
            name: workout.templateName || 'Workout',
            duration: workout.duration || 45,
            exercises: exercises.length,
          });
        } else {
          setTodayScheduledWorkout(null);
        }
      } catch (error) {
        console.error('Error loading today workout:', error);
      }
    };

    if (initialLoadComplete) {
      loadTodayWorkout();
    }
  }, [initialLoadComplete]);

  const weeklyWorkoutsCount = useMemo(() => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;
    
    const now = new Date();
    const weekStart = new Date(now);
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    return workoutHistory.filter(workout => {
      const workoutDate = workout.timestamp?.toDate ? workout.timestamp.toDate() : null;
      return workoutDate && workoutDate >= weekStart;
    }).length;
  }, [workoutHistory]);

  const dashboardData = useMemo(() => {
    const targetCals = userMacros?.targetCalories || learningData?.weeklyAvgCalories || 2000;
    
    const weeklyTrend = getTrendData(7);
    const realAvgCalories = Math.round(weeklyTrend.average) || 0;

    return {
      calories: dailyNutrition?.calories || 0,
      targetCalories: targetCals,
      macros: {
        carbs: dailyNutrition?.carbs || 0,
        protein: dailyNutrition?.protein || 0,
        fat: dailyNutrition?.fat || 0,
      },
      avgCalories: realAvgCalories,
      avgWeight: weeklyWeight,
      weeklyWorkouts: weeklyWorkoutsCount,
      targetWorkouts: 5,
      todayWorkout: todayScheduledWorkout,
    };
  }, [dailyNutrition, userMacros, learningData, weeklyWeight, getTrendData, todayScheduledWorkout, weeklyWorkoutsCount]);

  const handleNavigation = (screenName) => {
    navigation.navigate(screenName);
  };

  const allDataLoaded = initialLoadComplete && !weightLoading;

  if (!allDataLoaded) {
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

        <View 
          style={styles.content}
          contentContainerStyle={{ 
            paddingTop: spacing[3],
            paddingBottom: insets.bottom + spacing[20],
            paddingHorizontal: spacing[4],
          }}
          showsVerticalScrollIndicator={false}
        >
          <TodayWorkout
            workout={dashboardData.todayWorkout}
            onPress={() => handleNavigation('Workout')}
          />

          <TodayNutrition
            calories={dashboardData.calories}
            targetCalories={dashboardData.targetCalories}
            macros={dashboardData.macros}
            onPress={() => handleNavigation('Nutrition')}
          />

          <WeeklyOverview
            avgCalories={dashboardData.avgCalories}
            avgWeight={dashboardData.avgWeight}
            weeklyWorkouts={dashboardData.weeklyWorkouts}
            targetWorkouts={dashboardData.targetWorkouts}
            getTrendData={getTrendData}
            getWeeklyAvgSteps={getWeeklyAvgSteps}
          />
        </View>

        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, spacing[1]) }]}>
          {screens.map((screen) => (
            <NavItem
              key={screen.name}
              screen={screen}
              isActive={currentRouteName === screen.name}
              onPress={() => handleNavigation(screen.name)}
            />
          ))}
        </View>
      </View>
    </ApplicationCustomScreen>
  );
};

export default DashboardScreen;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../../../../shared/theme';
import styles from './ReviewStepStyles';
import Svg, { Path, Text as SvgText, Circle, G } from 'react-native-svg';
import { daysOfWeek } from '../constants/CreateSplitScreenConstants';

const pieChartColors = [
  '#FF8535', '#00D4FF', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#A3E635', '#F97316', '#BE185D'
];

const CustomPieChart = ({ data, size = spacing[45], selectedIndex, onPress, chartColors }) => {
  const radius = size / 2 - spacing[2];
  const center = size / 2;

  const createPath = (startAngle, endAngle, radius, centerX, centerY) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  let currentAngle = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <View style={[styles.pieChartWrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360;
            const isSelected = selectedIndex === index;
            const adjustedRadius = isSelected ? radius + spacing[2] : radius;

            const path = createPath(currentAngle, currentAngle + angle, adjustedRadius, center, center);
            currentAngle += angle;

            return (
              <G key={index}>
                <Path
                  d={path}
                  fill={chartColors[index % chartColors.length]}
                  opacity={isSelected ? 1 : 0.8}
                  stroke={colors.background.primary}
                  strokeWidth={2}
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                  }}
                  onPress={() => {
                    onPress(index);
                  }}
                  activeOpacity={0.8}
                >
                  <Path
                    d={path}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </G>
            );
          })}

          <Circle
            cx={center}
            cy={center}
            r={radius * 0.4}
            fill={colors.background.primary}
            stroke={colors.border.light}
            strokeWidth={1}
          />

          <SvgText
            x={center}
            y={center - spacing[2]}
            textAnchor="middle"
            fontSize={fontSize[16]}
            fontWeight="bold"
            fill={colors.text.primary}
          >
            {data.length}
          </SvgText>
          <SvgText
            x={center}
            y={center + spacing[2]}
            textAnchor="middle"
            fontSize={fontSize[10]}
            fill={colors.text.secondary}
          >
            Muscles
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

const ReviewStep = ({ splitData, setCurrentStep }) => {
  const [selectedMuscleIndex, setSelectedMuscleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [animatedValue] = useState(new Animated.Value(0));
  const muscleListRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState('1');

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
        number: i + 1
      }));
    }
    return [];
  }, [isWeeklySchedule, isRotationSchedule, splitData.schedule]);

  const stats = useMemo(() => {
    const schedule = splitData.schedule || {};
    const workouts = Object.values(schedule).filter(w => w !== null);
    const workoutDays = workouts.length;

    let totalDuration = 0;
    let totalSets = 0;
    let muscleGroupSets = {};
    let totalExercises = 0;
    let workoutsByType = {};

    workouts.forEach(workout => {
      totalDuration += workout.duration || 0;
      totalExercises += workout.exercises?.length || 0;

      const workoutType = workout.templateName || 'Workout';
      workoutsByType[workoutType] = (workoutsByType[workoutType] || 0) + 1;

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
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        percentage: totalSets > 0 ? Math.round((sets / totalSets) * 100) : 0,
        value: sets
      }));

    const maxSets = Math.max(...muscleGroupsArray.map(item => item.sets), 1);

    const primaryMuscleFocus = muscleGroupsArray.length > 0
      ? `${muscleGroupsArray[0].muscle} - ${muscleGroupsArray[0].percentage}%`
      : 'None';
    const avgSessionDuration = workoutDays > 0 ? Math.round(totalDuration / workoutDays) : 0;
    const workoutVariety = Object.keys(workoutsByType).length;

    return {
      workoutDays,
      totalDuration,
      totalSets,
      totalExercises,
      workoutsByType,
      muscleGroupSets: muscleGroupsArray,
      maxSets,
      avgDuration: workoutDays > 0 ? Math.round(totalDuration / workoutDays) : 0,
      avgSets: workoutDays > 0 ? Math.round(totalSets / workoutDays) : 0,
      avgExercises: workoutDays > 0 ? Math.round(totalExercises / workoutDays) : 0,
      primaryMuscleFocus,
      avgSessionDuration,
      workoutVariety,
    };
  }, [splitData]);

  const insights = useMemo(() => {
    const issues = [];

    const majorMuscleGroups = ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'];
    const covered = majorMuscleGroups.filter(muscle =>
      stats.muscleGroupSets.some(item => item.muscle === muscle)
    );

    const coverage = (covered.length / majorMuscleGroups.length) * 100;

    if (coverage >= 85) {
      issues.push({
        type: 'success', icon: 'checkmark-circle', title: 'Excellent muscle coverage',
        description: `${covered.length}/${majorMuscleGroups.length} major muscle groups targeted`, score: 95
      });
    } else if (coverage >= 65) {
      issues.push({
        type: 'warning', icon: 'alert-circle', title: 'Good muscle coverage',
        description: `Consider adding ${majorMuscleGroups.length - covered.length} more muscle groups`, score: 75
      });
    } else {
      issues.push({
        type: 'error', icon: 'close-circle', title: 'Limited muscle coverage',
        description: `Only ${covered.length}/${majorMuscleGroups.length} major muscles targeted`, score: 45
      });
    }

    let frequency = 'optimal';
    if (stats.workoutDays <= 2) frequency = 'low';
    else if (stats.workoutDays >= 6) frequency = 'high';

    issues.push({
      type: frequency === 'optimal' ? 'success' : frequency === 'low' ? 'info' : 'warning',
      icon: frequency === 'optimal' ? 'fitness' : frequency === 'low' ? 'calendar' : 'warning',
      title: `${frequency === 'optimal' ? 'Optimal' : frequency === 'low' ? 'Low' : 'High'} training frequency`,
      description: `${stats.workoutDays} workout days`,
      score: frequency === 'optimal' ? 90 : frequency === 'low' ? 60 : 70
    });

    return issues;
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

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { id: 'overview', label: 'Overview', icon: 'analytics' },
        { id: 'analysis', label: 'Analysis', icon: 'pie-chart' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={tab.icon}
            size={spacing.iconMd}
            color={activeTab === tab.id ? colors.accent.primary : colors.text.quaternary}
          />
          <Text style={[
            styles.tabText,
            activeTab === tab.id && styles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Split Quality Score</Text>
          <View style={styles.scoreValue}>
            <Text style={styles.scoreNumber}>
              {Math.round(insights.reduce((sum, insight) => sum + insight.score, 0) / insights.length) || 0}
            </Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
        </View>

        <View style={styles.scoreBreakdown}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.scoreItem}>
              <View style={[
                styles.scoreIcon,
                styles[`scoreIcon${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}`]
              ]}>
                <Ionicons
                  name={insight.icon}
                  size={spacing.iconSm}
                  color={
                    insight.type === 'success' ? colors.accent.successAlt :
                      insight.type === 'warning' ? colors.accent.warning :
                        insight.type === 'error' ? colors.accent.errorAlt :
                          colors.accent.blue
                  }
                />
              </View>
              <View style={styles.scoreDetails}>
                <Text style={styles.scoreItemTitle}>{insight.title}</Text>
                <Text style={styles.scoreItemDesc}>{insight.description}</Text>
              </View>
              <Text style={styles.scoreItemValue}>{insight.score}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="trending-up" size={spacing.iconLg} color={colors.accent.primary} />
          <Text style={styles.metricValue}>{stats.avgDuration}m</Text>
          <Text style={styles.metricLabel}>Avg Session</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="repeat" size={spacing.iconLg} color={colors.accent.cyan} />
          <Text style={styles.metricValue}>{stats.avgSets}</Text>
          <Text style={styles.metricLabel}>Sets/Session</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="body" size={spacing.iconLg} color={colors.accent.successAlt} />
          <Text style={styles.metricValue}>{stats.muscleGroupSets.length}</Text>
          <Text style={styles.metricLabel}>Muscle Groups</Text>
        </View>
      </View>
    </View>
  );

  const renderAnalysisTab = () => {
    const pieChartData = stats.muscleGroupSets.slice(0, pieChartColors.length);

    return (
      <View style={styles.tabContent}>
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>Muscle Group Distribution</Text>

          <View style={styles.pieChartContainer}>
            <CustomPieChart
              data={pieChartData.length > 0 ? pieChartData : [{ muscle: 'No Data', value: 1 }]}
              size={spacing[45]}
              selectedIndex={selectedMuscleIndex}
              onPress={(index) => {
                setSelectedMuscleIndex(index);
              }}
              chartColors={pieChartColors}
            />
          </View>

          <View style={styles.muscleDistributionContainer}>
            <Text style={styles.breakdownTitle}>Volume Breakdown by Muscle</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.muscleListScrollContent}
              ref={muscleListRef}
            >
              {pieChartData.length > 0 ? pieChartData.map((muscle, index) => {
                const isSelected = selectedMuscleIndex === index;
                const itemOpacity = selectedMuscleIndex === null || isSelected ? 1 : 0.6;

                return (
                  <TouchableOpacity
                    key={muscle.muscle}
                    style={[
                      styles.muscleCardItem,
                      { opacity: itemOpacity },
                      isSelected && styles.muscleCardItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedMuscleIndex(index);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.muscleColorDot, { backgroundColor: pieChartColors[index] }]} />
                    <View style={styles.muscleCardInfo}>
                      <Text style={styles.muscleCardName}>{muscle.muscle}</Text>
                      <Text style={styles.muscleCardSets}>{muscle.sets} sets</Text>
                    </View>
                  </TouchableOpacity>
                );
              }) : (
                <Text style={styles.muscleCardName}>No muscle data available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const renderScheduleTab = () => {
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
      <View style={styles.tabContent}>
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

              <View style={styles.muscleGroupTags}>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>All Muscles</Text>
                </View>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>Recovering</Text>
                </View>
              </View>

              <View style={styles.restSuggestions}>
                <Text style={styles.restSuggestionText}>
                  Consider mobility work, walking to optimize gains.
                </Text>
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
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'analysis':
        return renderAnalysisTab();
      case 'schedule':
        return renderScheduleTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabNavigation()}
      <View style={styles.contentContainer}>
        {renderActiveTab()}
      </View>
    </View>
  );
};

export default React.memo(ReviewStep);
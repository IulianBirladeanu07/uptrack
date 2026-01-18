import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../auth/services/firebaseConfigService';

const ExerciseHistory = ({ route, navigation }) => {
  const { exerciseName } = route.params;
  const insets = useSafeAreaInsets();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('1rm');

  useEffect(() => {
    fetchExerciseHistory();
  }, [exerciseName]);

  const calculate1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return weight / (1.0278 - 0.0278 * reps);
  };

  const fetchExerciseHistory = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const workoutsRef = collection(db, 'workoutHistory');
      const workoutQuery = query(
        workoutsRef,
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(workoutQuery);

      const exerciseHistory = [];
      querySnapshot.forEach((doc) => {
        const workout = doc.data();
        const exercise = workout.exercises?.find(ex => ex.exerciseName === exerciseName);
        
        if (exercise && exercise.sets && exercise.sets.length > 0) {
          const validSets = exercise.sets.filter(set => set.weight > 0 && set.reps > 0);
          
          if (validSets.length > 0) {
            const best1RM = Math.max(...validSets.map(set => calculate1RM(set.weight, set.reps)));
            const maxWeight = Math.max(...validSets.map(set => set.weight));
            const totalVolume = validSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
            const totalReps = validSets.reduce((sum, set) => sum + set.reps, 0);

            exerciseHistory.push({
              date: workout.timestamp?.toDate() || new Date(),
              best1RM: Math.round(best1RM * 10) / 10,
              maxWeight: Math.round(maxWeight * 10) / 10,
              totalVolume: Math.round(totalVolume),
              totalSets: validSets.length,
              totalReps,
              sets: validSets,
            });
          }
        }
      });

      exerciseHistory.sort((a, b) => a.date - b.date);

      const stats = calculateStats(exerciseHistory);
      setHistoryData({ history: exerciseHistory, stats });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      setLoading(false);
    }
  };

  const calculateStats = (history) => {
    if (history.length === 0) return null;

    const allTime = {
      best1RM: Math.max(...history.map(h => h.best1RM)),
      maxWeight: Math.max(...history.map(h => h.maxWeight)),
      maxVolume: Math.max(...history.map(h => h.totalVolume)),
      totalWorkouts: history.length,
    };

    const now = new Date();
    const thisYear = history.filter(h => h.date.getFullYear() === now.getFullYear());

    const yearStats = thisYear.length > 0 ? {
      best1RM: Math.max(...thisYear.map(h => h.best1RM)),
      maxWeight: Math.max(...thisYear.map(h => h.maxWeight)),
      maxVolume: Math.max(...thisYear.map(h => h.totalVolume)),
      totalWorkouts: thisYear.length,
    } : null;

    const bestWorkout = history.reduce((best, current) => 
      current.best1RM > best.best1RM ? current : best
    );

    const recent = history.slice(-5);
    const trend = recent.length > 1 
      ? recent[recent.length - 1].best1RM > recent[0].best1RM 
        ? 'improving' 
        : recent[recent.length - 1].best1RM < recent[0].best1RM 
          ? 'declining' 
          : 'stable'
      : 'stable';

    return {
      allTime,
      thisYear: yearStats,
      bestWorkout,
      trend,
    };
  };

  const getChartData = () => {
    if (!historyData || historyData.history.length === 0) return null;

    const recentHistory = historyData.history.slice(-10);
    
    let dataPoints;
    switch (selectedMetric) {
      case '1rm':
        dataPoints = recentHistory.map(h => h.best1RM);
        break;
      case 'weight':
        dataPoints = recentHistory.map(h => h.maxWeight);
        break;
      case 'volume':
        dataPoints = recentHistory.map(h => h.totalVolume);
        break;
      default:
        dataPoints = recentHistory.map(h => h.best1RM);
    }

    const labels = recentHistory.map(h => {
      const date = h.date;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      labels,
      datasets: [{ data: dataPoints }]
    };
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + normalize(8) }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={normalize(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{exerciseName}</Text>
        <View style={{ width: normalize(40) }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + normalize(20) }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : !historyData || historyData.history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={normalize(60)} color="#4B5563" />
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>Complete workouts to see your progress</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Records</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="trophy" size={normalize(24)} color="#FFD700" />
                  <Text style={styles.statValue}>{historyData.stats.allTime.best1RM} kg</Text>
                  <Text style={styles.statLabel}>Best 1RM</Text>
                  <Text style={styles.statDate}>
                    {formatDate(historyData.stats.bestWorkout.date)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="barbell" size={normalize(24)} color="#FF9500" />
                  <Text style={styles.statValue}>{historyData.stats.allTime.maxWeight} kg</Text>
                  <Text style={styles.statLabel}>Max Weight</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="fitness" size={normalize(24)} color="#06B6D4" />
                  <Text style={styles.statValue}>{historyData.stats.allTime.maxVolume}</Text>
                  <Text style={styles.statLabel}>Max Volume</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons 
                    name={historyData.stats.trend === 'improving' ? 'trending-up' : 
                          historyData.stats.trend === 'declining' ? 'trending-down' : 'remove'} 
                    size={normalize(24)} 
                    color={historyData.stats.trend === 'improving' ? '#10B981' : 
                           historyData.stats.trend === 'declining' ? '#EF4444' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.statValue,
                    { color: historyData.stats.trend === 'improving' ? '#10B981' : 
                             historyData.stats.trend === 'declining' ? '#EF4444' : '#6B7280',
                      textTransform: 'capitalize' }
                  ]}>
                    {historyData.stats.trend}
                  </Text>
                  <Text style={styles.statLabel}>Recent Trend</Text>
                </View>
              </View>
            </View>

            {historyData.stats.thisYear && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>This Year ({new Date().getFullYear()})</Text>
                <View style={styles.yearStats}>
                  <View style={styles.yearStatItem}>
                    <Text style={styles.yearStatValue}>{historyData.stats.thisYear.best1RM} kg</Text>
                    <Text style={styles.yearStatLabel}>Best 1RM</Text>
                  </View>
                  <View style={styles.yearStatItem}>
                    <Text style={styles.yearStatValue}>{historyData.stats.thisYear.totalWorkouts}</Text>
                    <Text style={styles.yearStatLabel}>Workouts</Text>
                  </View>
                  <View style={styles.yearStatItem}>
                    <Text style={styles.yearStatValue}>{historyData.stats.thisYear.maxVolume}</Text>
                    <Text style={styles.yearStatLabel}>Max Volume</Text>
                  </View>
                </View>
              </View>
            )}

            {historyData.history.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Chart</Text>
                
                <View style={styles.metricSelector}>
                  <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === '1rm' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('1rm')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.metricButtonText, selectedMetric === '1rm' && styles.metricButtonTextActive]}>
                      1RM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === 'weight' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('weight')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.metricButtonText, selectedMetric === 'weight' && styles.metricButtonTextActive]}>
                      Max Weight
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.metricButton, selectedMetric === 'volume' && styles.metricButtonActive]}
                    onPress={() => setSelectedMetric('volume')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.metricButtonText, selectedMetric === 'volume' && styles.metricButtonTextActive]}>
                      Volume
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={getChartData()}
                    width={Math.max(Dimensions.get('window').width - normalize(60), historyData.history.slice(-10).length * 60)}
                    height={normalize(200)}
                    chartConfig={{
                      backgroundColor: '#0D1117',
                      backgroundGradientFrom: '#0D1117',
                      backgroundGradientTo: '#151B23',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: { borderRadius: normalize(12) },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#FF9500'
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.08)',
                        strokeWidth: 1
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              {historyData.history.slice().reverse().slice(0, 10).map((workout, index) => (
                <View key={index} style={styles.workoutItem}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                    <View style={styles.workoutBadge}>
                      <Text style={styles.workoutBadgeText}>{workout.totalSets} sets</Text>
                    </View>
                  </View>
                  <View style={styles.workoutStats}>
                    <View style={styles.workoutStat}>
                      <Text style={styles.workoutStatLabel}>Est. 1RM</Text>
                      <Text style={styles.workoutStatValue}>{workout.best1RM} kg</Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Text style={styles.workoutStatLabel}>Max Weight</Text>
                      <Text style={styles.workoutStatValue}>{workout.maxWeight} kg</Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Text style={styles.workoutStatLabel}>Volume</Text>
                      <Text style={styles.workoutStatValue}>{workout.totalVolume}</Text>
                    </View>
                    <View style={styles.workoutStat}>
                      <Text style={styles.workoutStatLabel}>Reps</Text>
                      <Text style={styles.workoutStatValue}>{workout.totalReps}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: normalize(18),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: normalize(8),
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: normalize(40),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: normalize(16),
    color: '#9CA3AF',
  },
  emptyContainer: {
    padding: normalize(40),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: normalize(16),
  },
  emptySubtext: {
    fontSize: normalize(14),
    color: '#6B7280',
    marginTop: normalize(8),
  },
  section: {
    padding: normalize(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#fff',
    marginBottom: normalize(16),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#151B23',
    borderRadius: normalize(12),
    padding: normalize(16),
    alignItems: 'center',
    gap: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: normalize(12),
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statDate: {
    fontSize: normalize(10),
    color: '#6B7280',
    marginTop: normalize(4),
  },
  yearStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#151B23',
    borderRadius: normalize(12),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  yearStatItem: {
    alignItems: 'center',
  },
  yearStatValue: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: '#FF9500',
  },
  yearStatLabel: {
    fontSize: normalize(12),
    color: '#9CA3AF',
    marginTop: normalize(4),
  },
  metricSelector: {
    flexDirection: 'row',
    gap: normalize(8),
    marginBottom: normalize(16),
  },
  metricButton: {
    flex: 1,
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    backgroundColor: '#151B23',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  metricButtonText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#9CA3AF',
  },
  metricButtonTextActive: {
    color: '#fff',
  },
  chart: {
    marginVertical: normalize(8),
    borderRadius: normalize(12),
  },
  workoutItem: {
    backgroundColor: '#151B23',
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  workoutDate: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: '#fff',
  },
  workoutBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(6),
  },
  workoutBadgeText: {
    fontSize: normalize(11),
    color: '#FF9500',
    fontWeight: '600',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatLabel: {
    fontSize: normalize(10),
    color: '#6B7280',
    marginBottom: normalize(4),
  },
  workoutStatValue: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#FF9500',
  },
});

export default ExerciseHistory;
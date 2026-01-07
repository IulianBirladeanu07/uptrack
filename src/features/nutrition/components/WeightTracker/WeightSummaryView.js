import { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';
import WeightChart from './WeightChart';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  danger: '#FF453A',
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  white: '#FFFFFF',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
};

const WeightSummaryView = ({
  currentWeight,
  weeklyData,
  weeklyAverage,
  trendData,
  getWeightChange,
  setActiveView,
}) => {
  const weeklyChange = getWeightChange() || 0;
  const weekDaysLogged = weeklyData?.days ? Object.values(weeklyData.days).filter(d => d !== null).length : 0;
  const goalWeight = 78.0;
  const startWeight = 87.0;
  const remaining = currentWeight ? (currentWeight - goalWeight) : 0;
  const progress = currentWeight ? ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100 : 0;
  const totalLost = currentWeight ? (startWeight - currentWeight) : 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const streak = useMemo(() => {
    if (!weeklyData?.days) return 0;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let streakCount = 0;
    const todayIndex = new Date().getDay();

    for (let i = 0; i < 7; i++) {
      const dayIndex = (todayIndex - i + 7) % 7;
      const dayKey = days[dayIndex];
      if (weeklyData.days[dayKey] !== null && weeklyData.days[dayKey] !== undefined) {
        streakCount++;
      } else {
        break;
      }
    }
    return streakCount;
  }, [weeklyData]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.floatingHeader}>
            <View>
              <Text style={styles.headerSubtitle}>UPTRACK</Text>
              <Text style={styles.headerTitle}>Your Journey</Text>
            </View>
            <TouchableOpacity style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={normalize(14)} color={colors.primary} />
              <Text style={styles.streakBadgeText}>{streak} day{streak !== 1 ? 's' : ''} streak</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroContainer}>
            <View style={styles.heroGlassCard}>
              <View style={styles.progressBadge}>
                <Text style={styles.progressPercent}>
                  {Math.min(Math.max(progress, 0), 100).toFixed(0)}%
                </Text>
              </View>

              <View style={styles.weightDisplay}>
                <Text style={styles.weightLabel}>Current Weight</Text>
                <View style={styles.weightValueContainer}>
                  <Text style={styles.weightValue}>{currentWeight?.toFixed(1) || '--.-'}</Text>
                  <View style={styles.weightUnit}>
                    <Text style={styles.weightUnitText}>kg</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(Math.max(progress, 0), 100)}%` }
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressStart}>{startWeight} kg</Text>
                  <Text style={styles.progressGoal}>{goalWeight} kg</Text>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{totalLost.toFixed(1)}</Text>
                  <Text style={styles.heroStatLabel}>Lost</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{remaining.toFixed(1)}</Text>
                  <Text style={styles.heroStatLabel}>To Go</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, {
                    color: weeklyChange < 0 ? colors.success : weeklyChange > 0 ? colors.danger : colors.textSecondary
                  }]}>
                    {weeklyChange < 0 ? '' : '+'}{weeklyChange.toFixed(1)}
                  </Text>
                  <Text style={styles.heroStatLabel}>Weekly</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <Text style={styles.weekCount}>{weekDaysLogged}/7</Text>
            </View>
            <View style={styles.weekGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                const dayWeight = weeklyData?.days?.[dayKey];
                const isToday = new Date().getDay() === (index + 1) % 7;
                const hasData = dayWeight !== null && dayWeight !== undefined;

                return (
                  <View key={index} style={styles.weekItem}>
                    <View style={[
                      styles.weekCircle,
                      hasData && !isToday && styles.weekCircleActive,
                      isToday && styles.weekCircleToday,
                    ]}>
                      <Text style={[
                        styles.weekDay,
                        isToday && styles.weekDayToday,
                        !hasData && !isToday && styles.weekDayInactive
                      ]}>{day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {trendData && trendData.length > 1 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Progress Chart</Text>
                <View style={styles.avgBadge}>
                  <Text style={styles.avgValue}>{weeklyAverage?.toFixed(1)}</Text>
                  <Text style={styles.avgLabel}>Avg</Text>
                </View>
              </View>
              <WeightChart
                data={trendData}
                weeklyAverage={weeklyAverage}
                getWeightChange={getWeightChange}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={normalize(32)} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No data yet</Text>
                <Text style={styles.emptySubtitle}>Log your weight to see progress</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActiveView('input')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="scale-bathroom" size={normalize(20)} color={colors.white} />
            <Text style={styles.fabText}>Log</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: normalize(15),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: normalize(80),
  },
  container: {
    paddingTop: normalize(60),
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(25),
    zIndex: 10,
  },
  headerSubtitle: {
    fontSize: normalize(14),
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: normalize(2),
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    backgroundColor: colors.surface,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakBadgeText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  heroContainer: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(25),
    paddingBottom: normalize(16),
  },
  heroGlassCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: normalize(24),
    padding: normalize(20),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressBadge: {
    position: 'absolute',
    top: normalize(12),
    right: normalize(12),
    backgroundColor: colors.primary,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  progressPercent: {
    fontSize: normalize(12),
    fontWeight: '800',
    color: colors.white,
  },
  weightDisplay: {
    alignItems: 'center',
    marginBottom: normalize(16),
    paddingHorizontal: normalize(24),
    paddingBottom: normalize(8),
  },
  weightLabel: {
    fontSize: normalize(14),
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: -5,
    marginBottom: normalize(8),
  },
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: normalize(4),
  },
  weightValue: {
    fontSize: normalize(50),
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: normalize(50),
  },
  weightUnit: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(3),
    borderRadius: normalize(8),
    marginBottom: normalize(4),
  },
  weightUnitText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: normalize(20),
  },
  progressTrack: {
    height: normalize(6),
    backgroundColor: colors.surfaceLight,
    borderRadius: normalize(3),
    overflow: 'hidden',
    marginBottom: normalize(8),
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: normalize(3),
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStart: {
    fontSize: normalize(11),
    color: colors.textTertiary,
    fontWeight: '600',
  },
  progressGoal: {
    fontSize: normalize(11),
    color: colors.primary,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: normalize(16),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: normalize(20),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: normalize(3),
  },
  heroStatLabel: {
    fontSize: normalize(10),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: normalize(28),
    backgroundColor: colors.border,
  },
  section: {
    paddingHorizontal: normalize(16),
    marginBottom: normalize(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(10),
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekCount: {
    fontSize: normalize(11),
    fontWeight: '700',
    color: colors.primary,
  },
  weekGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: normalize(12),
    padding: normalize(12),
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekItem: {
    alignItems: 'center',
  },
  weekCircle: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCircleToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDay: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  weekDayToday: {
    color: colors.bg,
    fontWeight: '700',
  },
  weekDayInactive: {
    color: colors.textTertiary,
  },
  avgBadge: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: normalize(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  avgValue: {
    fontSize: normalize(14),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  avgLabel: {
    fontSize: normalize(9),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    padding: normalize(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconWrapper: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  emptyTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(4),
  },
  emptySubtitle: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    pointerEvents: 'box-none',
  },
  fab: {
    position: 'relative',
    borderRadius: normalize(20),
    overflow: 'hidden',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    paddingVertical: normalize(18),
    paddingHorizontal: normalize(24),
  },
  fabText: {
    fontSize: normalize(16),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default WeightSummaryView;
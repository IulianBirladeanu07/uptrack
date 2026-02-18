import { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import WeightChart from './WeightChart';

const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const calculateStreak = (weeklyData) => {
  if (!weeklyData?.days) return 0;
  const todayIndex = new Date().getDay();
  let count = 0;

  for (let i = 0; i < 7; i++) {
    const dayIndex = (todayIndex - i + 7) % 7;
    const dayKey = WEEK_DAYS[dayIndex];
    if (weeklyData.days[dayKey] != null) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

const WeightSummaryView = ({
  currentWeight,
  weeklyData,
  weeklyAverage,
  trendData,
  setActiveView,
  userId,
  goalWeight = 78.0,
  startWeight = 87.0,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const weightChange = currentWeight - startWeight;
  const isGain = weightChange > 0;
  const remaining = Math.max(0, currentWeight - goalWeight);
  
  const totalTrip = startWeight - goalWeight;
  const progressToGoal = startWeight - currentWeight;
  const progressPercent = totalTrip > 0 ? (progressToGoal / totalTrip) * 100 : 0;
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);

  const streak = useMemo(() => calculateStreak(weeklyData), [weeklyData]);

  const weeklyChange = useMemo(() => {
    if (!trendData || trendData.length < 2) return 0;
    const sorted = [...trendData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const weekAgo = sorted[Math.max(0, sorted.length - 8)];
    const latest = sorted[sorted.length - 1];
    return latest.weight - weekAgo.weight;
  }, [trendData]);

  const dashboardStats = useMemo(() => {
    if (!trendData || trendData.length < 2) return { canCompare: false };

    const sortedData = [...trendData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentWeek = sortedData.slice(-7);
    const lastWeek = sortedData.slice(-14, -7);

    if (lastWeek.length === 0) return { canCompare: false, currentAvg: currentWeek.reduce((acc, curr) => acc + curr.weight, 0) / currentWeek.length };

    const currentAvg = currentWeek.reduce((acc, curr) => acc + curr.weight, 0) / currentWeek.length;
    const lastAvg = lastWeek.reduce((acc, curr) => acc + curr.weight, 0) / lastWeek.length;
    const diff = currentAvg - lastAvg;

    return {
      canCompare: true,
      currentAvg,
      lastAvg,
      diff,
      trend: diff <= 0 ? 'down' : 'up'
    };
  }, [trendData]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.scrollView}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.floatingHeader}>
            <Text style={styles.headerTitle}>Your Journey</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={14} color={colors.accent.primary} />
                <Text style={styles.streakBadgeText}>{streak} day streak</Text>
              </View>
            )}
          </View>

          <View style={styles.heroContainer}>
            <View style={styles.heroGlassCard}>
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
                  <View style={[styles.progressBar, { width: `${clampedProgress}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressStart}>{startWeight} kg</Text>
                  <View style={styles.percentBadge}>
                     <Text style={styles.percentText}>{clampedProgress.toFixed(0)}%</Text>
                  </View>
                  <Text style={styles.progressGoal}>{goalWeight} kg</Text>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: isGain ? colors.accent.error : colors.accent.success }]}>
                    {isGain ? '+' : ''}{weightChange.toFixed(1)}
                  </Text>
                  <Text style={styles.heroStatLabel}>{isGain ? 'Gained' : 'Lost'}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{remaining.toFixed(1)}</Text>
                  <Text style={styles.heroStatLabel}>To Go</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: weeklyChange > 0 ? colors.accent.error : colors.accent.success }]}>
                    {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}
                  </Text>
                  <Text style={styles.heroStatLabel}>Weekly</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progress Chart</Text>
              <View style={styles.avgBadge}>
                <Text style={styles.avgValue}>{weeklyAverage?.toFixed(1)}</Text>
                <Text style={styles.avgLabel}>Avg</Text>
              </View>
            </View>
            
            <WeightChart data={trendData} />

            <View style={styles.dashboardGrid}>
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonTitle}>Weekly Trend</Text>
                  {dashboardStats.canCompare && (
                    <View style={[
                      styles.trendBadge, 
                      { backgroundColor: dashboardStats.trend === 'down' ? colors.faded.success : colors.faded.error }
                    ]}>
                      <MaterialCommunityIcons 
                        name={dashboardStats.trend === 'down' ? 'trending-down' : 'trending-up'} 
                        size={16} 
                        color={dashboardStats.trend === 'down' ? colors.accent.success : colors.accent.error} 
                      />
                      <Text style={[styles.trendText, { color: dashboardStats.trend === 'down' ? colors.accent.success : colors.accent.error }]}>
                        {Math.abs(dashboardStats.diff).toFixed(1)} kg
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.comparisonRow}>
                  <View>
                    <Text style={styles.compLabel}>Last Week</Text>
                    <Text style={styles.compValue}>{dashboardStats.lastAvg?.toFixed(1) || '--.-'}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text.tertiary} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.compLabel}>This Week</Text>
                    <Text style={styles.compValue}>{dashboardStats.currentAvg?.toFixed(1) || '--.-'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setActiveView('input')}>
          <LinearGradient colors={[colors.accent.primary, colors.accent.primaryDark]} style={styles.fabGradient}>
            <MaterialCommunityIcons name="scale-bathroom" size={20} color={colors.text.primary} />
            <Text style={styles.fabText}>Log Weight</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  wrapper: { flex: 1, backgroundColor: colors.background.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing[24] },
  container: { paddingTop: spacing[16] },
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingTop: spacing[10], zIndex: 10,
  },
  headerTitle: { fontSize: fontSize[24], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    backgroundColor: colors.background.secondary, paddingHorizontal: spacing[2],
    paddingVertical: spacing[1], borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default,
  },
  streakBadgeText: { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.primary },
  heroContainer: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[4] },
  heroGlassCard: {
    backgroundColor: colors.background.secondary, borderRadius: radius[6],
    padding: spacing[5], borderWidth: 1, borderColor: colors.border.default,
  },
  weightDisplay: { alignItems: 'center', marginBottom: spacing[4] },
  weightLabel: { fontSize: fontSize[12], color: colors.text.tertiary, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  weightValueContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[1] },
  weightValue: { fontSize: fontSize[48], fontWeight: fontWeight.black, color: colors.text.primary },
  weightUnit: { backgroundColor: colors.background.tertiary, padding: 4, borderRadius: radius[2], marginBottom: 8 },
  weightUnitText: { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.text.secondary },
  progressContainer: { marginBottom: spacing[5] },
  progressTrack: { height: 8, backgroundColor: colors.background.tertiary, borderRadius: 4, overflow: 'hidden', marginBottom: spacing[2] },
  progressBar: { height: '100%', backgroundColor: colors.accent.primary },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressStart: { fontSize: fontSize[12], color: colors.text.tertiary, fontWeight: fontWeight.bold },
  percentBadge: { backgroundColor: colors.background.tertiary, paddingHorizontal: spacing[2], borderRadius: radius[2] },
  percentText: { fontSize: fontSize[10], fontWeight: fontWeight.bold, color: colors.accent.primary },
  progressGoal: { fontSize: fontSize[12], color: colors.accent.primary, fontWeight: fontWeight.bold },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.border.default },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { fontSize: fontSize[18], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  heroStatLabel: { fontSize: fontSize[10], color: colors.text.tertiary, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, height: spacing[6], backgroundColor: colors.border.default },
  section: { paddingHorizontal: spacing[4] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  sectionTitle: { fontSize: fontSize[18], fontWeight: fontWeight.bold, color: colors.text.primary },
  avgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgValue: { fontSize: fontSize[14], fontWeight: fontWeight.extrabold, color: colors.text.primary },
  avgLabel: { fontSize: fontSize[10], color: colors.text.tertiary, fontWeight: fontWeight.bold },
  dashboardGrid: { marginTop: spacing[4], gap: spacing[3] },
  comparisonCard: { backgroundColor: colors.background.secondary, padding: spacing[4], borderRadius: radius[4], borderWidth: 1, borderColor: colors.border.default },
  comparisonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
  comparisonTitle: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius[2], gap: 4 },
  trendText: { fontSize: fontSize[12], fontWeight: fontWeight.bold },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compLabel: { fontSize: fontSize[10], color: colors.text.tertiary, textTransform: 'uppercase', marginBottom: 2 },
  compValue: { fontSize: fontSize[18], fontWeight: fontWeight.bold, color: colors.text.primary },
  fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing[4] },
  fab: { borderRadius: radius[5], overflow: 'hidden', elevation: 8, shadowColor: colors.background.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  fabText: { fontSize: fontSize[16], fontWeight: fontWeight.extrabold, color: colors.text.primary },
}));

export default WeightSummaryView;
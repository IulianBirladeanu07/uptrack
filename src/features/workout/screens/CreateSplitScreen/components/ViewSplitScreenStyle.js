import { StyleSheet } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const theme = {
  background: '#02111B',
  cardBackground: 'rgba(30, 41, 59, 0.4)',
  cardBackgroundDark: 'rgba(30, 41, 59, 0.5)',
  gradientOverlay: 'rgba(255, 133, 53, 0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#d1d5db',
  textInactive: 'rgba(255, 255, 255, 0.4)',
  textMuted: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  accentPrimary: '#ff8535',
  accentSecondary: '#00d4ff',
  accentPurple: '#a855f7',
};

export const COLORS = {
  primary: theme.accentPrimary,
  secondary: theme.background,
  accentPrimary: theme.accentPrimary,
  accentSecondary: theme.accentSecondary,
  accentPurple: theme.accentPurple,
  background: theme.background,
  card: theme.cardBackground,
  cardDark: theme.cardBackgroundDark,
  cardBackground: theme.cardBackground,
  cardBackgroundDark: theme.cardBackgroundDark,
  textPrimary: theme.textPrimary,
  textSecondary: theme.textSecondary,
  textInactive: theme.textInactive,
  textMuted: theme.textMuted,
  border: theme.border,
  borderDivider: theme.borderDivider,
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.3)',
  success: '#10b981',
  warning: '#facc15',
  error: '#ef4444',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
  restTag: 'rgba(156, 163, 175, 0.2)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header Styles
  header: {
    backgroundColor: COLORS.cardBackgroundDark,
    paddingTop: normalize(50),
    paddingBottom: normalize(20),
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    paddingHorizontal: normalize(20),
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(16),
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  splitName: {
    fontSize: normalize(22),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(4),
    textAlign: 'center',
  },
  splitType: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerAction: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(16),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(12),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  statValue: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(2),
  },
  statLabel: {
    fontSize: normalize(11),
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: normalize(20),
    marginVertical: normalize(20),
    borderRadius: normalize(14),
    padding: normalize(4),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(8),
    borderRadius: normalize(10),
    gap: normalize(6),
  },
  tabActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  tabText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.background,
  },

  // Content Container
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(30),
  },

  // Overview Tab - Performance Metrics
  overviewCard: {
    backgroundColor: COLORS.cardBackgroundDark,
    borderRadius: normalize(18),
    padding: normalize(20),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    marginBottom: normalize(20),
  },
  overviewTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: normalize(16),
  },
  
  performanceMetrics: {
    marginBottom: normalize(20),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(12),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    marginBottom: normalize(4),
    fontWeight: '500',
  },
  metricValue: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Completion Chart
  completionChart: {
    marginTop: normalize(16),
  },
  chartTitle: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: normalize(12),
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: normalize(80),
    paddingHorizontal: normalize(8),
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: normalize(2),
  },
  barBackground: {
    width: normalize(20),
    height: normalize(60),
    backgroundColor: COLORS.progressBarTrack,
    borderRadius: normalize(4),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: normalize(4),
    minHeight: normalize(4),
  },
  barLabel: {
    fontSize: normalize(10),
    color: COLORS.textMuted,
    marginTop: normalize(6),
    fontWeight: '500',
  },

  // Recent Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
  },
  activityIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(4),
  },
  activityTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activityDate: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
  },
  activityMeta: {
    fontSize: normalize(12),
    color: COLORS.textSecondary,
  },

  // Progress Tab
  timeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: normalize(12),
    padding: normalize(4),
    marginBottom: normalize(20),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },
  timePeriodButton: {
    flex: 1,
    paddingVertical: normalize(10),
    alignItems: 'center',
    borderRadius: normalize(8),
  },
  timePeriodActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  timePeriodText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  timePeriodTextActive: {
    color: COLORS.background,
  },

  // Strength Progress
  strengthItem: {
    marginBottom: normalize(16),
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  strengthExercise: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  strengthGain: {
    fontSize: normalize(14),
    fontWeight: '700',
  },
  strengthProgress: {
    marginTop: normalize(4),
  },
  progressTrack: {
    height: normalize(6),
    backgroundColor: COLORS.progressBarTrack,
    borderRadius: normalize(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: normalize(3),
  },

  // Muscle Group Progress
  muscleProgressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
  },
  muscleProgressName: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  muscleProgressStats: {
    flexDirection: 'row',
    gap: normalize(16),
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: normalize(10),
    color: COLORS.textMuted,
    marginBottom: normalize(2),
  },
  progressStatValue: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: COLORS.success,
  },

  // Schedule Tab - Day Selector
  daySelectorContainer: {
    marginBottom: normalize(24),
  },
  daySelector: {
    paddingHorizontal: normalize(4),
    gap: normalize(8),
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    backgroundColor: COLORS.cardBackground,
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    minWidth: normalize(70),
  },
  dayPillSelected: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  dayPillHasWorkout: {
    backgroundColor: COLORS.cardBackgroundDark,
    borderColor: COLORS.accentSecondary,
  },
  dayPillRest: {
    backgroundColor: COLORS.restTag,
    borderColor: COLORS.border,
  },
  dayPillText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: normalize(2),
  },
  dayPillTextSelected: {
    color: COLORS.background,
  },
  dayPillTextHasWorkout: {
    color: COLORS.accentSecondary,
  },
  dayPillTextRest: {
    color: COLORS.textMuted,
  },
  dayPillLabel: {
    fontSize: normalize(10),
    fontWeight: '500',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  dayPillLabelSelected: {
    color: COLORS.background,
  },
  dayPillLabelHasWorkout: {
    color: COLORS.textSecondary,
  },
  dayPillLabelRest: {
    color: COLORS.textMuted,
  },

  // Selected Day Content
  selectedDayContainer: {
    marginTop: normalize(8),
  },
  workoutCard: {
    backgroundColor: COLORS.cardBackgroundDark,
    borderRadius: normalize(18),
    padding: normalize(20),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  workoutIconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    backgroundColor: COLORS.accentPrimaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(16),
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: normalize(4),
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: normalize(16),
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  workoutMetaText: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
  },
  exercisesList: {
    backgroundColor: COLORS.background,
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: normalize(20),
  },
  exercisesTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: normalize(12),
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  exerciseMuscle: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    marginTop: normalize(2),
  },
  exerciseStats: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  moreExercisesText: {
    fontSize: normalize(12),
    color: COLORS.accentPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: normalize(12),
  },

  // Rest Day Card
  restDayCard: {
    backgroundColor: COLORS.cardBackgroundDark,
    borderRadius: normalize(18),
    padding: normalize(24),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: normalize(200),
  },
  restDayIcon: {
    marginBottom: normalize(16),
  },
  restDayTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: normalize(8),
  },
  restDayDescription: {
    fontSize: normalize(14),
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: normalize(20),
  },

  // Buttons
  startWorkoutButton: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },
  startWorkoutText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.background,
  },
  activateButton: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    marginTop: normalize(24),
  },
  activateButtonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.background,
  },
});

export default styles;
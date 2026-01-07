import { StyleSheet } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#ef4444',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

export const COLORS = {
  primary: colors.primary,
  background: colors.bg,
  surface: colors.surface,
  surfaceLight: colors.surfaceLight,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textTertiary: colors.textTertiary,
  border: colors.border,
  borderLight: colors.borderLight,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  cyan: colors.cyan,
  purple: colors.purple,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: normalize(20),
  },
  emptyIcon: {
    marginBottom: normalize(16),
  },
  emptyTitle: {
    fontSize: normalize(22),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(8),
    textAlign: 'center',
  },

  header: {
    backgroundColor: colors.surface,
    paddingTop: normalize(60),
    paddingBottom: normalize(16),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.border,
  },
  headerContent: {
    paddingHorizontal: normalize(20),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: normalize(1),
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(16),
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  splitName: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(4),
    textAlign: 'center',
  },
  splitType: {
    fontSize: normalize(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerAction: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: normalize(1),
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(14),
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(12),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(6),
  },
  statValue: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(2),
  },
  statLabel: {
    fontSize: normalize(10),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: normalize(20),
    marginVertical: normalize(16),
    borderRadius: normalize(12),
    padding: normalize(4),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(8),
    borderRadius: normalize(8),
    gap: normalize(6),
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.bg,
  },

  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(30),
  },

  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    padding: normalize(18),
    borderWidth: normalize(1),
    borderColor: colors.border,
    marginBottom: normalize(16),
  },
  overviewTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: normalize(14),
  },
  
  performanceMetrics: {
    marginBottom: normalize(16),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(10),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: normalize(11),
    color: colors.textTertiary,
    marginBottom: normalize(4),
    fontWeight: '500',
  },
  metricValue: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },

  completionChart: {
    marginTop: normalize(14),
  },
  chartTitle: {
    fontSize: normalize(13),
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: normalize(10),
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: normalize(70),
    paddingHorizontal: normalize(6),
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: normalize(2),
  },
  barBackground: {
    width: normalize(18),
    height: normalize(55),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: normalize(9),
    color: colors.textTertiary,
    marginTop: normalize(4),
    fontWeight: '500',
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(10),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
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
    marginBottom: normalize(2),
  },
  activityTitle: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activityDate: {
    fontSize: normalize(11),
    color: colors.textTertiary,
  },
  activityMeta: {
    fontSize: normalize(11),
    color: colors.textSecondary,
  },

  timeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: normalize(10),
    padding: normalize(4),
    marginBottom: normalize(16),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  timePeriodButton: {
    flex: 1,
    paddingVertical: normalize(8),
    alignItems: 'center',
    borderRadius: normalize(6),
  },
  timePeriodActive: {
    backgroundColor: colors.primary,
  },
  timePeriodText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  timePeriodTextActive: {
    color: colors.bg,
  },

  strengthItem: {
    marginBottom: normalize(14),
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(6),
  },
  strengthExercise: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  strengthGain: {
    fontSize: normalize(13),
    fontWeight: '700',
  },
  strengthProgress: {
    marginTop: normalize(4),
  },
  progressTrack: {
    height: normalize(5),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalize(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: normalize(3),
  },

  muscleProgressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(10),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
  },
  muscleProgressName: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  muscleProgressStats: {
    flexDirection: 'row',
    gap: normalize(14),
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: normalize(9),
    color: colors.textTertiary,
    marginBottom: normalize(2),
  },
  progressStatValue: {
    fontSize: normalize(11),
    fontWeight: '600',
    color: colors.primary,
  },

  daySelectorContainer: {
    marginBottom: normalize(20),
  },
  daySelector: {
    paddingHorizontal: normalize(4),
    gap: normalize(8),
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    backgroundColor: colors.surface,
    borderWidth: normalize(1),
    borderColor: colors.border,
    minWidth: normalize(65),
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPillHasWorkout: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primary,
  },
  dayPillRest: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: colors.border,
  },
  dayPillText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.textTertiary,
    marginBottom: normalize(2),
  },
  dayPillTextSelected: {
    color: colors.bg,
  },
  dayPillTextHasWorkout: {
    color: colors.primary,
  },
  dayPillTextRest: {
    color: colors.textTertiary,
  },
  dayPillLabel: {
    fontSize: normalize(9),
    fontWeight: '500',
    color: colors.textTertiary,
  },
  dayPillLabelSelected: {
    color: colors.bg,
  },
  dayPillLabelHasWorkout: {
    color: colors.textSecondary,
  },
  dayPillLabelRest: {
    color: colors.textTertiary,
  },

  selectedDayContainer: {
    marginTop: normalize(8),
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    padding: normalize(18),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  workoutIconContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(14),
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: normalize(4),
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: normalize(12),
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  workoutMetaText: {
    fontSize: normalize(11),
    color: colors.textTertiary,
  },
  exercisesList: {
    backgroundColor: colors.bg,
    borderRadius: normalize(10),
    padding: normalize(14),
    marginBottom: normalize(16),
  },
  exercisesTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: normalize(10),
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(10),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  exerciseMuscle: {
    fontSize: normalize(11),
    color: colors.textTertiary,
    marginTop: normalize(2),
  },
  exerciseStats: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  moreExercisesText: {
    fontSize: normalize(11),
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: normalize(10),
  },

  restDayCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    padding: normalize(24),
    borderWidth: normalize(1),
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: normalize(180),
  },
  restDayIcon: {
    marginBottom: normalize(12),
  },
  restDayTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(6),
  },
  restDayDescription: {
    fontSize: normalize(13),
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: normalize(20),
  },

  startWorkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: normalize(10),
    paddingVertical: normalize(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
  },
  startWorkoutText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.bg,
  },
  activateButton: {
    backgroundColor: colors.primary,
    borderRadius: normalize(10),
    paddingVertical: normalize(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
    marginTop: normalize(20),
  },
  activateButtonText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.bg,
  },
});

export default styles;
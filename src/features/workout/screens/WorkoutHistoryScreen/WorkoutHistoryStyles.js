// WorkoutHistoryStyles.js
import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  primary: '#FF9500',
  cyan: '#06B6D4',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(8),
    paddingBottom: normalize(90),
  },
  heading: {
    fontSize: normalize(32),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(20),
    letterSpacing: -0.5,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(12),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(14),
    paddingBottom: normalize(14),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
    minHeight: normalize(50),
  },
  headerLeft: {
    flex: 1,
    paddingRight: normalize(12),
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  workoutTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: normalize(5),
  },
  dateText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: normalize(20),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  statText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
    gap: normalize(4),
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 149, 0, 0.3)',
    marginTop: normalize(4),
  },
  prText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: colors.primary,
  },
  exercisesList: {
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(10),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
  },
  exerciseRowLast: {
    borderBottomWidth: 0,
  },
  exerciseLeft: {
    flex: 1,
    marginRight: normalize(12),
  },
  exerciseName: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: normalize(3),
    letterSpacing: -0.2,
  },
  exerciseSets: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: colors.textTertiary,
  },
  bestSetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
    borderWidth: normalize(1),
    borderColor: colors.borderLight,
  },
  bestSetText: {
    fontSize: normalize(13),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(10),
    marginTop: normalize(8),
    gap: normalize(6),
  },
  showMoreText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: colors.cyan,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: normalize(120),
    paddingHorizontal: normalize(40),
  },
  emptyIconContainer: {
    width: normalize(110),
    height: normalize(110),
    borderRadius: normalize(55),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(24),
    borderWidth: normalize(2),
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(8),
  },
  emptySubtitle: {
    fontSize: normalize(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: normalize(20),
  },
});

export default styles;
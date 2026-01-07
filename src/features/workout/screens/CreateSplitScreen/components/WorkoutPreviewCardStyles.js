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

const styles = StyleSheet.create({
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    marginBottom: normalize(8),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  workoutCardAssigned: {
    borderColor: colors.primary,
    borderWidth: normalize(1),
    backgroundColor: colors.surface,
  },
  workoutCardExpanded: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  workoutCardAssignedExpanded: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: normalize(1.5),
  },

  cardContainer: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: normalize(12),
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    minWidth: normalize(40),
  },
  addButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255, 149, 0, 0.06)',
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: normalize(1),
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },

  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(6),
    minHeight: normalize(22),
  },
  workoutName: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  assignedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(6),
    marginLeft: normalize(8),
  },
  assignedText: {
    fontSize: normalize(9),
    fontWeight: '700',
    color: colors.bg,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    minHeight: normalize(20),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  metaText: {
    fontSize: normalize(12),
    color: colors.textTertiary,
    fontWeight: '500',
  },
  metaDivider: {
    width: normalize(1),
    height: normalize(12),
    backgroundColor: colors.borderLight,
  },
  restMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
  },

  expandedContent: {
    borderTopWidth: normalize(1),
    borderTopColor: colors.borderLight,
  },
  exerciseList: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(12),
    borderBottomWidth: normalize(1),
    borderBottomColor: colors.borderLight,
  },
  exerciseRowLast: {
    borderBottomWidth: 0,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: normalize(12),
  },
  exerciseName: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: normalize(4),
  },
  exerciseMuscle: {
    fontSize: normalize(12),
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  exerciseStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    borderWidth: normalize(1),
    borderColor: colors.border,
  },
  exerciseStatsText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: colors.textSecondary,
  },

  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
    paddingVertical: normalize(12),
    marginTop: normalize(12),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: normalize(1),
    borderColor: colors.primary,
  },
  showMoreText: {
    fontSize: normalize(13),
    color: colors.primary,
    fontWeight: '600',
  },
});

export default styles;
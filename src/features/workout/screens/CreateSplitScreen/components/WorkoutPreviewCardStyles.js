import { StyleSheet } from 'react-native';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  background: '#02111B',
  cardBackground: 'rgba(30, 41, 59, 0.5)',
  cardBackgroundDark: 'rgba(15, 23, 42, 0.8)',
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
  success: '#10b981',
  warning: '#facc15',
  error: '#ef4444',
  shadow: 'rgba(0, 0, 0, 0.3)',
  mutedOrange: 'rgba(255, 133, 53, 0.8)',
  mutedBlue: 'rgba(0, 212, 255, 0.7)',
  mutedPurple: 'rgba(168, 85, 247, 0.8)',
  mutedGreen: 'rgba(16, 185, 129, 0.8)',
  mutedYellow: 'rgba(245, 158, 11, 0.8)',
  mutedRed: 'rgba(239, 68, 68, 0.8)',
  mutedGray: 'rgba(107, 114, 128, 0.3)',
  workoutCardBg: 'rgba(255, 133, 53, 0.15)',
  restCardBg: 'rgba(0, 212, 255, 0.1)',
  accentPrimaryFaded: 'rgba(255, 133, 53, 0.15)',
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
};

export default StyleSheet.create({
  // Card Container - Enhanced with better interaction feedback
  workoutCard: {
    backgroundColor: COLORS.cardBackgroundDark,
    borderRadius: normalize(16),
    marginBottom: normalize(5),
    marginHorizontal: normalize(2),
    borderWidth: normalize(1),
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
  },
  workoutCardAssigned: {
    borderColor: 'rgba(255, 133, 53, 0.6)',
    borderWidth: normalize(1),
  },
  workoutCardExpanded: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.15)', // Default expanded border color
  },
  // New style to combine assigned border with expanded background
  workoutCardAssignedExpanded: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255, 133, 53, 0.6)', // Keep the orange border when expanded
  },

  // Main Card Structure - Now tappable for expand
  cardContainer: {
    flex: 1,
  },

  // Header Layout - Now includes action buttons
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(12),
    paddingBottom: normalize(12),
    paddingRight: normalize(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: normalize(12),
  },

  // Header Actions - New action button area
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    marginLeft: normalize(8),
    paddingLeft: normalize(4),
  },
  addButton: {
    padding: normalize(8),
    borderRadius: normalize(20),
    backgroundColor: COLORS.accentPrimaryFaded,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  removeButton: {
    padding: normalize(8),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: normalize(1),
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Icon - Enhanced with better proportions
  workoutIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(16),
    flexShrink: 0,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Header Content - Improved vertical rhythm
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: normalize(44),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Use flexWrap to allow the badge to wrap if the name is too long,
    // but keep it on the same line if possible.
    flexWrap: 'wrap',
    marginBottom: normalize(6),
  },
  workoutName: {
    fontSize: normalize(17),
    fontWeight: '600',
    color: COLORS.textPrimary,
    // flex: 1, // Remove flex to allow the badge to sit right next to it
    lineHeight: normalize(22),
    marginRight: normalize(8),
  },
  assignedBadge: {
    backgroundColor: COLORS.accentPrimaryFaded,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(6),
    borderWidth: normalize(0.5),
    borderColor: 'rgba(255, 133, 53, 0.3)',
  },
  assignedText: {
    fontSize: normalize(9),
    fontWeight: '700',
    color: COLORS.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Metadata Row - Enhanced spacing and alignment
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: normalize(4),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  metaText: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: normalize(16),
  },
  metaDivider: {
    width: normalize(1),
    height: normalize(12),
    backgroundColor: COLORS.borderDivider,
    marginHorizontal: normalize(5),
  },
  restMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    backgroundColor: COLORS.mutedGray,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
    borderWidth: normalize(0.5),
    borderColor: 'rgba(156, 163, 175, 0.15)',
  },

  expandFooter: {
    display: 'none',
  },
  expandFooterExpanded: {
    display: 'none',
  },
  expandHint: {
    display: 'none',
  },
  expandHintText: {
    display: 'none',
  },
  noExercisesFooter: {
    display: 'none',
  },
  noExercisesText: {
    display: 'none',
  },

  // Expanded Content - Enhanced visual separation
  expandedContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderTopWidth: normalize(1),
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseList: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(5),
    paddingBottom: normalize(16)
  },

  // Exercise Rows - Clean alignment
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(10),
    borderBottomWidth: normalize(1),
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
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
    color: COLORS.textPrimary,
    marginBottom: normalize(2),
    lineHeight: normalize(18),
  },
  exerciseMuscle: {
    fontSize: normalize(11),
    color: COLORS.textMuted,
    fontWeight: '400',
    textTransform: 'capitalize',
  },
  exerciseStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(8),
    minWidth: normalize(65),
    alignItems: 'center',
    borderWidth: normalize(0.5),
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseStatsText: {
    fontSize: normalize(11),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Show More Button - Enhanced styling
  showMoreButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(6),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    marginTop: normalize(8),
    borderRadius: normalize(8),
    backgroundColor: COLORS.accentPrimaryFaded,
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.15)',
  },
  showMoreText: {
    fontSize: normalize(12),
    color: COLORS.accentPrimary,
    fontWeight: '600',
  },

  // Clean up - remove old unused styles
  cardTapHint: {
    display: 'none',
  },
  cardTapHintText: {
    display: 'none',
  },
  expandToggle: {
    display: 'none',
  },
  expandToggleExpanded: {
    display: 'none',
  },
  expandButton: {
    display: 'none',
  },
  expandButtonText: {
    display: 'none',
  },
  floatingActionButton: {
    display: 'none',
  },
  actionSection: {
    display: 'none',
  },
});
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  workoutCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  workoutCardAssigned: {
    borderColor: colors.border.primarySelected,
    borderWidth: 1.5,
    backgroundColor: colors.background.selectedCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  workoutName: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  assignedBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius[2],
  },
  assignedText: {
    fontSize: fontSize[8],
    fontWeight: fontWeight.bold,
    color: colors.accent.buttonText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    fontWeight: fontWeight.medium,
  },
  metaDivider: {
    width: 1,
    height: spacing[3],
    backgroundColor: colors.border.light,
  },
  restMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.faded.surfaceMedium,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius[2],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  selectionButton: {
    alignSelf: 'center',
    padding: spacing[2],
    borderRadius: radius[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: colors.faded.surfaceMedium,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  removeButton: {
    backgroundColor: colors.faded.successAlt,
    borderWidth: 1,
    borderColor: colors.border.successAlt,
  },
  chevronButton: {
    width: spacing[8],
    height: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[2],
  },
  exerciseRowLast: {
    borderBottomWidth: 0,
  },
  exerciseSetsInline: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    width: spacing[6],
  },
  exerciseName: {
    flex: 1,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  exerciseReps: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    color: colors.text.quaternary,
  },
  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  showMoreLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  showMoreText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.accent.primary,
  },
}));

export default styles;
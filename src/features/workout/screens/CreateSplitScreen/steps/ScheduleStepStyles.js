import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing[5],
  },
  fixedHeader: {
    paddingVertical: spacing[3],
  },
  scrollableContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  addWorkoutTextButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWorkoutText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.accent.primary,
    letterSpacing: -0.2,
  },
  dayPillsScrollView: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
  },
  dayPillsContainer: {
    paddingHorizontal: spacing[1],
  },
  dayPills: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing[1],
  },
  dayCircle: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[5],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dayCircleHasWorkout: {
    backgroundColor: colors.faded.primary,
    borderColor: colors.border.primaryAlt,
  },
  dayCircleSelected: {
    backgroundColor: colors.faded.primaryLight,
    borderColor: colors.accent.primary,
  },
  dayCircleSelectedHasWorkout: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  dayCircleText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.text.quaternary,
  },
  dayCircleTextHasWorkout: {
    color: colors.accent.primary,
  },
  dayCircleTextSelected: {
    color: colors.accent.buttonText,
  },
  dayLabel: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.medium,
    color: colors.text.quaternary,
  },
  dayLabelSelected: {
    color: colors.accent.primary,
    fontWeight: fontWeight.semibold,
  },
  settingsButton: {
    width: spacing[10],
    height: spacing[10],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: radius[5],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: radius[4],
    width: '100%',
    maxWidth: spacing[100],
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[2],
  },
  modalTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: spacing[1],
  },
  modalBody: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  modalLabel: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  modalInput: {
    height: spacing.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius[3],
    paddingHorizontal: spacing[4],
    fontSize: fontSize[16],
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },
  modalHint: {
    fontSize: fontSize[14],
    color: colors.text.quaternary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  modalButtonSecondary: {
    flex: 1,
    height: spacing.inputHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[3],
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalButtonSecondaryText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  modalButtonPrimary: {
    flex: 1,
    height: spacing.inputHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[3],
    backgroundColor: colors.accent.primary,
  },
  modalButtonPrimaryText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    color: colors.accent.buttonText,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[2],
  },
  contextText: {
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  contextLeft: {
    flex: 1,
  },
  contextRight: {
    alignItems: 'flex-end',
  },
  contextSubtext: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    marginTop: spacing[1],
  },
  availableCount: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    fontWeight: fontWeight.medium,
  },
  workoutsList: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[10],
  },
  emptyStateIcon: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyStateTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: fontSize[16],
    color: colors.text.quaternary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: fontSize[22],
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius[3],
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyStateButtonText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.accent.cyan,
  },
}));

export default styles;
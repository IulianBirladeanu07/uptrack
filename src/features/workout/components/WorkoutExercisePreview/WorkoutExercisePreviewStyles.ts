import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const styles = createStyles(() => ({
  list: {
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[2],
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  sets: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    width: spacing[6],
  },
  name: {
    flex: 1,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  reps: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    color: colors.text.quaternary,
  },
  startButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[3],
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  startButtonDisabled: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.accent.buttonText,
    letterSpacing: 0.3,
  },
  startButtonTextDisabled: {
    color: colors.text.quaternary,
  },
}));

export default styles;

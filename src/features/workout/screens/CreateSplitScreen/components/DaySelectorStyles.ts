import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingHorizontal: spacing[1],
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
    backgroundColor: colors.faded.surface,
  },
  dayCircleHasWorkout: {
    backgroundColor: colors.faded.primaryLight,
    borderColor: colors.accent.primary,
  },
  dayCircleSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  dayCircleText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.text.quaternary,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: fontSize[14],
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
}));

export default styles;
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  sectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  orangeIconContainer: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius[2],
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.faded.surface,
    borderRadius: radius[2],
    padding: spacing[3],
    fontSize: fontSize[14],
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  workoutNameInput: {
    height: spacing.inputHeight,
  },
  notesInput: {
    minHeight: spacing[30],
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  noteHelperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  noteHelper: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
  },
  charCount: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
  },
  splitTypeContainer: {
    gap: spacing[2],
  },
  splitTypeOption: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  splitTypeOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.faded.primary,
  },
  splitTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  splitTypeIcon: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[2],
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTypeIconSelected: {
    backgroundColor: colors.text.primary,
  },
  splitTypeTextContainer: {
    flex: 1,
  },
  splitTypeTitle: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.quaternary,
  },
  splitTypeTitleSelected: {
    color: colors.text.primary,
  },
  splitTypeSubtitle: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
  },
  splitTypeSubtitleSelected: {
    color: colors.text.quaternary,
  },
  splitTypeCheck: {
    width: spacing[6],
    height: spacing[6],
    borderRadius: radius[3],
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTypeCheckSelected: {
    backgroundColor: colors.text.primary,
  },
}));

export default styles;
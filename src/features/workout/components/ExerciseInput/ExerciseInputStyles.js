import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

export const styles = createStyles(() => ({
  exerciseCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius[5],
    marginHorizontal: spacing[3],
    marginBottom: spacing[5],
    overflow: 'hidden',
  },
  dataGrid: {
    backgroundColor: 'transparent',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  gridHeaderText: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  gridHeaderSet: {
    width: spacing[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridHeaderPrev: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  gridHeaderWeight: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  gridHeaderReps: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  gridHeaderStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holoAddBtn: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    backgroundColor: colors.faded.primary,
    borderColor: colors.border.primary,
    borderWidth: 1,
    borderRadius: radius[3],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
  },
  holoAddBtnText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    letterSpacing: 0.3,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: fontSize[14],
    padding: spacing[4],
    textAlign: 'center',
  },
  surfaceLight: colors.background.tertiary,
}));
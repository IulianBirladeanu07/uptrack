import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[5],
  },
  emptyIcon: {
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSize[22],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  startButton: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius[3],
    backgroundColor: colors.accent.primary,
  },
  startButtonText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.buttonText,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[16],
    paddingBottom: spacing[7],
    gap: spacing[4],
  },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
  },
  heroCardActive: {
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[5],
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  titleSection: {
    flex: 1,
  },
  splitType: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    color: colors.text.quaternary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing[1],
  },
  splitName: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing[4],
    rowGap: spacing[2],
    marginTop: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    color: colors.text.quaternary,
  },
  activateButton: {
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
  activateButtonText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.accent.buttonText,
    letterSpacing: 0.3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primaryLight,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  activeBadgeText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.accent.primary,
  },
  workoutCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
  },
  workoutHeader: {
    marginBottom: spacing[4],
    gap: spacing[1],
  },
  workoutTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  workoutMetaText: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    fontWeight: fontWeight.medium,
  },
  restDayCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayIcon: {
    marginBottom: spacing[3],
  },
  restDayTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  restDayDescription: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    textAlign: 'center',
  },
}));

export default styles;
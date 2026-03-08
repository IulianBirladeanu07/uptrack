import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

export const styles = createStyles(() => ({
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.background.primary,
  },

  content: {
    flex: 1,
  },

  greetingBlock: {
    marginBottom: spacing[4],
  },

  greetingTitle: {
    fontSize: fontSize[28],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },

  greetingDate: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing[1],
  },

  cardLabel: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },

  workoutCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },

  restIconContainer: {
    width: spacing[12],
    height: spacing[12],
    borderRadius: spacing[6],
    backgroundColor: colors.faded.cyan,
    borderWidth: 1,
    borderColor: colors.border.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },

  workoutInfo: {
    flex: 1,
  },

  workoutTitle: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing[1],
  },

  workoutSubtitle: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },

  workoutMeta: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
    marginTop: spacing[1],
  },

  metaText: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },

  playButton: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: spacing[5],
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nutritionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    zIndex: 1,
  },

  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },

  caloriesValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  caloriesValue: {
    fontSize: fontSize[32],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -1,
  },

  caloriesTarget: {
    fontSize: fontSize[18],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing[1],
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },

  remainingText: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[3],
  },

  percentageBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius[2],
  },

  percentageText: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    color: colors.background.primary,
  },

  nutritionProgress: {
    height: spacing[2],
    backgroundColor: colors.border.default,
    borderRadius: radius[3],
    overflow: 'hidden',
    marginBottom: spacing[4],
  },

  nutritionProgressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: radius[3],
  },

  macroRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  macroItem: {
    flex: 1,
    backgroundColor: colors.faded.surfaceLight,
    borderRadius: radius[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },

  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  macroLabel: {
    fontSize: fontSize[8],
    color: colors.text.secondary,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  macroValue: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },

  weeklyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  weeklyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },

  chartTitle: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    color: colors.text.quaternary,
    marginBottom: spacing[3],
  },

  chartContainer: {
    marginBottom: spacing[6],
    marginTop: spacing[5],
    paddingHorizontal: spacing[3],
  },

  chartContent: {
    justifyContent: 'flex-end',
  },

  barsRow: {
    height: spacing[24],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[1],
    marginBottom: spacing[2],
  },

  barContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  barValueText: {
    fontSize: fontSize[8],
    fontWeight: fontWeight.bold,
    color: colors.text.quaternary,
    marginBottom: spacing[1],
  },

  barValueTextToday: {
    color: colors.accent.primary,
  },

  bar: {
    width: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: radius[1],
    minHeight: 4,
    opacity: 0.5,
  },

  barToday: {
    opacity: 1,
  },

  daysRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },

  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },

  dayLabel: {
    fontSize: fontSize[10],
    color: colors.text.quaternary,
    fontWeight: fontWeight.semibold,
  },

  dayLabelToday: {
    color: colors.accent.primary,
    fontWeight: fontWeight.bold,
  },

  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingLeft: spacing[3],
  },

  weeklyStatItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingRight: spacing[3],
  },

  weeklyIconContainer: {
    width: spacing[9],
    height: spacing[9],
    borderRadius: radius[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },

  weeklyStatText: {
    flex: 1,
  },

  weeklyStatValue: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing[1],
  },

  weeklyStatLabel: {
    fontSize: fontSize[10],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
}));
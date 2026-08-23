import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
  volumeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
  },
  cardTitle: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  cardSubtext: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.medium,
    marginBottom: spacing[3],
    color: colors.text.quaternary,
  },
  volumeList: {
    gap: spacing[2],
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  volumeLabel: {
    width: spacing[20],
    flexShrink: 0,
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  volumeBarTrack: {
    flex: 1,
    height: spacing[2],
    borderRadius: radius[1],
    overflow: 'hidden',
    backgroundColor: colors.faded.surface,
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: radius[1],
    minWidth: 3,
    backgroundColor: colors.accent.primary,
  },
  volumeValue: {
    width: spacing[7],
    textAlign: 'right',
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  volumeEmptyText: {
    fontSize: fontSize[12],
    color: colors.text.quaternary,
    fontWeight: fontWeight.medium,
  },
  coverageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  coverageNoteText: {
    flex: 1,
    fontSize: fontSize[11],
    fontWeight: fontWeight.medium,
    color: colors.text.tertiary,
  },
}));

export default styles;
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardIconBox: {
    width: spacing[8],
    height: spacing[8],
    borderRadius: radius[2],
    backgroundColor: colors.faded.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
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
  volumeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    width: spacing[20],
  },
  volumeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  volumeLabel: {
    flexShrink: 1,
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
import { createStyles } from "../../../../shared/theme/createStyles";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../../shared/theme";

const styles = createStyles(() => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4],
    },
    pageTitle: {
        fontSize: fontSize[24],
        fontWeight: fontWeight.extrabold,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    weeksPills: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: 3,
        gap: 2,
    },
    pill: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius[2],
    },
    pillActive: {
        backgroundColor: colors.accent.primary,
    },
    pillText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
    },
    pillTextActive: {
        color: colors.accent.buttonText,
    },

    summaryCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing[4],
        marginBottom: spacing[3],
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4],
    },
    summaryLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.bold,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    onTrackBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: radius[2],
    },
    onTrackText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    statItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingBottom: spacing[3],
        paddingRight: spacing[2],
    },
    statItemRight: {
        paddingRight: 0,
        paddingLeft: spacing[2],
    },
    statIconBox: {
        width: spacing[8],
        height: spacing[8],
        borderRadius: radius[2],
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    statText: {
        flex: 1,
        minWidth: 0,
    },
    statValue: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing[1],
    },

    deltaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: spacing[2],
        paddingVertical: 3,
        borderRadius: radius[1],
        alignSelf: 'flex-start',
    },
    deltaBadgeText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
    },

    metricCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        paddingTop: spacing[4],
        paddingBottom: spacing[2],
        marginBottom: spacing[3],
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[1],
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    cardAccentBar: {
        width: 3,
        height: 14,
        borderRadius: 2,
    },
    cardTitle: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    cardDaysLogged: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    cardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    cardCurrentValue: {
        fontSize: fontSize[22],
        fontWeight: fontWeight.extrabold,
        letterSpacing: -0.5,
    },
    cardSubtext: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        paddingHorizontal: spacing[4],
        marginBottom: spacing[1],
        color: colors.text.quaternary,
    },

    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing[4],
        marginBottom: spacing[2],
        backgroundColor: colors.faded.primaryExtraLight,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radius[2],
        borderWidth: 1,
        borderColor: colors.border.primaryAlt,
    },
    goalText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    goalRemaining: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
    },

    sparkline: {
        marginLeft: -spacing[2],
    },
    sparklineEmpty: {
        marginHorizontal: spacing[4],
        marginBottom: spacing[2],
        height: 56,
        borderRadius: radius[2],
        backgroundColor: colors.faded.surface,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderStyle: 'dashed',
    },

    macroTilesRow: {
        flexDirection: 'row',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[3],
    },
    macroTile: {
        flex: 1,
        borderRadius: radius[2],
        paddingHorizontal: spacing[3],
        paddingTop: spacing[2],
        paddingBottom: spacing[2],
        borderWidth: 1,
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.light,
    },
    macroTileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: spacing[1],
    },
    macroDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    macroTileLabel: {
        fontSize: fontSize[8],
        fontWeight: fontWeight.bold,
        color: colors.text.quaternary,
        letterSpacing: 0.5,
    },
    macroTileValue: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    macroTileTarget: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
        marginTop: 2,
    },

    chipsDivider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginHorizontal: spacing[4],
    },

    activityRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[1],
    },
    activityHalf: {
        flex: 1,
        paddingVertical: spacing[1],
    },
    activityHalfBorder: {
        paddingRight: spacing[4],
        borderRightWidth: 1,
        borderRightColor: colors.border.light,
        marginRight: spacing[4],
    },
    activityValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginTop: spacing[1],
    },

    weekChipsRow: {
        flexDirection: 'row',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[3],
    },
    weekChip: {
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        borderRadius: radius[2],
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderWidth: 1,
        borderColor: colors.border.light,
        gap: 2,
        minWidth: 56,
    },
    weekChipCurrent: {
        backgroundColor: colors.faded.primary,
        borderColor: colors.border.primary,
    },
    weekChipLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    weekChipLabelCurrent: {
        color: colors.accent.primary,
    },
    weekChipValue: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    weekChipValueCurrent: {
        color: colors.accent.primary,
    },
    weekChipDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
}));

export default styles;
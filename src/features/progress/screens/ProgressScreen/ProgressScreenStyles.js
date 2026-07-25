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
        fontSize: fontSize[28],
        fontWeight: fontWeight.bold,
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

    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        borderRadius: radius[4],
        borderWidth: 1,
        padding: spacing[3],
        marginBottom: spacing[3],
    },
    statusIconCircle: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[5],
        backgroundColor: colors.background.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTextWrap: {
        flex: 1,
    },
    statusTitle: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        marginBottom: 2,
    },
    statusMessage: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },

    heroCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[5],
        borderWidth: 1,
        borderColor: colors.border.primaryAlt,
        padding: spacing[5],
        marginBottom: spacing[3],
    },

    quickStatsRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    quickStatTile: {
        flex: 1,
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[2],
        alignItems: 'center',
        gap: spacing[1],
    },
    quickStatIcon: {
        width: spacing[8],
        height: spacing[8],
        borderRadius: radius[2],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    quickStatValue: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.extrabold,
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    quickStatLabel: {
        fontSize: fontSize[8],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        textAlign: 'center',
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
    deltaBadgeCompact: {
        paddingHorizontal: spacing[1],
        paddingVertical: 2,
    },
    deltaBadgeText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
    },
    deltaBadgeTextCompact: {
        fontSize: fontSize[10],
    },

    metricCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing[4],
        marginBottom: spacing[3],
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardIconBoxLarge: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[3],
    },
    cardTitle: {
        fontSize: fontSize[13],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    cardTitleLarge: {
        fontSize: fontSize[14],
    },
    cardDaysLogged: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
        marginTop: 1,
    },
    cardHeaderRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    cardCurrentValue: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.extrabold,
        letterSpacing: -0.5,
    },
    cardCurrentValueLarge: {
        fontSize: fontSize[28],
    },
    cardSubtext: {
        fontSize: fontSize[11],
        fontWeight: fontWeight.medium,
        marginBottom: spacing[3],
        color: colors.text.quaternary,
    },

    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[3],
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

    goalTrackWrap: {
        marginBottom: spacing[3],
    },
    goalTrackBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.background.tertiary,
        marginBottom: spacing[2],
        position: 'relative',
        overflow: 'visible',
    },
    goalTrackFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent.primary,
    },
    goalTrackDot: {
        position: 'absolute',
        top: -3,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accent.primary,
        borderWidth: 2,
        borderColor: colors.background.secondary,
        marginLeft: -6,
    },
    goalTrackLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    goalTrackLabelText: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    goalTrackLabelCurrent: {
        color: colors.accent.primary,
        fontWeight: fontWeight.bold,
    },

    macroTilesRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    macroTile: {
        flex: 1,
        borderRadius: radius[2],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderWidth: 1,
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
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: -0.3,
    },

    chipsDivider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginBottom: spacing[3],
    },

    activityRow: {
        flexDirection: 'row',
        marginBottom: spacing[3],
    },
    activityHalf: {
        flex: 1,
    },
    activityHalfBorder: {
        paddingRight: spacing[4],
        borderRightWidth: 1,
        borderRightColor: colors.border.light,
        marginRight: spacing[4],
    },
    activityHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    activityValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        flexWrap: 'wrap',
    },

    barChartRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 2,
    },
    barCol: {
        flex: 1,
        alignItems: 'center',
    },
    barValueLabel: {
        fontSize: fontSize[8],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        marginBottom: spacing[1],
    },
    barTrack: {
        width: '70%',
        justifyContent: 'flex-end',
        borderRadius: radius[1],
        overflow: 'hidden',
        backgroundColor: colors.faded.surface,
    },
    barFillBar: {
        width: '100%',
        borderRadius: radius[1],
        minHeight: 3,
    },
    barBottomLabel: {
        fontSize: fontSize[8],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
        marginTop: spacing[1],
    },
}));

export default styles;
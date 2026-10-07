import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    viewRow: {
        flexDirection: 'row',
        gap: spacing[5],
    },
    viewTab: {
        paddingTop: spacing[1],
        paddingBottom: spacing[2],
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    viewTabActive: {
        borderBottomColor: colors.accent.primary,
    },
    viewText: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.quaternary,
    },
    viewTextActive: {
        color: colors.text.primary,
    },
    status: {
        marginTop: spacing[1],
        marginBottom: spacing[3],
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    rangeRow: {
        flexDirection: 'row',
        gap: spacing[4],
    },
    rangeText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
    },
    rangeTextActive: {
        color: colors.text.primary,
        fontWeight: fontWeight.bold,
    },

    card: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing[4],
        marginBottom: spacing[3],
    },
    cardFlush: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        marginBottom: spacing[3],
        overflow: 'hidden',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cap: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
    },
    capRight: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },

    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginTop: spacing[2],
        marginBottom: spacing[2],
    },
    heroValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    big: {
        fontSize: fontSize[44],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: -1,
    },
    bigUnit: {
        marginLeft: spacing[1],
        fontSize: fontSize[16],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    heroNote: {
        marginTop: -spacing[1],
        marginBottom: spacing[2],
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },

    dp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: spacing[2],
        paddingVertical: 4,
        borderRadius: radius[2],
    },
    dpText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
    },

    stats: {
        flexDirection: 'row',
        marginTop: spacing[2],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border.default,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    statUnit: {
        marginLeft: 2,
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        marginTop: spacing[1],
    },
    statLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    statDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statDash: {
        width: 10,
        height: 0,
        borderTopWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.text.secondary,
    },

    tip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
        marginTop: spacing[3],
        padding: spacing[3],
        borderRadius: radius[3],
        backgroundColor: colors.faded.surface,
    },
    tipText: {
        flex: 1,
        fontSize: fontSize[12],
        lineHeight: 18,
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },

    cta: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing[10],
        marginTop: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: radius[3],
        backgroundColor: colors.accent.primary,
    },
    ctaBusy: {
        opacity: 0.6,
    },
    ctaText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.buttonText,
    },
    link: {
        alignSelf: 'center',
        paddingTop: spacing[3],
        paddingBottom: spacing[1],
    },
    linkText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
    },

    alert: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginTop: spacing[3],
        padding: spacing[3],
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.faded.surface,
    },
    alertIcon: {
        width: spacing[8],
        height: spacing[8],
        borderRadius: radius[6],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.faded.primary,
    },
    alertBody: {
        flex: 1,
    },
    alertTitle: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    alertSub: {
        marginTop: 2,
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },

    heat: {
        marginTop: spacing[1],
        gap: 5,
    },
    heatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    heatName: {
        width: 62,
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    heatCells: {
        flex: 1,
        flexDirection: 'row',
        gap: 2,
        height: 17,
    },
    heatCell: {
        flex: 1,
        borderRadius: 3,
    },
    heatCellNow: {
        borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    heatAvg: {
        width: 34,
        textAlign: 'right',
        fontSize: fontSize[12],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    heatAvgLow: {
        color: colors.accent.primary,
    },
    heatAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing[2],
        marginLeft: 70,
        marginRight: 42,
    },
    heatAxisText: {
        fontSize: fontSize[10],
        color: colors.text.tertiary,
    },
    key: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing[3],
        marginTop: spacing[3],
    },
    keyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    keySwatch: {
        width: 12,
        height: 12,
        borderRadius: 3,
    },
    keyText: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },

    listHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    listTitle: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    viewAll: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
    },
    monthRow: {
        paddingHorizontal: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    monthRowLast: {
        borderBottomWidth: 0,
    },
    monthHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingVertical: spacing[3],
    },
    monthLeft: {
        flex: 1,
    },
    monthName: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    monthMeta: {
        marginTop: 2,
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.quaternary,
    },
    monthValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    monthValue: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.extrabold,
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    monthUnit: {
        marginLeft: 3,
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },
    tiles: {
        flexDirection: 'row',
        gap: spacing[2],
        paddingBottom: spacing[3],
    },
    tile: {
        flex: 1,
        padding: spacing[3],
        borderRadius: radius[3],
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.faded.surface,
    },
    tileLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    tileDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    tileLabel: {
        fontSize: fontSize[8],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tileValue: {
        marginTop: spacing[1],
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    tileDelta: {
        marginTop: 2,
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },

    empty: {
        marginTop: spacing[3],
        fontSize: fontSize[14],
        lineHeight: 20,
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    emptyScreen: {
        alignItems: 'center',
        paddingVertical: spacing[16],
        paddingHorizontal: spacing[6],
        gap: spacing[3],
    },
    emptyTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    emptySub: {
        fontSize: fontSize[14],
        lineHeight: 20,
        textAlign: 'center',
        color: colors.text.tertiary,
    },
}));

export default styles;
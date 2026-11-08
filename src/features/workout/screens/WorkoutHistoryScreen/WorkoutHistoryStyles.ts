import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    contentWrapper: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[20],
    },
    header: {
        minHeight: spacing[14],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
    },
    backButton: {
        width: spacing[10],
        height: spacing[10],
        borderRadius: radius[3],
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heading: {
        flex: 1,
        textAlign: 'left',
        fontSize: fontSize[22],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    list: {
        flex: 1,
    },
    workoutCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: 0,
        marginBottom: spacing[3],
        overflow: 'hidden',
    },
    cardContent: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[1],
    },
    dateText: {
        maxWidth: '55%',
        fontSize: fontSize[14],
        color: colors.text.secondary,
        fontWeight: fontWeight.medium,
        flexShrink: 0,
        textAlign: 'right',
    },
    cardHeaderTitle: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    workoutTitle: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        flex: 1,
    },
    statsMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        columnGap: spacing[3],
        rowGap: spacing[2],
        marginBottom: spacing[3],
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    statsMetaText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },
    prText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.bold,
        color: colors.accent.primary,
    },
    monthHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.primary,
        paddingVertical: spacing[2],
        marginBottom: spacing[2],
    },
    monthTitle: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    monthCount: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },
    exercisesList: {},
    cardActions: {
        flexDirection: 'row',
        minHeight: spacing[12],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    secondaryAction: {
        flex: 1,
        minHeight: spacing[12],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        paddingHorizontal: spacing[2],
    },
    secondaryActionDivider: {
        borderLeftWidth: 1,
        borderLeftColor: colors.border.light,
    },
    secondaryActionText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
    },
    secondaryActionDisabled: {
        opacity: 0.5,
    },
    exerciseGroup: {
        paddingVertical: spacing[0],
    },
    exerciseGroupDivider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[0],
        paddingVertical: spacing[1],
    },
    exerciseContent: {
        flex: 1,
        minWidth: 0,
        gap: spacing[0],
    },
    exerciseNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    prIndicator: {
        width: spacing[4],
        alignItems: 'center',
        justifyContent: 'center',
    },
    setDetails: {
        width: '100%',
    },
    setDetailsText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },
    setDetailsSeparator: {
        color: colors.text.tertiary,
    },
    exerciseName: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing[30],
        paddingHorizontal: spacing[10],
    },
    emptyIconContainer: {
        width: spacing[28],
        height: spacing[28],
        borderRadius: radius[14],
        backgroundColor: colors.faded.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    emptyTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    emptySubtitle: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        textAlign: 'center',
    },
}));

export default styles;
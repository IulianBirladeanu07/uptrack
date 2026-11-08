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
        letterSpacing: -0.3,
    },
    list: {
        flex: 1,
    },
    monthDivider: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.text.tertiary,
        letterSpacing: 0.4,
        marginBottom: spacing[3],
        marginTop: spacing[1],
    },
    workoutCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: radius[4],
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing[3],
        paddingBottom: spacing[0],
        marginBottom: spacing[3],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    cardHeaderTitle: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    repeatButton: {
        height: spacing[8],
        paddingHorizontal: spacing[1],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[1],
        backgroundColor: colors.faded.surface,
        borderRadius: radius[2],
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    repeatButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
    },
    repeatButtonDisabled: {
        opacity: 0.65,
    },
    workoutTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: -0.3,
        flex: 1,
    },
    statsMeta: {
        marginBottom: spacing[3],
    },
    statsMetaText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    prText: {
        fontWeight: fontWeight.bold,
        color: colors.accent.primary,
    },
    exercisesList: {},
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
    setDetails: {
        width: '100%',
    },
    setDetailsText: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        lineHeight: 16,
    },
    setDetailsSeparator: {
        color: colors.text.tertiary,
    },
    setDetailsPR: {
        color: colors.accent.primary,
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
        lineHeight: 20,
    },
}));

export default styles;
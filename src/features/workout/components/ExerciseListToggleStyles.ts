import { createStyles } from '../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight } from '../../../shared/theme';

const styles = createStyles(() => ({
    button: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        minHeight: spacing[11],
        paddingHorizontal: spacing[2],
        marginTop: spacing[1],
    },
    inlineButton: {
        flexWrap: 'nowrap',
        gap: spacing[2],
        marginTop: spacing[2],
        marginBottom: spacing[2],
        minHeight: spacing[6],
    },
    inlineText: {
        fontSize: fontSize[12],
    },
    inlineLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border.light,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    text: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
        textAlign: 'center',
    },
}));

export default styles;

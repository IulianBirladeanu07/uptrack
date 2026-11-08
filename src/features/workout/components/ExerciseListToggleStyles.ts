import { createStyles } from '../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight } from '../../../shared/theme';

const styles = createStyles(() => ({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        minHeight: spacing[11],
        marginTop: spacing[1],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    text: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
    },
}));

export default styles;

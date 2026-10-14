import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing } from '../../../../shared/theme';

const styles = createStyles(() => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -spacing[6],
        marginTop: -spacing[6],
        zIndex: 10,
    },
}));

export default styles;
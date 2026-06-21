import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingTop: spacing[5],
        paddingBottom: spacing[5],
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    backButton: {
        padding: spacing[2],
        borderRadius: radius[2],
        backgroundColor: colors.faded.surface,
    },
    headerTitle: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: 0.3,
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: spacing[8],
    },
}));

export const Header = ({ title, handleBackPress }) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
                <Ionicons name="arrow-back" size={spacing.icon} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.placeholder} />
        </View>
    );
};

export default Header;
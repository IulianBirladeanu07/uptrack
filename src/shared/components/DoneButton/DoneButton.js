import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, radius, spacing } from '../../theme';
import { createStyles } from '../../theme/createStyles';

const DoneButton = ({ selectedFoods, handleDone }) => {
    if (!Array.isArray(selectedFoods) || selectedFoods.length === 0) return null;

    const count = selectedFoods.length;
    const itemText = count === 1 ? 'item' : 'items';

    return (
        <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.85}
        >
            <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={22} color={colors.accent.buttonText} />
                <Text style={styles.doneButtonText}>
                    Add {count} {itemText}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = createStyles(() => ({
    doneButton: {
        backgroundColor: colors.accent.primary,
        borderRadius: 16,
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    doneButtonText: {
        color: colors.accent.buttonText,
        fontSize: 16,
        fontWeight: fontWeight.extrabold,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
}));

export default DoneButton;
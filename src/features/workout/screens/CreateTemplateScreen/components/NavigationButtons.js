import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const styles = createStyles(() => ({
    navigationContainer: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    navigationButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing[4],
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[5],
        borderRadius: radius[3],
    },
    secondaryNavButton: {
        backgroundColor: colors.faded.surface,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    primaryNavButton: {
        backgroundColor: colors.accent.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    disabledButton: {
        backgroundColor: colors.disabled,
        opacity: 0.5,
    },
    secondaryNavButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.text.secondary,
        marginLeft: spacing[2],
        textTransform: 'uppercase',
    },
    primaryNavButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.buttonText,
        marginRight: spacing[2],
        textTransform: 'uppercase',
    },
}));

export const NavigationButtons = ({
    currentStep,
    goToPreviousStep,
    goToNextStep,
    handleCreateTemplate,
    handleCreateSplit,
    loading,
    validateForm,
    creationType = 'template',
    isEditing = false,
}) => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === 2;
    const isFormValid = validateForm();

    const handleFinalAction = () => {
        if (handleCreateSplit) {
            handleCreateSplit();
        } else if (handleCreateTemplate) {
            handleCreateTemplate();
        }
    };

    const getButtonText = () => {
        if (handleCreateSplit) return isEditing ? 'Update Split' : 'Create Split';
        return isEditing ? 'Update Template' : 'Create Template';
    };

    const getButtonIcon = () => isEditing ? 'save' : 'checkmark';

    return (
        <View style={styles.navigationContainer}>
            <View style={styles.navigationButtonsContainer}>
                {!isFirstStep && (
                    <TouchableOpacity
                        style={[styles.navButton, styles.secondaryNavButton]}
                        onPress={goToPreviousStep}
                        disabled={loading}
                        accessibilityLabel="Go to previous step"
                    >
                        <Ionicons name="chevron-back" size={spacing.iconMd} color={colors.text.secondary} />
                        <Text style={styles.secondaryNavButtonText}>Previous</Text>
                    </TouchableOpacity>
                )}

                {isLastStep ? (
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            styles.primaryNavButton,
                            (!isFormValid || loading) && styles.disabledButton,
                        ]}
                        onPress={handleFinalAction}
                        disabled={!isFormValid || loading}
                        accessibilityLabel={getButtonText()}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.accent.buttonText} />
                        ) : (
                            <>
                                <Text style={styles.primaryNavButtonText}>{getButtonText()}</Text>
                                <Ionicons name={getButtonIcon()} size={spacing.iconMd} color={colors.accent.buttonText} />
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.navButton, styles.primaryNavButton]}
                        onPress={goToNextStep}
                        disabled={loading}
                        accessibilityLabel="Go to next step"
                    >
                        <Text style={styles.primaryNavButtonText}>Continue</Text>
                        <Ionicons name="chevron-forward" size={spacing.iconMd} color={colors.accent.buttonText} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default NavigationButtons;
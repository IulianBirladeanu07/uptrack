import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const COLORS = {
  primary: colors.primary,
  secondary: colors.bg,
  background: colors.bg,
  textSecondary: colors.textSecondary,
  border: colors.border,
  borderDivider: colors.borderLight,
  disabled: '#52525B',
  shadow: 'rgba(0, 0, 0, 0.3)',
  dark: colors.bg,
};

export const NavigationButtons = ({ 
  currentStep, 
  goToPreviousStep, 
  goToNextStep, 
  handleCreateTemplate, 
  handleCreateSplit,
  loading, 
  validateForm,
  creationType = 'template',
  isEditing = false
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
    if (handleCreateSplit) {
      return isEditing ? 'Update Split' : 'Create Split';
    }
    return isEditing ? 'Update Template' : 'Create Template';
  };

  const getAccessibilityLabel = () => {
    if (handleCreateSplit) {
      return isEditing ? 'Update workout split' : 'Create workout split';
    }
    return isEditing ? 'Update workout template' : 'Create workout template';
  };

  const getButtonIcon = () => {
    return isEditing ? 'save' : 'checkmark';
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.navigationButtonsContainer}>
        {!isFirstStep && (
          <TouchableOpacity 
            style={[styles.navButton, styles.secondaryNavButton]}
            onPress={goToPreviousStep}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Go to previous step"
          >
            <Ionicons name="chevron-back" size={normalize(18)} color={COLORS.textSecondary} />
            <Text style={styles.secondaryNavButtonText}>PREVIOUS</Text>
          </TouchableOpacity>
        )}

        {isLastStep ? (
          <TouchableOpacity 
            style={[
              styles.navButton,
              styles.primaryNavButton,
              (!isFormValid || loading) && styles.disabledButton
            ]}
            onPress={handleFinalAction}
            disabled={!isFormValid || loading}
            accessible={true}
            accessibilityLabel={getAccessibilityLabel()}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.dark} />
            ) : (
              <>
                <Text style={styles.primaryNavButtonText}>{getButtonText()}</Text>
                <Ionicons name={getButtonIcon()} size={normalize(18)} color={COLORS.dark} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.primaryNavButton,
              !isFirstStep
            ]}
            onPress={goToNextStep}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Go to next step"
          >
            <Text style={styles.primaryNavButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={normalize(18)} color={COLORS.dark} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    backgroundColor: COLORS.background,
    borderTopWidth: normalize(1),
    borderTopColor: COLORS.borderDivider,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: normalize(16),
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(12),
  },
  secondaryNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  primaryNavButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    opacity: 0.5,
  },
  secondaryNavButtonText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: normalize(10),
    textTransform: 'uppercase',
  },
  primaryNavButtonText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.secondary,
    marginRight: normalize(10),
    textTransform: 'uppercase',
  },
});

export default NavigationButtons;
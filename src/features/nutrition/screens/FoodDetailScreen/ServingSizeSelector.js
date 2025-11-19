import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  primaryTransparent: 'rgba(255, 149, 0, 0.1)',
  primaryBorder: 'rgba(255, 149, 0, 0.3)',
  danger: '#FF453A',
};

const ServingSizeSelector = ({
  quantity,
  onQuantityChange,
  servingUnit,
  onServingUnitPress,
  predefinedSizes = [],
  onPredefinedSizePress,
  selectedSize,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  useEffect(() => {
    const parsedValue = parseInt(inputValue, 10);

    if (inputValue === '') {
      setErrorMessage('Quantity cannot be empty.');
    } else if (isNaN(parsedValue) || parsedValue <= 0) {
      setErrorMessage('Please enter a valid positive integer.');
    } else {
      setErrorMessage('');
      onQuantityChange(parsedValue);
    }
  }, [inputValue, onQuantityChange]);

  // Check if current quantity matches a predefined size
  const isQuantityPredefined = predefinedSizes.includes(quantity);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errorMessage && styles.inputError,
            isQuantityPredefined && !errorMessage && styles.inputSelected,
          ]}
          value={inputValue}
          keyboardType="numeric"
          onChangeText={setInputValue}
          placeholder="Enter quantity"
          placeholderTextColor={COLORS.textTertiary}
          accessible
          accessibilityLabel="Serving quantity input"
        />
        <TouchableOpacity
          style={styles.unitButton}
          onPress={onServingUnitPress}
          accessible
          accessibilityLabel="Change serving unit"
        >
          <Text style={styles.unitText}>{servingUnit}</Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Text style={styles.predefinedSizesLabel}>Quick Servings</Text>
      <View style={styles.predefinedSizesContainer}>
        {predefinedSizes.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.predefinedSizeButton,
              quantity === size && styles.predefinedSizeButtonSelected,
            ]}
            onPress={() => onPredefinedSizePress(size)}
            accessible
            accessibilityLabel={`Select ${size} ${servingUnit}`}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.predefinedSizeText,
                quantity === size && styles.predefinedSizeTextSelected,
              ]}
            >
              {size} {servingUnit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: normalize(20),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(12),
  },
  input: {
    flex: 1,
    height: normalize(52),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    fontSize: normalize(16),
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  inputSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.primaryTransparent,
  },
  unitButton: {
    height: normalize(52),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(12),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitText: {
    fontSize: normalize(16),
    color: '#0f172a',
    fontWeight: '700',
  },
  predefinedSizesLabel: {
    fontSize: normalize(14),
    color: COLORS.textSecondary,
    marginBottom: normalize(12),
    fontWeight: '600',
  },
  predefinedSizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(10),
  },
  predefinedSizeButton: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(18),
    borderRadius: normalize(12),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predefinedSizeButtonSelected: {
    backgroundColor: COLORS.primaryTransparent,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  predefinedSizeText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  predefinedSizeTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: normalize(12),
    marginTop: normalize(-8),
    marginBottom: normalize(12),
    fontWeight: '600',
  },
});

export default ServingSizeSelector;
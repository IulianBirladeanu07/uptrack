import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { colors, spacing, radius, fontSize, fontWeight } from '../../../../shared/theme';

const ServingSizeSelector = ({
  quantity,
  onQuantityChange,
  servingUnit,
  onServingUnitPress,
  predefinedSizes = [],
  onPredefinedSizePress,
}) => {
  const [inputValue, setInputValue] = useState(String(quantity));
  const [errorMessage, setErrorMessage] = useState('');
  const lastPushedValue = useRef(quantity);

  useEffect(() => {
    if (quantity !== lastPushedValue.current) {
      setInputValue(String(quantity));
      lastPushedValue.current = quantity;
    }
  }, [quantity]);

  const handleChangeText = useCallback((text) => {
    setInputValue(text);

    if (text === '') {
      setErrorMessage('Quantity cannot be empty.');
      return;
    }

    const parsedValue = parseFloat(text);

    if (isNaN(parsedValue) || parsedValue <= 0) {
      setErrorMessage('Please enter a valid positive number.');
      return;
    }

    setErrorMessage('');
    lastPushedValue.current = parsedValue;
    onQuantityChange(parsedValue);
  }, [onQuantityChange]);

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
          onChangeText={handleChangeText}
          placeholder="Enter quantity"
          placeholderTextColor={colors.text.quaternary}
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
    marginBottom: normalize(spacing[5]),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(spacing[3]),
    marginBottom: normalize(spacing[3]),
  },
  input: {
    flex: 1,
    height: normalize(spacing.inputHeight),
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: normalize(radius[3]),
    paddingHorizontal: normalize(spacing[4]),
    fontSize: normalize(fontSize[16]),
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  inputError: {
    borderColor: colors.accent.error,
    borderWidth: 1.5,
  },
  inputSelected: {
    borderColor: colors.accent.primary,
    borderWidth: 1.5,
    backgroundColor: colors.faded.primaryLight,
  },
  unitButton: {
    height: normalize(spacing.inputHeight),
    paddingHorizontal: normalize(spacing[5]),
    borderRadius: normalize(radius[3]),
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitText: {
    fontSize: normalize(fontSize[16]),
    color: '#0f172a',
    fontWeight: fontWeight.bold,
  },
  predefinedSizesLabel: {
    fontSize: normalize(fontSize[14]),
    color: colors.text.secondary,
    marginBottom: normalize(spacing[3]),
    fontWeight: fontWeight.semibold,
  },
  predefinedSizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(spacing[2] + spacing[1] / 2),
  },
  predefinedSizeButton: {
    paddingVertical: normalize(spacing[3]),
    paddingHorizontal: normalize(spacing[4] + spacing[1] / 2),
    borderRadius: normalize(radius[3]),
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predefinedSizeButtonSelected: {
    backgroundColor: colors.faded.primaryLight,
    borderColor: colors.accent.primary,
    borderWidth: 1.5,
  },
  predefinedSizeText: {
    fontSize: normalize(fontSize[14]),
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  predefinedSizeTextSelected: {
    color: colors.accent.primary,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: normalize(fontSize[12]),
    marginTop: normalize(-spacing[2]),
    marginBottom: normalize(spacing[3]),
    fontWeight: fontWeight.semibold,
  },
});

export default ServingSizeSelector;
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { normalizeDecimalSeparator } from '../../utils/decimalInput';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { colors, spacing, radius, fontSize, fontWeight } from '../../../../shared/theme';

type ServingSizeSelectorProps = {
  quantity: number;
  onQuantityChange: (value: number) => void;
  servingUnit: string;
  onServingUnitPress: () => void;
  predefinedSizes?: number[];
  maxQuantity?: number;
  onPredefinedSizePress: (size: number) => void;
  onValidityChange?: (valid: boolean) => void;
};

const DECIMAL_PATTERN = /^(\d+\.?\d*|\.\d+)$/;

const ServingSizeSelector = ({
  quantity,
  onQuantityChange,
  servingUnit,
  onServingUnitPress,
  predefinedSizes = [],
  onPredefinedSizePress,
  maxQuantity,
  onValidityChange,
}: ServingSizeSelectorProps) => {
  const [inputValue, setInputValue] = useState(String(quantity));
  const [errorMessage, setErrorMessage] = useState('');
  const lastPushedValue = useRef(quantity);
  const previousUnit = useRef(servingUnit);

  useEffect(() => {
    const unitChanged = previousUnit.current !== servingUnit;
    previousUnit.current = servingUnit;
    if (quantity !== lastPushedValue.current || unitChanged) {
      setInputValue(String(quantity));
      setErrorMessage('');
      lastPushedValue.current = quantity;
      onValidityChange?.(true);
    }
  }, [quantity, servingUnit, onValidityChange]);

  const reportInvalid = useCallback((message: string) => {
    setErrorMessage(message);
    onValidityChange?.(false);
  }, [onValidityChange]);

  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);

    if (text === '') {
      reportInvalid('Quantity cannot be empty.');
      return;
    }

    const normalized = normalizeDecimalSeparator(text.trim());
    const parsedValue = DECIMAL_PATTERN.test(normalized) ? Number(normalized) : NaN;

    if (isNaN(parsedValue) || parsedValue <= 0) {
      reportInvalid('Please enter a valid positive number.');
      return;
    }

    if (maxQuantity !== undefined && parsedValue > maxQuantity) {
      reportInvalid(`Quantity cannot exceed ${maxQuantity}.`);
      return;
    }

    setErrorMessage('');
    lastPushedValue.current = parsedValue;
    onValidityChange?.(true);
    onQuantityChange(parsedValue);
  }, [onQuantityChange, onValidityChange, maxQuantity, reportInvalid]);

  const handlePredefinedPress = useCallback((size: number) => {
    setInputValue(String(size));
    setErrorMessage('');
    lastPushedValue.current = size;
    onValidityChange?.(true);
    onPredefinedSizePress(size);
  }, [onPredefinedSizePress, onValidityChange]);

  const isQuantityPredefined = predefinedSizes.includes(quantity);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            !!errorMessage && styles.inputError,
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
            onPress={() => handlePredefinedPress(size)}
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
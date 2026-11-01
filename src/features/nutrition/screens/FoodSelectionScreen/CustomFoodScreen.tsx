import { useState, useRef, useEffect, memo, forwardRef, useMemo, useCallback, useImperativeHandle } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CustomFoodScreenStyle';
import { colors, spacing } from '../../../../shared/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCustomFood } from '../../helpers/useCustomFood';
import type { FieldHandle } from '../../helpers/useCustomFood';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import type { FoodFormData, Numeric } from '../../../../shared/types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Field = keyof FoodFormData;

type FoodInfoFieldProps = {
  label: string;
  field: Field;
  iconName?: IconName;
  unit?: string;
  nextField?: Field | undefined;
  value?: Numeric | null | undefined;
  error?: string | undefined;
  onChangeText: (field: Field, text: string) => void;
  onFocus: (field: Field) => void;
  onSubmitEditing: (field: Field, nextField?: Field) => void;
};

type NutrientDataFieldProps = {
  field: Field;
  label: string;
  unit?: string;
  width: DimensionValue;
  variant?: 'default' | 'energy';
  iconName?: IconName;
  nextField?: Field | undefined;
  value?: Numeric | null | undefined;
  error?: string | undefined;
  onChangeText: (field: Field, text: string) => void;
  onFocus: (field: Field) => void;
  onSubmitEditing: (field: Field, nextField?: Field) => void;
};

type NutrientConfig = {
  field: Field;
  label: string;
  unit: string;
  width: DimensionValue;
  variant?: 'default' | 'energy';
  iconName?: IconName;
  nextField?: Field;
};

type FooterProps = {
  foodData: FoodFormData;
  handleSubmit: () => void;
  onAmountChange: (value: string) => void;
  onAmountFocus: () => void;
  onUnitSelect: (unit: string) => void;
  visible: boolean;
};

const FOOD_UNITS = ['g', 'ml', 'oz', 'serving'] as const;

const FoodInfoField = memo(forwardRef<FieldHandle, FoodInfoFieldProps>(({ label, field, iconName, unit, nextField, value, error, onChangeText, onFocus, onSubmitEditing }, ref) => {
  const textInputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  useImperativeHandle<FieldHandle, FieldHandle>(ref, () => ({
    focus: () => {
      textInputRef.current?.focus();
    },
    measure: (callback) => {
      containerRef.current?.measure(callback);
    },
  }));

  return (
    <View ref={containerRef} style={styles.inputWrapper} collapsable={false}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={[styles.inputContainer, !!error && styles.errorInput]}>
        {iconName && <MaterialCommunityIcons name={iconName} size={20} color={colors.accent.primary} style={styles.inputIcon} />}
        <TextInput
          ref={textInputRef}
          style={styles.input}
          placeholder={label === 'Name' ? 'e.g., Chicken Breast' : `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.text.secondary}
          value={value == null ? '' : String(value)}
          onChangeText={(text) => onChangeText(field, text)}
          keyboardType={label === 'Name' ? 'default' : 'numeric'}
          onFocus={() => onFocus(field)}
          onSubmitEditing={() => onSubmitEditing(field, nextField)}
          accessibilityLabel={label}
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={nextField ? "next" : "done"}
          underlineColorAndroid="transparent"
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}));

const NutrientDataField = memo(forwardRef<FieldHandle, NutrientDataFieldProps>(({ field, label, unit, width, variant = 'default', iconName, nextField, value, error, onChangeText, onFocus, onSubmitEditing }, ref) => {
  const textInputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  useImperativeHandle<FieldHandle, FieldHandle>(ref, () => ({
    focus: () => {
      textInputRef.current?.focus();
    },
    measure: (callback) => {
      containerRef.current?.measure(callback);
    },
  }));

  return (
    <View ref={containerRef} style={{ width }} collapsable={false}>
      {variant === 'energy' ? (
        <View style={[styles.energyCell, !!error && styles.errorInput]}>
          <View style={styles.energyLabel}>
            {iconName && (
              <MaterialCommunityIcons
                name={iconName}
                size={20}
                color={colors.accent.primary}
              />
            )}
            <Text style={styles.energyLabelText}>{label}</Text>
          </View>
          <TextInput
            ref={textInputRef}
            style={[styles.nutrientInput, styles.energyInput]}
            placeholderTextColor={colors.text.secondary}
            value={value == null ? '' : String(value)}
            onChangeText={(text) => onChangeText(field, text)}
            keyboardType="numeric"
            onFocus={() => onFocus(field)}
            onSubmitEditing={() => onSubmitEditing(field, nextField)}
            accessibilityLabel={`${label}, ${unit}`}
            autoCorrect={false}
            spellCheck={false}
            returnKeyType={nextField ? "next" : "done"}
            underlineColorAndroid="transparent"
            maxLength={8}
          />
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>
      ) : (
        <>
          <View style={styles.nutrientHeader}>
            <Text style={styles.nutrientHeaderLabel}>{label}</Text>
          </View>
          <View style={[styles.nutrientCell, !!error && styles.errorInput]}>
            <TextInput
              ref={textInputRef}
              style={styles.nutrientInput}
              placeholderTextColor={colors.text.secondary}
              value={value == null ? '' : String(value)}
              onChangeText={(text) => onChangeText(field, text)}
              keyboardType="numeric"
              onFocus={() => onFocus(field)}
              onSubmitEditing={() => onSubmitEditing(field, nextField)}
              accessibilityLabel={`${label}, ${unit}`}
              autoCorrect={false}
              spellCheck={false}
              returnKeyType={nextField ? "next" : "done"}
              underlineColorAndroid="transparent"
              maxLength={8}
            />
            {unit && <Text style={styles.unitText}>{unit}</Text>}
          </View>
        </>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}));

const Footer = memo(({ foodData, handleSubmit, onAmountChange, onAmountFocus, onUnitSelect, visible }: FooterProps) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const unitSelectorRef = useRef<View>(null);
  const anchorFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [unitAnchor, setUnitAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuHeight = FOOD_UNITS.length * spacing[10] + spacing[1] * 2 + 2;
  const animatedMenuHeight = useRef(new Animated.Value(0)).current;

  const measureUnitSelector = useCallback(() => {
    const selector = unitSelectorRef.current;
    const fallbackAnchor = {
      x: 16,
      y: screenHeight - insets.bottom - spacing[4] - spacing[12] * 2 - spacing[4],
      width: 160,
      height: spacing[12],
    };
    const showMenu = (anchor: { x: number; y: number; width: number; height: number }) => {
      setUnitAnchor(anchor);
      setUnitMenuVisible(true);
    };

    if (!selector || typeof selector.measureInWindow !== 'function') {
      showMenu(fallbackAnchor);
      return;
    }

    anchorFallbackTimerRef.current = setTimeout(() => {
      anchorFallbackTimerRef.current = null;
      showMenu(fallbackAnchor);
    }, 100);
    selector.measureInWindow((x, y, width, height) => {
      if (anchorFallbackTimerRef.current) {
        clearTimeout(anchorFallbackTimerRef.current);
        anchorFallbackTimerRef.current = null;
      }
      showMenu({ x, y, width, height });
    });
  }, [insets.bottom, screenHeight]);

  const openUnitMenu = useCallback(measureUnitSelector, [measureUnitSelector]);

  useEffect(() => {
    if (!unitMenuVisible || !unitAnchor) {
      animatedMenuHeight.setValue(0);
      return;
    }

    animatedMenuHeight.setValue(0);
    const animation = Animated.timing(animatedMenuHeight, {
      toValue: menuHeight,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [animatedMenuHeight, menuHeight, unitAnchor, unitMenuVisible]);

  useEffect(() => () => {
    if (anchorFallbackTimerRef.current) clearTimeout(anchorFallbackTimerRef.current);
  }, []);

  if (!visible) return null;

  const canSubmit = !!foodData.productName?.trim() && Number(foodData.calories) > 0;
  const formattedKcal = Math.round(Number(foodData.calories) || 0).toLocaleString();
  const menuWidth = unitAnchor?.width ?? 160;
  const opensUp = unitAnchor
    ? unitAnchor.y - menuHeight - spacing[2] >= insets.top + spacing[4]
    : true;
  const menuBottom = unitAnchor ? screenHeight - unitAnchor.y + spacing[2] : spacing[4];
  const menuTop = unitAnchor ? unitAnchor.y + unitAnchor.height + spacing[2] : spacing[4];
  const menuLeft = unitAnchor
    ? Math.max(spacing[4], Math.min(unitAnchor.x, screenWidth - menuWidth - spacing[4]))
    : spacing[4];

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.servingLabel}>Serving size</Text>
      <View style={styles.amountRow}>
        <TextInput
          style={styles.amountInput}
          placeholder="Amount"
          placeholderTextColor={colors.text.secondary}
          value={String(foodData.amount || '')}
          onChangeText={onAmountChange}
          onFocus={onAmountFocus}
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          maxLength={5}
          returnKeyType="next"
          accessibilityLabel={`Serving size, ${foodData.amount || 'not set'} ${foodData.unit || 'g'}`}
        />
        <View ref={unitSelectorRef} style={styles.unitSelectorAnchor} collapsable={false}>
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={openUnitMenu}
            accessibilityRole="button"
            accessibilityLabel={`Serving unit, ${foodData.unit || 'g'}`}
            accessibilityState={{ expanded: unitMenuVisible }}
          >
            <Text style={styles.unitText}>{foodData.unit || 'g'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.background.primary} />
        <Text style={styles.addButtonText}>
          {foodData.calories ? `Add to Diary • ${formattedKcal} kcal` : 'Add to Diary'}
        </Text>
      </TouchableOpacity>
      <Modal
        testID="unit-picker-modal"
        visible={unitMenuVisible && unitAnchor !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setUnitMenuVisible(false)}
      >
        <Pressable
          style={styles.unitMenuBackdrop}
          onPress={() => setUnitMenuVisible(false)}
          testID="unit-picker-backdrop"
          accessibilityLabel="Dismiss unit options"
        >
          {unitAnchor && (
            <Animated.View
              style={[
                styles.unitMenu,
                {
                  left: menuLeft,
                  top: opensUp ? undefined : menuTop,
                  bottom: opensUp ? menuBottom : undefined,
                  width: menuWidth,
                  height: animatedMenuHeight,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.unitMenuContent,
                  { height: menuHeight, [opensUp ? 'bottom' : 'top']: 0 },
                ]}
                onPress={event => event.stopPropagation()}
              >
                {FOOD_UNITS.map((unit, index) => {
                  const isSelected = unit === (foodData.unit || 'g');
                  const label = unit === 'g'
                    ? 'Grams'
                    : unit === 'ml'
                      ? 'Milliliters'
                      : unit === 'oz'
                        ? 'Ounces'
                        : 'Serving';

                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitMenuOption,
                        index === FOOD_UNITS.length - 1 && styles.unitMenuOptionLast,
                      ]}
                      onPress={() => {
                        onUnitSelect(unit);
                        setUnitMenuVisible(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${label} (${unit})`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.unitMenuLabel, isSelected && styles.unitMenuLabelSelected]}>
                        {unit}
                      </Text>
                      <View style={styles.unitMenuIndicator}>
                        {isSelected && <MaterialCommunityIcons name="check" size={18} color={colors.accent.primary} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
});

const CustomFoodScreen = () => {
  const route = useAppRoute<'CustomFood'>();
  const type = route.params?.type;
  const barcode = route.params?.barcode;
  const meal = route.params?.meal;
  const selectedDate = route.params?.selectedDate;
  const nutritionLabelValues = route.params?.nutritionLabelValues;
  const navigation = useAppNavigation();

  const scrollViewRef = useRef<ScrollView>(null);

  const [showAdditionalNutrients, setShowAdditionalNutrients] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentFocusedField, setCurrentFocusedField] = useState<Field | null>(null);

  const {
    foodData,
    errors,
    handleFieldChange,
    handleFieldFocus: originalHandleFieldFocus,
    handleSubmitEditing,
    handleAmountChange,
    changeUnit,
    handleSubmit,
    focusFirstField,
    inputRefs,
    registerInputRef
  } = useCustomFood(type, navigation, barcode, meal, selectedDate, nutritionLabelValues);

  useEffect(() => {
    if (barcode) {
      handleFieldChange('barcode', barcode);
    }
  }, [barcode]);

  const handleFieldFocus = useCallback((field: Field) => {
    setCurrentFocusedField(field);
    originalHandleFieldFocus(field);

    setTimeout(() => {
      const inputRef = inputRefs[field];
      if (inputRef && inputRef.measure && scrollViewRef.current) {
        inputRef.measure((_x, _y, _w, _h, _pageX, pageY) => {
          scrollViewRef.current?.scrollTo({ 
            y: Math.max(0, pageY - 150), 
            animated: true 
          });
        });
      }
    }, 100);
  }, [originalHandleFieldFocus]);

  const showFooter = !keyboardVisible || currentFocusedField === 'amount';
  const shouldShowBarcode = type === 'foodWithBarcode';
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    const timer = setTimeout(focusFirstField, 300);

    return () => {
      clearTimeout(timer);
      showListener.remove();
      hideListener.remove();
    };
  }, [focusFirstField]);

  const energyNutrient = useMemo<NutrientConfig>(() => ({
    field: 'calories',
    label: 'Calories',
    unit: 'kcal',
    width: '100%',
    variant: 'energy',
    iconName: 'fire',
    nextField: 'carbohydrates',
  }), []);

  const mainNutrients = useMemo<NutrientConfig[]>(() => [
    { field: 'carbohydrates', label: 'Carbs', unit: 'g', width: '31%', nextField: 'protein' },
    { field: 'protein', label: 'Protein', unit: 'g', width: '31%', nextField: 'fats' },
    { field: 'fats', label: 'Fat', unit: 'g', width: '31%', nextField: 'fiber' },
  ], []);

  const otherNutrients = useMemo<NutrientConfig[]>(() => [
    { field: 'fiber', label: 'Fiber', unit: 'g', width: '48%', nextField: 'sugar' },
    { field: 'sugar', label: 'Sugar', unit: 'g', width: '48%', nextField: 'saturatedFats' },
    { field: 'saturatedFats', label: 'Saturated fat', unit: 'g', width: '48%', nextField: 'salt' },
    { field: 'salt', label: 'Salt', unit: 'g', width: '48%' },
  ], []);
  const nutritionBasis = foodData.amount
    ? `${foodData.amount} ${foodData.unit || 'g'}`
    : 'serving size';

  const screenTitle = useMemo(() => {
    if (nutritionLabelValues) return 'Review Nutrition Label';
    switch (type) {
      case 'foodWithoutBarcode': return 'Create Food';
      case 'foodWithBarcode': return 'Add Barcode Food';
      default: return 'Custom Food';
    }
  }, [nutritionLabelValues, type]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && { paddingBottom: 20 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>{screenTitle}</Text>
          {nutritionLabelValues && (
            <Text style={styles.reviewNote}>
              Scanned values can be wrong. Check the serving basis and every value against the package before adding.
            </Text>
          )}
          <FoodInfoField
            label="Name"
            field="productName"
            iconName="food-apple"
            nextField={shouldShowBarcode ? 'barcode' : 'calories'}
            value={foodData.productName}
            error={errors.productName}
            onChangeText={handleFieldChange}
            onFocus={handleFieldFocus}
            onSubmitEditing={handleSubmitEditing}
            ref={registerInputRef('productName')}
          />

          {shouldShowBarcode && (
            <FoodInfoField
              label="Barcode"
              field="barcode"
              iconName="barcode-scan"
              nextField="calories"
              value={foodData.barcode}
              error={errors.barcode}
              onChangeText={handleFieldChange}
              onFocus={handleFieldFocus}
              onSubmitEditing={handleSubmitEditing}
              ref={registerInputRef('barcode')}
            />
          )}

          <View style={styles.section}>
            <View style={styles.nutritionHeading}>
              <Text style={styles.sectionTitle}>Nutrition facts</Text>
              <Text style={styles.nutritionBasisText}>per {nutritionBasis}</Text>
            </View>
            <NutrientDataField
              {...energyNutrient}
              value={foodData[energyNutrient.field]}
              error={errors[energyNutrient.field]}
              onChangeText={handleFieldChange}
              onFocus={handleFieldFocus}
              onSubmitEditing={handleSubmitEditing}
              ref={registerInputRef(energyNutrient.field)}
            />
            <View style={styles.macroGrid}>
              {mainNutrients.map(n => (
                <NutrientDataField
                  key={n.field}
                  {...n}
                  nextField={n.field === 'fats' && !showAdditionalNutrients ? undefined : n.nextField}
                  value={foodData[n.field]}
                  error={errors[n.field]}
                  onChangeText={handleFieldChange}
                  onFocus={handleFieldFocus}
                  onSubmitEditing={handleSubmitEditing}
                  ref={registerInputRef(n.field)}
                />
              ))}
            </View>
            {errors.macroNutrients && <Text style={styles.errorText}>{errors.macroNutrients}</Text>}
          </View>

          <TouchableOpacity
            style={styles.moreNutrientsToggle}
            onPress={() => setShowAdditionalNutrients(value => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showAdditionalNutrients }}
            accessibilityLabel={showAdditionalNutrients ? 'Hide more nutrition details' : 'Add more nutrition details'}
          >
            <Text style={styles.moreNutrientsTitle}>
              {showAdditionalNutrients ? 'More nutrition details' : 'Add more nutrition details (optional)'}
            </Text>
            <MaterialCommunityIcons
              name={showAdditionalNutrients ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showAdditionalNutrients && (
            <View style={styles.otherNutrientGrid}>
              {otherNutrients.map(n => (
                <NutrientDataField
                  key={n.field}
                  {...n}
                  value={foodData[n.field]}
                  error={errors[n.field]}
                  onChangeText={handleFieldChange}
                  onFocus={handleFieldFocus}
                  onSubmitEditing={handleSubmitEditing}
                  ref={registerInputRef(n.field)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <Footer
          foodData={foodData}
          handleSubmit={handleSubmit}
          onAmountChange={handleAmountChange}
          onAmountFocus={() => handleFieldFocus('amount')}
          onUnitSelect={changeUnit}
          visible={showFooter}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(CustomFoodScreen);
import { useState, useRef, useEffect, memo, forwardRef, useMemo, useCallback, useImperativeHandle } from 'react';
import type { ComponentProps } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CustomFoodScreenStyle';
import { colors } from '../../../../shared/theme';
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
  nextField?: Field;
};

type FooterProps = {
  foodData: FoodFormData;
  handleSubmit: () => void;
  onAmountChange: (value: string) => void;
  onAmountFocus: () => void;
  onChooseUnit: () => void;
  visible: boolean;
};

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

const NutrientDataField = memo(forwardRef<FieldHandle, NutrientDataFieldProps>(({ field, label, unit, width, nextField, value, error, onChangeText, onFocus, onSubmitEditing }, ref) => {
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
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={nextField ? "next" : "done"}
          underlineColorAndroid="transparent"
          maxLength={8}
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}));

const Footer = memo(({ foodData, handleSubmit, onAmountChange, onAmountFocus, onChooseUnit, visible }: FooterProps) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const canSubmit = !!foodData.productName && !!foodData.calories;
  const formattedKcal = Math.round(Number(foodData.calories) || 0).toLocaleString();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.servingLabel}>Serving size</Text>
      <View style={styles.amountRow}>
        <TextInput
          style={styles.amountInput}
          placeholder="Serving amount"
          placeholderTextColor={colors.text.secondary}
          value={String(foodData.amount || '')}
          onChangeText={onAmountChange}
          onFocus={onAmountFocus}
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          maxLength={5}
          returnKeyType="done"
          accessibilityLabel={`Serving size, ${foodData.amount || 'not set'} ${foodData.unit || 'g'}`}
        />
        <TouchableOpacity
          style={styles.unitSelector}
          onPress={onChooseUnit}
          accessibilityRole="button"
          accessibilityLabel={`Serving unit, ${foodData.unit || 'g'}`}
        >
          <Text style={styles.unitText}>{foodData.unit || 'g'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
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
    </View>
  );
});

const CustomFoodScreen = () => {
  const route = useAppRoute<'CustomFood'>();
  const type = route.params?.type;
  const barcode = route.params?.barcode;
  const meal = route.params?.meal;
  const selectedDate = route.params?.selectedDate;
  const navigation = useAppNavigation();

  const scrollViewRef = useRef<ScrollView>(null);

  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
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
  } = useCustomFood(type, navigation, barcode, meal, selectedDate);

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
  const chooseUnit = useCallback(() => {
    Alert.alert('Serving unit', 'Choose the unit for this food serving.', [
      { text: 'g', onPress: () => changeUnit('g') },
      { text: 'ml', onPress: () => changeUnit('ml') },
      { text: 'piece', onPress: () => changeUnit('piece') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [changeUnit]);

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

  const macronutrients = useMemo<NutrientConfig[]>(() => [
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
    : 'the serving size selected below';

  const screenTitle = useMemo(() => {
    switch (type) {
      case 'foodWithoutBarcode': return 'Create Food';
      case 'foodWithBarcode': return 'Add Barcode Food';
      default: return 'Custom Food';
    }
  }, [type]);

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
            (keyboardVisible && !showFooter) && { paddingBottom: 20 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>{screenTitle}</Text>
          <Text style={styles.introText}>Name and calories required. Nutrition details optional.</Text>

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

          <FoodInfoField
            label="Calories"
            field="calories"
            iconName="fire"
            unit="kcal"
            nextField={showNutritionDetails ? 'carbohydrates' : undefined}
            value={foodData.calories}
            error={errors.calories}
            onChangeText={handleFieldChange}
            onFocus={handleFieldFocus}
            onSubmitEditing={handleSubmitEditing}
            ref={registerInputRef('calories')}
          />
          <TouchableOpacity
            style={styles.nutritionDisclosure}
            onPress={() => {
              setShowNutritionDetails(!showNutritionDetails);
              if (showNutritionDetails) setShowAdditionalNutrients(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: showNutritionDetails }}
            accessibilityLabel={showNutritionDetails ? 'Hide nutrition details' : 'Add nutrition details'}
          >
            <View style={styles.nutritionDisclosureText}>
              <Text style={styles.nutritionDisclosureTitle}>
                {showNutritionDetails ? 'Nutrition details' : 'Add nutrition details'}
              </Text>
              {!showNutritionDetails && (
                <Text style={styles.nutritionDisclosureHint}>Optional: carbs, protein, fat and more</Text>
              )}
            </View>
            <MaterialCommunityIcons
              name={showNutritionDetails ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showNutritionDetails && (
            <>
              <View style={styles.nutritionBasis}>
                <Text style={styles.nutritionBasisText}>Nutrition values for {nutritionBasis}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Macronutrients</Text>
                <View style={styles.nutrientRow}>
                  {macronutrients.map(n => (
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
                accessibilityLabel={showAdditionalNutrients ? 'Hide more nutrients' : 'Add more nutrients'}
              >
                <Text style={styles.moreNutrientsTitle}>
                  {showAdditionalNutrients ? 'Hide more nutrients' : 'Add more nutrients'}
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
            </>
          )}
        </ScrollView>

        <Footer
          foodData={foodData}
          handleSubmit={handleSubmit}
          onAmountChange={handleAmountChange}
          onAmountFocus={() => handleFieldFocus('amount')}
          onChooseUnit={chooseUnit}
          visible={showFooter}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(CustomFoodScreen);
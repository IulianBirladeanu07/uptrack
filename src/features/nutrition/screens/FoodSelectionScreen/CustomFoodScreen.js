import { useState, useRef, useEffect, memo, forwardRef, useMemo, useCallback, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { styles, COLORS } from './CustomFoodScreenStyle';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomFood } from '../../helpers/useCustomFood';
import { useFoodContext } from '../../context/FoodContext';

const FoodInfoField = memo(forwardRef(({ label, field, iconName, unit, nextField, value, error, onChangeText, onFocus, onSubmitEditing }, ref) => {
  const textInputRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
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
      <View style={[styles.inputContainer, error && styles.errorInput]}>
        {iconName && <MaterialCommunityIcons name={iconName} size={20} color={COLORS.accent} style={styles.inputIcon} />}
        <TextInput
          ref={textInputRef}
          style={styles.input}
          placeholder={label === 'Name' ? 'e.g., Chicken Breast' : `Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={(text) => onChangeText(field, text)}
          keyboardType={label === 'Name' ? 'default' : 'numeric'}
          onFocus={() => onFocus(field)}
          onSubmitEditing={() => onSubmitEditing(field, nextField)}
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={nextField ? "next" : "done"}
          underlineColorAndroid="transparent"
          blurOnSubmit={false}
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}), (prevProps, nextProps) => (
  prevProps.value === nextProps.value &&
  prevProps.error === nextProps.error &&
  prevProps.field === nextProps.field
));

const NutrientDataField = memo(forwardRef(({ field, label, color, iconName, unit, width, nextField, value, onChangeText, onFocus, onSubmitEditing }, ref) => {
  const textInputRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
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
        <View style={styles.labelWithIndicator}>
          {iconName && <MaterialCommunityIcons name={iconName} size={16} color={color} />}
          <Text style={styles.nutrientHeaderLabel}>{label}</Text>
        </View>
      </View>
      <View style={styles.nutrientCell}>
        <TextInput
          ref={textInputRef}
          style={styles.nutrientInput}
          placeholder="0"
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={(text) => onChangeText(field, text)}
          keyboardType="numeric"
          onFocus={() => onFocus(field)}
          onSubmitEditing={() => onSubmitEditing(field, nextField)}
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={nextField ? "next" : "done"}
          underlineColorAndroid="transparent"
          maxLength={8}
          blurOnSubmit={false}
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
    </View>
  );
}), (prevProps, nextProps) => (
  prevProps.value === nextProps.value && prevProps.field === nextProps.field
));

const Footer = memo(({ foodData, handleSubmit, onAmountChange, visible }) => {
  if (!visible) return null;

  const canSubmit = !!foodData.productName;
  const calories = foodData.calories || 0;

  return (
    <View style={styles.footer}>
      <View style={styles.amountRow}>
        <TextInput
          style={styles.amountInput}
          placeholder="Serving amount"
          placeholderTextColor={COLORS.textSecondary}
          value={foodData.amount || ''}
          onChangeText={onAmountChange}
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          maxLength={5}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.unitSelector}>
          <Text style={styles.unitText}>{foodData.unit || 'g'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addButton, !canSubmit && styles.addButtonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.background} />
        <Text style={styles.addButtonText}>
          Add to Diary • {calories} kcal
        </Text>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => (
  prevProps.visible === nextProps.visible &&
  prevProps.foodData.amount === nextProps.foodData.amount &&
  prevProps.foodData.productName === nextProps.foodData.productName &&
  prevProps.foodData.calories === nextProps.foodData.calories
));


const CustomFoodScreen = () => {
  const route = useRoute();
  const { type, barcode, meal, selectedDate } = route.params;
  const { remainingCalories } = useFoodContext();
  const navigation = useNavigation();

  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});

  const [activeTab, setActiveTab] = useState('essential');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentFocusedField, setCurrentFocusedField] = useState(null);

  const {
    foodData,
    errors,
    handleFieldChange,
    handleFieldFocus: originalHandleFieldFocus,
    handleSubmitEditing,
    handleAmountChange,
    handleSubmit,
    focusFirstField
  } = useCustomFood(type, navigation, remainingCalories, barcode, meal, selectedDate, inputRefs);

  const handleFieldFocus = useCallback((field) => {
    setCurrentFocusedField(field);
    originalHandleFieldFocus(field);

    setTimeout(() => {
      const inputRef = inputRefs.current[field];
      if (inputRef && inputRef.measure && scrollViewRef.current) {
        inputRef.measure((x, y, width, height, pageX, pageY) => {
          scrollViewRef.current?.scrollTo({ 
            y: Math.max(0, pageY - 100), 
            animated: true 
          });
        });
      }
    }, 100);
  }, [originalHandleFieldFocus]);

  const registerInputRef = (field) => (ref) => {
    inputRefs.current[field] = ref;
  };

  const showFooter = !keyboardVisible || currentFocusedField === 'amount';
  const shouldShowBarcode = useMemo(() => type === 'foodWithBarcode', [type]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    const timer = setTimeout(focusFirstField, 300);

    return () => {
      clearTimeout(timer);
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [focusFirstField]);

  const macronutrients = useMemo(() => [
    { field: 'carbohydrates', label: 'Carbs', color: COLORS.green, iconName: 'leaf', unit: 'g', width: '31%', nextField: 'protein' },
    { field: 'protein', label: 'Protein', color: COLORS.purple, iconName: 'food-drumstick', unit: 'g', width: '31%', nextField: 'fats' },
    { field: 'fats', label: 'Fats', color: COLORS.blue, iconName: 'water', unit: 'g', width: '31%', nextField: 'fiber' },
  ], []);

  const otherNutrients = useMemo(() => [
    { field: 'fiber', label: 'Fiber', color: COLORS.green, iconName: 'leaf', unit: 'g', width: '48%', nextField: 'sugar' },
    { field: 'sugar', label: 'Sugar', color: COLORS.purple, iconName: 'cube-outline', unit: 'g', width: '48%', nextField: 'saturatedFat' },
    { field: 'saturatedFat', label: 'Sat Fat', color: COLORS.blue, iconName: 'water', unit: 'g', width: '48%', nextField: 'salt' },
    { field: 'salt', label: 'Salt', color: COLORS.blue, iconName: 'shaker-outline', unit: 'g', width: '48%', nextField: null },
  ], []);

  const screenTitle = useMemo(() => {
    switch (type) {
      case 'foodWithoutBarcode': return 'Create Your Own Food';
      case 'foodWithBarcode': return 'Add Food with Barcode';
      case 'meals': return 'Add a Meal';
      case 'customFood': return 'Add Custom Food';
      default: return 'Add Food';
    }
  }, [type]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            (keyboardVisible && !showFooter) && { paddingBottom: 20 }
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <Text style={styles.header}>{screenTitle}</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'essential' && styles.activeTab]}
              onPress={() => setActiveTab('essential')}
            >
              <Text style={[styles.tabText, activeTab === 'essential' && styles.activeTabText]}>
                Essential
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'detailed' && styles.activeTab]}
              onPress={() => setActiveTab('detailed')}
            >
              <Text style={[styles.tabText, activeTab === 'detailed' && styles.activeTabText]}>
                Detailed
              </Text>
            </TouchableOpacity>
          </View>

          <FoodInfoField
            label="Name"
            field="productName"
            iconName="food"
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
              iconName="barcode"
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
            nextField="carbohydrates"
            value={foodData.calories}
            error={errors.calories}
            onChangeText={handleFieldChange}
            onFocus={handleFieldFocus}
            onSubmitEditing={handleSubmitEditing}
            ref={registerInputRef('calories')}
          />

          {activeTab === 'essential' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Macronutrients</Text>
              <View style={styles.nutrientRow}>
                {macronutrients.map((nutrient) => (
                  <NutrientDataField
                    key={nutrient.field}
                    {...nutrient}
                    value={foodData[nutrient.field]}
                    onChangeText={handleFieldChange}
                    onFocus={handleFieldFocus}
                    onSubmitEditing={handleSubmitEditing}
                    ref={registerInputRef(nutrient.field)}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Nutrients</Text>
              <View style={styles.otherNutrientGrid}>
                {otherNutrients.map((nutrient) => (
                  <NutrientDataField
                    key={nutrient.field}
                    {...nutrient}
                    value={foodData[nutrient.field]}
                    onChangeText={handleFieldChange}
                    onFocus={handleFieldFocus}
                    onSubmitEditing={handleSubmitEditing}
                    ref={registerInputRef(nutrient.field)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <Footer
          foodData={foodData}
          handleSubmit={handleSubmit}
          onAmountChange={handleAmountChange}
          visible={showFooter}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(CustomFoodScreen);
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CustomFoodScreenStyle';
import { colors } from '../../../../shared/theme';
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
        {iconName && <MaterialCommunityIcons name={iconName} size={20} color={colors.accent.primary} style={styles.inputIcon} />}
        <TextInput
          ref={textInputRef}
          style={styles.input}
          placeholder={label === 'Name' ? 'e.g., Chicken Breast' : `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.text.secondary}
          value={value}
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
          placeholderTextColor={colors.text.secondary}
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
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
    </View>
  );
}));

const Footer = memo(({ foodData, handleSubmit, onAmountChange, visible }) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const canSubmit = !!foodData.productName && !!foodData.calories;
  const formattedKcal = Math.round(foodData.calories || 0).toLocaleString();

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.amountRow}>
        <TextInput
          style={styles.amountInput}
          placeholder="Serving amount"
          placeholderTextColor={colors.text.secondary}
          value={foodData.amount || ''}
          onChangeText={onAmountChange}
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          maxLength={5}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.unitSelector}>
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
          Add to Diary • {formattedKcal} kcal
        </Text>
      </TouchableOpacity>
    </View>
  );
});

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

  useEffect(() => {
    if (barcode) {
      handleFieldChange('barcode', barcode);
    }
  }, [barcode]);

  const handleFieldFocus = useCallback((field) => {
    setCurrentFocusedField(field);
    originalHandleFieldFocus(field);

    setTimeout(() => {
      const inputRef = inputRefs.current[field];
      if (inputRef && inputRef.measure && scrollViewRef.current) {
        inputRef.measure((x, y, width, height, pageX, pageY) => {
          scrollViewRef.current?.scrollTo({ 
            y: Math.max(0, pageY - 150), 
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

  const macronutrients = useMemo(() => [
    { field: 'carbohydrates', label: 'Carbs', color: colors.accent.success, iconName: 'leaf', unit: 'g', width: '31%', nextField: 'protein' },
    { field: 'protein', label: 'Protein', color: colors.accent.purple, iconName: 'food-drumstick', unit: 'g', width: '31%', nextField: 'fats' },
    { field: 'fats', label: 'Fats', color: colors.accent.cyan, iconName: 'water', unit: 'g', width: '31%', nextField: 'fiber' },
  ], []);

  const otherNutrients = useMemo(() => [
    { field: 'fiber', label: 'Fiber', color: colors.accent.success, iconName: 'leaf', unit: 'g', width: '48%', nextField: 'sugar' },
    { field: 'sugar', label: 'Sugar', color: colors.accent.purple, iconName: 'cube-outline', unit: 'g', width: '48%', nextField: 'saturatedFats' },
    { field: 'saturatedFats', label: 'Sat Fat', color: colors.accent.cyan, iconName: 'water', unit: 'g', width: '48%', nextField: 'salt' },
    { field: 'salt', label: 'Salt', color: colors.accent.primary, iconName: 'shaker-outline', unit: 'g', width: '48%', nextField: null },
  ], []);

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

          <View style={styles.tabContainer}>
            {['essential', 'detailed'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
            nextField="carbohydrates"
            value={foodData.calories}
            error={errors.calories}
            onChangeText={handleFieldChange}
            onFocus={handleFieldFocus}
            onSubmitEditing={handleSubmitEditing}
            ref={registerInputRef('calories')}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'essential' ? 'Macronutrients' : 'Additional Nutrients'}
            </Text>
            <View style={activeTab === 'essential' ? styles.nutrientRow : styles.otherNutrientGrid}>
              {(activeTab === 'essential' ? macronutrients : otherNutrients).map((n) => (
                <NutrientDataField
                  key={n.field}
                  {...n}
                  value={foodData[n.field]}
                  onChangeText={handleFieldChange}
                  onFocus={handleFieldFocus}
                  onSubmitEditing={handleSubmitEditing}
                  ref={registerInputRef(n.field)}
                />
              ))}
            </View>
          </View>
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
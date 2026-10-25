import { memo, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodContext } from '../../context/FoodContext';
import { colors, spacing } from '../../../../shared/theme';
import styles from './FoodDetailScreenStyle';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import type { FoodDetailFood, MealType } from '../../../../shared/types';

import MacroSection from './MacroSection';
import NutrientRow from './NutrientRow';
import ServingSizeSelector from './ServingSizeSelector';
import UnitPickerModal from './UnitPickerModal';
import { calculateTotalNutrients, handleFoodAddition } from '../../helpers/useFoodDetails';
import { convertQuantity } from '../../helpers/unitConversion';
import { toLocalDate } from '../../utils/dateUtils';

const DEFAULT_SERVING = Object.freeze({
  quantity: 100,
  unit: 'g'
});
const VALID_UNITS = Object.freeze(['g', 'oz', 'mL', 'cup', 'serving']);
const MAX_QUANTITY = 9999;

const FoodDetailScreen = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'FoodDetail'>();
  const insets = useSafeAreaInsets();
  const { meal, update, foodId, selectedDate: rawSelectedDate } = route.params;
  const food = route.params.food as FoodDetailFood | undefined;
  const baseQuantity = food?.quantity == null ? null : Number(food.quantity);
  const selectedDate = rawSelectedDate ? toLocalDate(rawSelectedDate) : new Date();

  const { updateMealInDatabase } = useFoodContext();
  const scrollRef = useRef<ScrollView>(null);
  
  const [servingQuantity, setServingQuantity] = useState(Number(food?.quantity) || DEFAULT_SERVING.quantity);
  const [servingUnit, setServingUnit] = useState(food?.unit || DEFAULT_SERVING.unit);
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [quantityValid, setQuantityValid] = useState(true);
  const [isFavorite, setIsFavorite] = useState(food?.isFavorite || false);

  const foods = useMemo(() => (food ? [food] : []), [food]);

  const memoizedTotalNutrients = useMemo(() => 
    calculateTotalNutrients(foods, servingQuantity, servingUnit),
    [foods, servingQuantity, servingUnit]
  );

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    const num = parseFloat(String(newQuantity));
    if (!isNaN(num) && num > 0 && num <= MAX_QUANTITY) {
      setServingQuantity(Number(num.toFixed(2)));
    }
  }, []);

  const handleUnitSelect = useCallback((newUnit: string) => {
    if (!VALID_UNITS.includes(newUnit)) return;
    if (newUnit !== servingUnit) {
      const converted = convertQuantity(servingQuantity, servingUnit, newUnit, baseQuantity, food?.unit);
      setServingQuantity(Math.min(MAX_QUANTITY, converted));
      setServingUnit(newUnit);
    }
    setUnitPickerVisible(false);
  }, [servingQuantity, servingUnit, baseQuantity, food?.unit]);

  const handleAddFood = useCallback(async () => {
    if (!food || !quantityValid) return;
    const result = await handleFoodAddition({
      quantity: servingQuantity,
      unit: servingUnit,
      food,
      foodId,
      meal: meal as MealType,
      updateMealInDatabase,
      selectedDate,
      update,
      isFavorite,
    });

    if (result.success) {
      if (result.navigation.screen === 'Nutrition') {
        navigation.navigate('Nutrition', result.navigation.params);
      } else {
        navigation.navigate('FoodSelection', result.navigation.params);
      }
    }
  }, [
    quantityValid,
    servingQuantity,
    servingUnit,
    food,
    foodId,
    meal,
    updateMealInDatabase,
    selectedDate,
    update,
    isFavorite,
    navigation,
  ]);

  if (!food) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.accent.errorAlt} />
          <Text style={styles.errorText}>No food data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingTop: insets.top }]}>
          <Image
            source={typeof food.image === 'string' ? { uri: food.image } : (food.image ?? null)}
            style={styles.foodImage}
            contentFit="contain"
          />
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={handleNavigateBack}
            accessible
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={spacing.iconLg} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingFavoriteButton}
            onPress={handleFavoriteToggle}
            accessible
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={spacing.iconLg}
              color={isFavorite ? colors.accent.errorAlt : colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.foodName}>{food.productName}</Text>

          <ServingSizeSelector
            quantity={servingQuantity}
            onQuantityChange={handleQuantityChange}
            servingUnit={servingUnit}
            onServingUnitPress={() => setUnitPickerVisible(true)}
            predefinedSizes={[50, 100, 150, 200]}
            maxQuantity={MAX_QUANTITY}
            onPredefinedSizePress={handleQuantityChange}
            onValidityChange={setQuantityValid}
          />

          <MacroSection
            protein={memoizedTotalNutrients.protein}
            carbs={memoizedTotalNutrients.carbohydrates}
            fat={memoizedTotalNutrients.fats}
            totalCalories={memoizedTotalNutrients.calories}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Micronutrients</Text>
          <View style={styles.nutrientsList}>
            <NutrientRow label="Fiber" value={memoizedTotalNutrients.fiber} color={colors.accent.success} />
            <NutrientRow label="Sugar" value={memoizedTotalNutrients.sugar} color={colors.accent.errorAlt} />
            <NutrientRow label="Salt" value={memoizedTotalNutrients.salt} unit="g" color={colors.accent.blue} />
            <NutrientRow label="Saturated Fats" value={memoizedTotalNutrients.saturatedFats} color={colors.accent.amber} />
          </View>
        </View>
      </ScrollView>

      <UnitPickerModal
        visible={unitPickerVisible}
        onClose={() => setUnitPickerVisible(false)}
        units={VALID_UNITS}
        selectedUnit={servingUnit}
        onSelectUnit={handleUnitSelect}
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing[5] }]}>
        <TouchableOpacity
          style={[styles.addButton, !quantityValid && styles.addButtonDisabled]}
          onPress={handleAddFood}
          disabled={!quantityValid}
          accessible
          accessibilityLabel="Add food to diary"
          accessibilityState={{ disabled: !quantityValid }}
        >
          <MaterialCommunityIcons name={update ? "check-circle" : "plus-circle"} size={spacing.iconMd} color={colors.accent.buttonText} />
          <Text style={styles.addButtonText}>
            {update ? 'Update Food' : `Add to Diary • ${memoizedTotalNutrients.calories} cal`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(FoodDetailScreen);
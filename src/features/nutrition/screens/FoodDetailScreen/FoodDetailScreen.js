import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodContext } from '../../context/FoodContext';
import { colors, spacing } from '../../../../shared/theme';
import styles from './FoodDetailScreenStyle';

import MacroSection from './MacroSection'
import NutrientRow from './NutrientRow';
import ServingSizeSelector from './ServingSizeSelector';
import UnitPickerModal from './UnitPickerModal';
import { calculateTotalNutrients, handleFoodAddition } from '../../helpers/useFoodDetails';

const DEFAULT_SERVING = Object.freeze({
  quantity: 100,
  unit: 'g'
});
const VALID_UNITS = Object.freeze(['g', 'oz', 'mL', 'cup', 'serving']);
const MAX_QUANTITY = 9999;

const FoodDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { food, meal, update, foodId, selectedDate: rawSelectedDate } = route.params || {};
  const selectedDate = rawSelectedDate ? new Date(rawSelectedDate) : new Date();

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

  const { updateMealInDatabase, addMultipleFoods } = useFoodContext();
  const scrollRef = useRef(null);
  
  const [servingQuantity, setServingQuantity] = useState(food.quantity || DEFAULT_SERVING.quantity);
  const [servingUnit, setServingUnit] = useState(food.unit || DEFAULT_SERVING.unit);
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(food?.isFavorite || false);

  const isMultipleFoods = useMemo(() => Array.isArray(meal?.foods), [meal]);
  const foods = useMemo(() => (isMultipleFoods ? meal.foods : [food]), [isMultipleFoods, meal, food]);

  const memoizedTotalNutrients = useMemo(() => 
    calculateTotalNutrients(foods, servingQuantity),
    [foods, servingQuantity]
  );

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  const handleQuantityChange = useCallback((newQuantity) => {
    const num = parseFloat(newQuantity);
    if (!isNaN(num) && num > 0 && num <= MAX_QUANTITY) {
      setServingQuantity(Number(num.toFixed(2)));
    }
  }, []);

  const handleUnitSelect = useCallback((newUnit) => {
    if (VALID_UNITS.includes(newUnit)) {
      setServingUnit(newUnit);
      setUnitPickerVisible(false);
    }
  }, []);

  const handleAddFood = useCallback(async () => {
    const result = await handleFoodAddition({
      quantity: servingQuantity,
      unit: servingUnit,
      food,
      foodId,
      meal,
      isMultipleFoods,
      foods,
      addMultipleFoods,
      updateMealInDatabase,
      selectedDate,
      update,
      isFavorite,
      remainingCalories: route.params.remainingCalories - food.calories,
    });

    if (result.success) {
      navigation.navigate(result.navigation.screen, result.navigation.params);
    }
  }, [
    servingQuantity,
    servingUnit,
    food,
    foodId,
    meal,
    isMultipleFoods,
    foods,
    addMultipleFoods,
    updateMealInDatabase,
    selectedDate,
    update,
    isFavorite,
    navigation,
    route.params?.remainingCalories,
  ]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingTop: insets.top }]}>
          <Image
            source={typeof food.image === 'string' ? { uri: food.image } : food.image}
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
            onPredefinedSizePress={handleQuantityChange}
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
          style={styles.addButton}
          onPress={handleAddFood}
          accessible
          accessibilityLabel="Add food to diary"
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

export default React.memo(FoodDetailScreen);
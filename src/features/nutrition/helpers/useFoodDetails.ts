import { Alert } from 'react-native';
import { scalingFactor } from './unitConversion';
import { formatDate } from '../utils/dateUtils';
import type { AuthenticatedStackParamList } from '../../../shared/navigation';
import type { FoodDetailFood, MealType, NutrientTotals, NutrientValues } from '../../../shared/types';

type FoodAdditionArgs = {
  quantity: number;
  unit: string;
  food: FoodDetailFood;
  foodId?: string | undefined;
  meal: MealType;
  updateMealInDatabase: (meal: MealType, foodId: string, details: FoodDetailFood) => Promise<unknown>;
  remainingCalories: number;
  selectedDate: Date | string;
  update?: boolean | undefined;
  isFavorite: boolean;
};

type FoodAdditionResult =
  | { success: false }
  | {
      success: true;
      navigation:
        | { screen: 'Nutrition'; params: NonNullable<AuthenticatedStackParamList['Nutrition']> }
        | { screen: 'FoodSelection'; params: NonNullable<AuthenticatedStackParamList['FoodSelection']> };
    };

export const calculateNutrientValue = (
  foodItem: FoodDetailFood,
  desiredQuantity: number,
  desiredUnit: string | null | undefined,
): NutrientValues => {
  const factor = scalingFactor(desiredQuantity, desiredUnit, foodItem.quantity == null ? null : Number(foodItem.quantity), foodItem.unit);

  return {
    calories: (parseFloat(String(foodItem.calories || 0)) * factor).toFixed(1),
    carbohydrates: (parseFloat(String(foodItem.carbohydrates || 0)) * factor).toFixed(1),
    fats: (parseFloat(String(foodItem.fats || 0)) * factor).toFixed(1),
    protein: (parseFloat(String(foodItem.protein || 0)) * factor).toFixed(1),
    fiber: (parseFloat(String(foodItem.fiber || 0)) * factor).toFixed(1),
    sugar: (parseFloat(String(foodItem.sugar || 0)) * factor).toFixed(1),
    salt: (parseFloat(String(foodItem.salt || 0)) * factor).toFixed(1),
    saturatedFats: (parseFloat(String(foodItem.saturatedFats || 0)) * factor).toFixed(1),
  };
};

export const calculateTotalNutrients = (
  foods: FoodDetailFood[],
  quantity = 100,
  unit: string | null | undefined,
): NutrientTotals => {
  return foods.reduce<NutrientTotals>((totals, food) => {
    const scaledValues = calculateNutrientValue(food, quantity, unit);
    
    return {
      calories: (totals.calories || 0) + (parseFloat(scaledValues.calories) || 0),
      carbohydrates: (totals.carbohydrates || 0) + (parseFloat(scaledValues.carbohydrates) || 0),
      fats: (totals.fats || 0) + (parseFloat(scaledValues.fats) || 0),
      protein: (totals.protein || 0) + (parseFloat(scaledValues.protein) || 0),
      fiber: (totals.fiber || 0) + (parseFloat(scaledValues.fiber) || 0),
      sugar: (totals.sugar || 0) + (parseFloat(scaledValues.sugar) || 0),
      salt: (totals.salt || 0) + (parseFloat(scaledValues.salt) || 0),
      saturatedFats: (totals.saturatedFats || 0) + (parseFloat(scaledValues.saturatedFats) || 0),
    };
  }, {
    calories: 0,
    carbohydrates: 0,
    fats: 0,
    protein: 0,
    fiber: 0,
    sugar: 0,
    salt: 0,
    saturatedFats: 0,
  });
};

export const generateRandomHexId = (length = 8): string => {
  const hexId = [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return hexId;
};

export const handleFoodAddition = async ({
  quantity,
  unit,
  food,
  foodId,
  meal,
  updateMealInDatabase,
  remainingCalories,
  selectedDate,
  update = false,
  isFavorite,
}: FoodAdditionArgs): Promise<FoodAdditionResult> => {
  if (quantity <= 0 || isNaN(quantity)) {
    Alert.alert("Invalid Quantity", "Please enter a valid quantity greater than 0.");
    return { success: false };
  }

  const currentFoodId = foodId || generateRandomHexId();
  const nutrients = calculateNutrientValue(food, quantity, unit);

  const updatedFoodDetails = {
    id: currentFoodId,
    productName: food.productName || 'Unknown',
    ...nutrients,
    quantity,
    unit,
    image: food.image,
    category: food.category,
    isFavorite: isFavorite,
    mealType: food.mealType || meal,
    lastUpdated: new Date().toISOString(),
  };

  if (update) {
    try {
      await updateMealInDatabase(meal, currentFoodId, updatedFoodDetails);
    } catch (error) {
      console.error('Failed to update food item:', error);
      Alert.alert("Couldn't save", 'Check your connection and try again.');
      return { success: false };
    }
    return {
      success: true,
      navigation: {
        screen: 'Nutrition',
        params: { meal }
      }
    };
  }

  return {
    success: true,
    navigation: {
      screen: 'FoodSelection',
      params: {
        selectedFoodDetail: updatedFoodDetails,
        meal,
        selectedDate: formatDate(selectedDate),
        remainingCalories: remainingCalories,
      }
    }
  };
};
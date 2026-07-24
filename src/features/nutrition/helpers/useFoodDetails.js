import { Alert } from 'react-native';

export const calculateNutrientValue = (foodItem, desiredQuantity) => {
  const originalQuantity = foodItem.quantity || 100;
  const scalingFactor = desiredQuantity / originalQuantity;
  
  return {
    calories: (parseFloat(foodItem.calories || 0) * scalingFactor).toFixed(1),
    carbohydrates: (parseFloat(foodItem.carbohydrates || 0) * scalingFactor).toFixed(1),
    fats: (parseFloat(foodItem.fats || 0) * scalingFactor).toFixed(1),
    protein: (parseFloat(foodItem.protein || 0) * scalingFactor).toFixed(1),
    fiber: (parseFloat(foodItem.fiber || 0) * scalingFactor).toFixed(1),
    sugar: (parseFloat(foodItem.sugar || 0) * scalingFactor).toFixed(1),
    salt: (parseFloat(foodItem.salt || 0) * scalingFactor).toFixed(1),
    saturatedFats: (parseFloat(foodItem.saturatedFats || 0) * scalingFactor).toFixed(1),
  };
};

export const calculateTotalNutrients = (foods, quantity = 100) => {
  return foods.reduce((totals, food) => {
    const scaledValues = calculateNutrientValue(food, quantity);
    
    return {
      calories: (parseFloat(totals.calories) || 0) + (parseFloat(scaledValues.calories) || 0),
      carbohydrates: (parseFloat(totals.carbohydrates) || 0) + (parseFloat(scaledValues.carbohydrates) || 0),
      fats: (parseFloat(totals.fats) || 0) + (parseFloat(scaledValues.fats) || 0),
      protein: (parseFloat(totals.protein) || 0) + (parseFloat(scaledValues.protein) || 0),
      fiber: (parseFloat(totals.fiber) || 0) + (parseFloat(scaledValues.fiber) || 0),
      sugar: (parseFloat(totals.sugar) || 0) + (parseFloat(scaledValues.sugar) || 0),
      salt: (parseFloat(totals.salt) || 0) + (parseFloat(scaledValues.salt) || 0),
      saturatedFats: (parseFloat(totals.saturatedFats) || 0) + (parseFloat(scaledValues.saturatedFats) || 0),
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

export const generateRandomHexId = (length = 8) => {
  const hexId = [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return hexId;
};

export const handleFoodAddition = async ({
  quantity,
  unit,
  food,
  foodId,
  meal,
  isMultipleFoods,
  foods,
  addMultipleFoods,
  updateMealInDatabase,
  remainingCalories,
  selectedDate,
  update = false,
  isFavorite,
}) => {
  if (quantity <= 0 || isNaN(quantity)) {
    Alert.alert("Invalid Quantity", "Please enter a valid quantity greater than 0.");
    return { success: false };
  }

  const currentFoodId = foodId || generateRandomHexId();
  const nutrients = calculateNutrientValue(food, quantity);

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

  if (isMultipleFoods) {
    const updatedFoods = foods.map(foodItem => ({
      ...foodItem,
      quantity,
      unit,
      isFavorite: isFavorite,
      mealType: foodItem.mealType || meal,
      ...calculateNutrientValue(foodItem, quantity),
    }));

    addMultipleFoods(meal, updatedFoods).catch(() => {});
    return {
      success: true,
      navigation: {
        screen: 'Nutrition',
        params: { refresh: true, meal }
      }
    };
  }

  if (update) {
    updateMealInDatabase(meal, currentFoodId, updatedFoodDetails).catch(() => {});
    return {
      success: true,
      navigation: {
        screen: 'Nutrition',
        params: { refresh: true, meal }
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
        selectedDate: selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate,
        refresh: true,
        remainingCalories: remainingCalories,
      }
    }
  };
};
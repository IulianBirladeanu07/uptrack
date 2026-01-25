import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import { useFoodContext } from '../../context/FoodContext';
import MealContainer from '../../components/NutritionItem/MealContainer';
import DateNavigationHeader from '../../components/DateNavigationHeader/DateNavigationHeader';
import NutritionStats from '../../components/NutritionStats/NutritionStats';
import styles from './NutritionScreenStyles';

const NutritionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    breakfastFoods,
    lunchFoods,
    dinnerFoods,
    snacksFoods,
    handleDeleteMeal,
    updateFoods,
    selectedDate,
    setSelectedDate,
    remainingCalories,
    dailyNutrition,
    userMacros,
    hasTargets,
    learningData,
  } = useFoodContext();

  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {});
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.refresh) {
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh, navigation]);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleFoodSelect = useCallback((item) => {
    const foodDetails = { 
      ...item, 
      date: selectedDate.toISOString(), 
      imageSource: item.image 
    };
    
    navigation.navigate('FoodDetail', { 
      food: foodDetails, 
      meal: selectedMeal, 
      date: selectedDate.toISOString(), 
      update: true, 
      foodId: item.id,
      imageSource: item.image
    });
  }, [navigation, selectedDate, selectedMeal]);

  const handleSwipeableOpen = useCallback(async (item) => {
    const { mealType, id } = item;
    try {
      await handleDeleteMeal(mealType, id);
      const mealUpdaters = {
        breakfast: () => updateFoods('breakfast', breakfastFoods.filter(f => f.id !== id)),
        lunch: () => updateFoods('lunch', lunchFoods.filter(f => f.id !== id)),
        dinner: () => updateFoods('dinner', dinnerFoods.filter(f => f.id !== id)),
        snacks: () => updateFoods('snacks', snacksFoods.filter(f => f.id !== id)),
      };
      if (mealUpdaters[mealType]) mealUpdaters[mealType]();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete meal.');
    }
  }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods, handleDeleteMeal, updateFoods]);

  const handleWeightPress = useCallback(() => {
    navigation.navigate('WeightTracker', {
      selectedDateString: selectedDate.toISOString(),
    });
  }, [navigation, selectedDate]);

  const handleAddFood = useCallback(() => {
    navigation.navigate('FoodSelection', { 
      meal: selectedMeal, 
      selectedDate: selectedDate.toISOString(), 
      remainingCalories: remainingCalories 
    });
  }, [navigation, selectedMeal, selectedDate, remainingCalories]);

  const combinedFoods = useMemo(() => {
    const mealFoods = { breakfast: breakfastFoods, lunch: lunchFoods, dinner: dinnerFoods, snacks: snacksFoods };
    return mealFoods[selectedMeal] || [];
  }, [selectedMeal, breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

  const totalCaloriesText = useMemo(() => {
    return `Total: ${Math.round(dailyNutrition.calories || 0)} Calories`;
  }, [dailyNutrition.calories]);

  return (
    <ApplicationCustomScreen
      headerLeft={<Ionicons name="person-circle-outline" size={28} color="#fdf5ec" />}
      headerRight={<Ionicons name="settings-outline" size={28} color="#fdf5ec" />}
      onProfilePress={() => navigation.navigate('Profile')}
      onSettingsPress={() => navigation.navigate('Settings')}
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <DateNavigationHeader
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />

          <NutritionStats
            onWeightPress={handleWeightPress}
            dailyNutrition={dailyNutrition}
            userMacros={userMacros}
            hasTargets={hasTargets}
            learningData={learningData}
            selectedDate={selectedDate}
          />

          <MealContainer
            foods={combinedFoods}
            foodName={styles.foodName}
            foodCalories={styles.foodCalories}
            foodNutrient={styles.foodNutrient}
            foodImage={styles.foodImage}
            foodContainer={styles.foodContainer}
            onSwipeableOpen={handleSwipeableOpen}
            onPress={handleFoodSelect}
            mealScrollView={styles.mealScrollView}
            isFoodDeletable={true}
            selectedMeal={selectedMeal}
            setSelectedMeal={setSelectedMeal}
            selectedDate={selectedDate}
            navigation={navigation}   
            remainingCalories={remainingCalories}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
              <Text style={styles.addButtonText}>Add Food</Text>
            </TouchableOpacity>
            <Text style={styles.totalCaloriesText}>{totalCaloriesText}</Text>
          </View>
        </View>
      </View>
    </ApplicationCustomScreen>
  );
};

export default NutritionScreen;
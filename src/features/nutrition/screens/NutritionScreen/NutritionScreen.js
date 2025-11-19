import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import { useFoodContext } from '../../context/FoodContext';
import MealContainer from '../../components/NutritionItem/MealContainer';
import WeightService from '../../services/weightService';
import useLearningCompletion from '../../helpers/useLearningCompletion';
import DateNavigationHeader from '../../components/DateNavigationHeader/DateNavigationHeader';
import NutritionStats from '../../components/NutritionStats/NutritionStats';
import styles from './NutritionScreenStyles';

const useWeightData = (userId, selectedDate) => {
  const [weightData, setWeightData] = useState({
    currentWeight: null,
    weeklyAverage: null,
    lastWeekAverage: null,
    weeklyTrend: null,
    weighInCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const loadedDatesRef = React.useRef(new Set());
  const previousDataRef = React.useRef(null);

  const dateString = selectedDate.toISOString().split('T')[0];
  const loadWeightData = useCallback(async () => {
    if (!userId || isLoading) return;
    
    const cacheKey = `${userId}-${dateString}`;
    if (loadedDatesRef.current.has(cacheKey)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await WeightService.getWeightDisplayData(userId, selectedDate);
      loadedDatesRef.current.add(cacheKey);
      
      if (previousDataRef.current &&
          previousDataRef.current.currentWeight === data.currentWeight &&
          previousDataRef.current.weeklyAverage === data.weeklyAverage &&
          previousDataRef.current.weeklyTrend === data.weeklyTrend &&
          previousDataRef.current.weighInCount === data.weighInCount) {
        return;
      }
      
      previousDataRef.current = data;
      setWeightData(data);
    } catch (error) {
      console.error('Error loading weight data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateString, isLoading]);

  const handleWeightSave = useCallback(async (weight, weeklyAverage, weeklyTrend) => {
    try {
      const cacheKey = `${userId}-${dateString}`;
      loadedDatesRef.current.delete(cacheKey);
      
      const newData = {
        ...weightData,
        currentWeight: weight,
        weeklyAverage: weeklyAverage,
        weeklyTrend: weeklyTrend,
        weighInCount: weightData.weighInCount + (weightData.currentWeight ? 0 : 1),
      };
      
      previousDataRef.current = newData;
      setWeightData(newData);
      await loadWeightData();
    } catch (error) {
      console.error('Error handling weight save:', error);
      Alert.alert('Error', 'Failed to save weight data. Please try again.');
    }
  }, [loadWeightData, userId, dateString, weightData]);

  return { weightData, loadWeightData, handleWeightSave };
};

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
    initialLoadComplete,
    loading: contextLoading,
    hasTargets,
    learningData,
  } = useFoodContext();

  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [userId, setUserId] = useState(null);

  // ADD THIS LINE - Call the useWeightData hook
  const { weightData, loadWeightData, handleWeightSave } = useWeightData(userId, selectedDate);

  const learningCompletion = useLearningCompletion(learningData, hasTargets);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  const dateString = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  
  useEffect(() => {
    if (userId) {
      loadWeightData();
    }
  }, [userId, dateString, loadWeightData]);

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
        breakfast: () => updateFoods('breakfast', breakfastFoods.filter(food => food.id !== id)),
        lunch: () => updateFoods('lunch', lunchFoods.filter(food => food.id !== id)),
        dinner: () => updateFoods('dinner', dinnerFoods.filter(food => food.id !== id)),
        snacks: () => updateFoods('snacks', snacksFoods.filter(food => food.id !== id)),
      };
      
      const updater = mealUpdaters[mealType];
      if (updater) {
        updater();
      }
    } catch (error) {
      console.error('Failed to handle swipeable open:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods, handleDeleteMeal, updateFoods]);

  const handleWeightPress = useCallback(() => {
    navigation.navigate('WeightTracker', {
      onWeightSave: handleWeightSave,
      currentWeight: weightData.currentWeight,
      weeklyAverage: weightData.weeklyAverage,
      weeklyTrend: weightData.weeklyTrend,
      selectedDate: selectedDate,
      weighInCount: weightData.weighInCount,
      lastWeekAverage: weightData.lastWeekAverage,
      date: selectedDate,
    });
  }, [navigation, handleWeightSave, weightData, selectedDate]);

  const handleAddFood = useCallback(() => {
    navigation.navigate('FoodSelection', { 
      meal: selectedMeal, 
      selectedDate: selectedDate.toISOString(), 
      remainingCalories: remainingCalories 
    });
  }, [navigation, selectedMeal, selectedDate, remainingCalories]);

  const handleProfilePress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const combinedFoods = useMemo(() => {
    const mealFoods = {
      breakfast: breakfastFoods,
      lunch: lunchFoods,
      dinner: dinnerFoods,
      snacks: snacksFoods,
    };
    return mealFoods[selectedMeal] || [];
  }, [selectedMeal, breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

  const totalCaloriesText = useMemo(() => {
    const roundedCalories = Math.round(dailyNutrition.calories || 0);
    return `Total: ${roundedCalories} Calories`;
  }, [dailyNutrition.calories]);

  if (contextLoading && !initialLoadComplete) {
    return (
      <ApplicationCustomScreen
        headerLeft={<Ionicons name="person-circle-outline" size={28} color="#fdf5ec" />}
        headerRight={<Ionicons name="settings-outline" size={28} color="#fdf5ec" />}
        onProfilePress={handleProfilePress}
        onSettingsPress={handleSettingsPress}
      >
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fdf5ec', fontSize: 18, marginBottom: 20 }}>
            Loading your nutrition data...
          </Text>
        </View>
      </ApplicationCustomScreen>
    );
  }

  return (
    <ApplicationCustomScreen
      headerLeft={<Ionicons name="person-circle-outline" size={28} color="#fdf5ec" />}
      headerRight={<Ionicons name="settings-outline" size={28} color="#fdf5ec" />}
      onProfilePress={handleProfilePress}
      onSettingsPress={handleSettingsPress}
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <DateNavigationHeader
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />

          <NutritionStats
            weightData={weightData}
            onWeightPress={handleWeightPress}
            dailyNutrition={dailyNutrition}
            userMacros={userMacros}
            hasTargets={hasTargets}
            learningData={learningData}
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
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddFood}
              accessibilityRole="button"
              accessibilityLabel="Add food"
              accessibilityHint="Add food to the selected meal"
              testID="add-food-button"
            >
              <Text style={styles.addButtonText}>Add Food</Text>
            </TouchableOpacity>

            <Text 
              style={styles.totalCaloriesText}
              accessibilityLabel={totalCaloriesText}
              testID="total-calories"
            >
              {totalCaloriesText}
            </Text>
          </View>
        </View>
      </View>
    </ApplicationCustomScreen>
  );
};

export default NutritionScreen;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { useFoodContext } from '../../context/FoodContext';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav, { useBottomNavInset } from '../../../../shared/components/BottomNav/BottomNav';
import MealContainer from '../../components/NutritionItem/MealContainer';
import useLearningCompletion from '../../helpers/useLearningCompletion';
import DateNavigationHeader from '../../components/DateNavigationHeader/DateNavigationHeader';
import NutritionStats from '../../components/NutritionStats/NutritionStats';
import useWeightData from '../../helpers/useWeightData';
import styles from './NutritionScreenStyles';
import type { FoodItemData } from '../../components/NutritionItem/FoodItem';
import { useAppNavigation } from '../../../../shared/navigation';
import { formatDate } from '../../utils/dateUtils';
import type { FoodDetailFood, LoggedFood, MealType } from '../../../../shared/types';

const NutritionScreen = () => {
    const navigation = useAppNavigation();
    const navInset = useBottomNavInset();

    const {
        breakfastFoods,
        lunchFoods,
        dinnerFoods,
        snacksFoods,
        handleDeleteMeal,
        selectedDate,
        setSelectedDate,
        remainingCalories,
        dailyNutrition,
        userMacros,
        initialLoadComplete,
        initializationError,
        retryInitialization,
        hasTargets,
        learningData,
        dailySteps,
    } = useFoodContext();

    const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
    const [userId] = useState<string | null>(() => getAuth().currentUser?.uid || null);
    const [isReady, setIsReady] = useState(false);

    const { weightData, refreshWeightData } = useWeightData(userId, selectedDate);
    useLearningCompletion(learningData, hasTargets);

    useEffect(() => {
        if (initialLoadComplete && userId) {
            setIsReady(true);
        }
    }, [initialLoadComplete, userId]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (userId) refreshWeightData();
        });
        return unsubscribe;
    }, [navigation, userId, refreshWeightData]);

    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, [setSelectedDate]);

    const handleFoodSelect = useCallback((item: FoodDetailFood) => {
        navigation.navigate('FoodDetail', {
            food: { ...item, date: formatDate(selectedDate), imageSource: item.image },
            meal: selectedMeal,
            selectedDate: formatDate(selectedDate),
            update: true,
            foodId: item.id,
        });
    }, [navigation, selectedDate, selectedMeal]);

    const handleSwipeableOpen = useCallback(async (item: FoodItemData) => {
        const { mealType, id } = item;
        try {
            await handleDeleteMeal(mealType as MealType, id as string);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete meal.');
        }
    }, [handleDeleteMeal]);

    const handleWeightPress = useCallback(() => {
        navigation.navigate('WeightTracker');
    }, [navigation]);

    const handleAddFood = useCallback(() => {
        navigation.navigate('FoodSelection', {
            meal:              selectedMeal,
            selectedDate:      formatDate(selectedDate),
            remainingCalories: remainingCalories,
        });
    }, [navigation, selectedMeal, selectedDate, remainingCalories]);

    const combinedFoods = useMemo(() => {
        const mealFoods: Record<MealType, LoggedFood[]> = { breakfast: breakfastFoods, lunch: lunchFoods, dinner: dinnerFoods, snacks: snacksFoods };
        return mealFoods[selectedMeal] || [];
    }, [selectedMeal, breakfastFoods, lunchFoods, dinnerFoods, snacksFoods]);

    const statsComponent = useMemo(() => (
        <NutritionStats
            weightData={weightData}
            onWeightPress={handleWeightPress}
            dailyNutrition={dailyNutrition}
            userMacros={userMacros}
            hasTargets={hasTargets}
            learningData={learningData}
            dailySteps={dailySteps}
            initialLoadComplete={initialLoadComplete}
        />
    ), [weightData, handleWeightPress, dailyNutrition, userMacros, hasTargets, learningData, dailySteps, initialLoadComplete]);

    if (!isReady) {
        return (
            <ApplicationCustomScreen>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    {initializationError ? (
                        <>
                            <Text style={styles.initializationError}>{initializationError}</Text>
                            <TouchableOpacity
                                accessibilityRole="button"
                                onPress={retryInitialization}
                                style={styles.retryButton}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <ActivityIndicator size="large" color="#FF9500" />
                    )}
                </View>
            </ApplicationCustomScreen>
        );
    }

    return (
        <ApplicationCustomScreen>
            <View style={styles.container}>
                <View style={[styles.contentContainer, { paddingBottom: navInset }]}>
                    <DateNavigationHeader
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                    />

                    {statsComponent}

                    <MealContainer
                        foods={combinedFoods}
                        onSwipeableOpen={handleSwipeableOpen}
                        onPress={handleFoodSelect}
                        isFoodDeletable={true}
                        selectedMeal={selectedMeal}
                        setSelectedMeal={setSelectedMeal}
                        onAddFood={handleAddFood}
                    />
                </View>
                <BottomNav />
            </View>
        </ApplicationCustomScreen>
    );
};

export default NutritionScreen;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { useFoodContext } from '../../context/FoodContext';

import ApplicationCustomScreen from '../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen';
import BottomNav from '../../../../shared/components/BottomNav/BottomNav';
import MealContainer from '../../components/NutritionItem/MealContainer';
import useLearningCompletion from '../../helpers/useLearningCompletion';
import DateNavigationHeader from '../../components/DateNavigationHeader/DateNavigationHeader';
import NutritionStats from '../../components/NutritionStats/NutritionStats';
import useWeightData from '../../helpers/useWeightData';
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
        initialLoadComplete,
        hasTargets,
        learningData,
        dailySteps,
    } = useFoodContext();

    const [selectedMeal, setSelectedMeal] = useState('breakfast');
    const [userId] = useState(() => getAuth().currentUser?.uid || null);
    const [isReady, setIsReady] = useState(false);

    const { weightData, refreshWeightData } = useWeightData(userId, selectedDate);
    const learningCompletion = useLearningCompletion(learningData, hasTargets);

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

    useEffect(() => {
        if (route.params?.refresh) {
            navigation.setParams({ refresh: false });
        }
    }, [route.params?.refresh, navigation]);

    const handleDateChange = useCallback((date) => {
        setSelectedDate(date);
    }, [setSelectedDate]);

    const handleFoodSelect = useCallback((item) => {
        navigation.navigate('FoodDetail', {
            food: { ...item, date: selectedDate.toISOString(), imageSource: item.image },
            meal: selectedMeal,
            date: selectedDate.toISOString(),
            update: true,
            foodId: item.id,
            imageSource: item.image,
        });
    }, [navigation, selectedDate, selectedMeal]);

    const handleSwipeableOpen = useCallback(async (item) => {
        const { mealType, id } = item;
        try {
            await handleDeleteMeal(mealType, id);
            const mealUpdaters = {
                breakfast: () => updateFoods('breakfast', breakfastFoods.filter(f => f.id !== id)),
                lunch:     () => updateFoods('lunch', lunchFoods.filter(f => f.id !== id)),
                dinner:    () => updateFoods('dinner', dinnerFoods.filter(f => f.id !== id)),
                snacks:    () => updateFoods('snacks', snacksFoods.filter(f => f.id !== id)),
            };
            if (mealUpdaters[mealType]) mealUpdaters[mealType]();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete meal.');
        }
    }, [breakfastFoods, lunchFoods, dinnerFoods, snacksFoods, handleDeleteMeal, updateFoods]);

    const handleWeightPress = useCallback(() => {
        navigation.navigate('WeightTracker', {
            currentWeight:      weightData.currentWeight,
            weeklyAverage:      weightData.weeklyAverage,
            weeklyTrend:        weightData.weeklyTrend,
            selectedDateString: selectedDate.toISOString(),
            weighInCount:       weightData.weighInCount,
            lastWeekAverage:    weightData.lastWeekAverage,
        });
    }, [navigation, weightData, selectedDate]);

    const handleAddFood = useCallback(() => {
        navigation.navigate('FoodSelection', {
            meal:              selectedMeal,
            selectedDate:      selectedDate.toISOString(),
            remainingCalories: remainingCalories,
        });
    }, [navigation, selectedMeal, selectedDate, remainingCalories]);

    const combinedFoods = useMemo(() => {
        const mealFoods = { breakfast: breakfastFoods, lunch: lunchFoods, dinner: dinnerFoods, snacks: snacksFoods };
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
            <ApplicationCustomScreen
                headerLeft={<Ionicons name="person-circle-outline" size={28} color="#fdf5ec" />}
                headerRight={<Ionicons name="settings-outline" size={28} color="#fdf5ec" />}
                onProfilePress={() => navigation.navigate('Profile')}
                onSettingsPress={() => navigation.navigate('Settings')}
            >
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#FF9500" />
                </View>
            </ApplicationCustomScreen>
        );
    }

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

                    {statsComponent}

                    <MealContainer
                        foods={combinedFoods}
                        onSwipeableOpen={handleSwipeableOpen}
                        onPress={handleFoodSelect}
                        mealScrollView={styles.mealScrollView}
                        isFoodDeletable={true}
                        selectedMeal={selectedMeal}
                        setSelectedMeal={setSelectedMeal}
                        selectedDate={selectedDate}
                        navigation={navigation}
                        remainingCalories={remainingCalories}
                        onAddFood={handleAddFood}
                    />
                </View>
                <BottomNav />
            </View>
        </ApplicationCustomScreen>
    );
};

export default NutritionScreen;
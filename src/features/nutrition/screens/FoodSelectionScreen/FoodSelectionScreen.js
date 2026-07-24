import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, ActivityIndicator, Alert, Text, Keyboard, BackHandler } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodContext } from '../../context/FoodContext';
import SearchBar from '../../components/SearchBar/SearchBar';
import AddFoodMenu from '../../components/AddFoodMenu/AddFoodMenu';
import CategorySelector from '../../components/CategorySelector/CategorySelector';
import FoodListItem from '../../components/NutritionItem/FoodListItem';
import DoneButton from '../../../../shared/components/DoneButton/DoneButton';
import { useFoodSearch } from '../../helpers/useFoodSearch';
import { useRecentSearches } from '../../helpers/useRecentSearches';
import FoodSelectionHeader from '../../components/FoodSelectionHeader/FoodSelectionHeader';
import styles from './FoodSelectionScreenStyle';
import { normalize } from '../../../../shared/hooks/useResponsive';
import useFoodCategories from '../../helpers/useFoodCategories';

const LoadingView = React.memo(() => (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.infoText}>Loading...</Text>
    </View>
));

const ErrorView = React.memo(({ error }) => (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.infoText, { fontSize: normalize(18) }]}>Unable to load food data</Text>
        <Text style={styles.infoText}>{error}</Text>
    </View>
));

const FoodSelectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { meal, selectedDate, selectedFoodDetail } = route.params || {};

    const searchTimeoutRef = useRef(null);
    const mountedRef = useRef(true);
    const isSubmittingRef = useRef(false);

    const {
        handleAddMeal,
        remainingCalories,
        dailyNutrition,
        userMacros,
        error,
        loading: contextLoading,
    } = useFoodContext();

    const {
        categoryFoods,
        selectedCategory,
        handleCategoryChange,
        loading: categoryLoading,
    } = useFoodCategories();

    const {
        recentSearches,
        loading: recentSearchesLoading,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        hasRecentSearch,
    } = useRecentSearches();

    const [selectedFoods, setSelectedFoods] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [headerCollapsed, setHeaderCollapsed] = useState(false);
    const [isQuickActionsExpanded, setIsQuickActionsExpanded] = useState(false);

    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        loading: searchLoading,
        handleSearch,
    } = useFoodSearch();

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const formattedDate = useMemo(() => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    }, [selectedDate]);

    const currentCalories = useMemo(() => Math.round(dailyNutrition?.calories || 0), [dailyNutrition?.calories]);
    const targetCalories = useMemo(() => Math.round(userMacros?.targetCalories || 2000), [userMacros?.targetCalories]);

    useEffect(() => {
        if (selectedFoodDetail && !selectedFoods.some(food => food.productName === selectedFoodDetail.productName)) {
            setSelectedFoods(prev => [...prev, selectedFoodDetail]);
        }
    }, [selectedFoodDetail]);

    const handleSearchComplete = useCallback(async (query) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length >= 3 && !hasRecentSearch(trimmedQuery)) {
            await addRecentSearch(trimmedQuery);
        }
    }, [addRecentSearch, hasRecentSearch]);

    const debouncedSearch = useCallback((query) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && query && query.trim().length >= 2) {
                handleSearch(query);
            }
        }, 300);
    }, [handleSearch]);

    useEffect(() => {
        if (!isSearching) return;
        if (searchQuery && searchQuery.trim().length >= 2) {
            debouncedSearch(searchQuery);
        }
    }, [searchQuery, isSearching]);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (isQuickActionsExpanded) {
                    setIsQuickActionsExpanded(false);
                    return true;
                }
                if (isSearching) {
                    handleExitSearch();
                    return true;
                }
                return false;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => backHandler.remove();
        }, [isSearching, isQuickActionsExpanded])
    );

    const handleNavigateToFoodDetail = useCallback(async (food) => {
        if (isSearching && searchQuery && searchQuery.trim().length >= 3) {
            await handleSearchComplete(searchQuery);
        }
        navigation.navigate('FoodDetail', { food, meal, selectedDate, remainingCalories });
    }, [navigation, meal, selectedDate, remainingCalories, isSearching, searchQuery, handleSearchComplete]);

    const toggleFoodSelection = useCallback(async (item) => {
        if (isSearching && searchQuery && searchQuery.trim().length >= 3) {
            await handleSearchComplete(searchQuery);
        }
        setSelectedFoods(prev => {
            const isSelected = prev.some(food => food.productName === item.productName);
            return isSelected
                ? prev.filter(food => food.productName !== item.productName)
                : [...prev, item];
        });
    }, [isSearching, searchQuery, handleSearchComplete]);

    const handleDone = useCallback(async () => {
        if (isSubmittingRef.current) return;
        if (selectedFoods.length === 0) {
            Alert.alert("No Foods Selected", "Please select at least one food item.");
            return;
        }
        isSubmittingRef.current = true;
        const validatedFoods = selectedFoods.map(food => ({
            ...food,
            id: food.id || `${Date.now()}_${Math.random()}`,
            calories: parseFloat(food.calories) || 0,
            protein: parseFloat(food.protein) || 0,
            carbohydrates: parseFloat(food.carbohydrates) || 0,
            fats: parseFloat(food.fats) || 0,
            quantity: food.quantity || 1,
            mealType: meal,
        }));
        handleAddMeal(meal, validatedFoods, selectedDate).catch(() => {});
        navigation.navigate('Nutrition', { refresh: true });
    }, [selectedFoods, handleAddMeal, meal, selectedDate, navigation]);

    const handleEnterSearch = useCallback(() => {
        setIsSearching(true);
        setIsQuickActionsExpanded(false);
    }, []);

    const handleExitSearch = useCallback(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setSearchQuery('');
        setIsSearching(false);
        Keyboard.dismiss();
    }, [setSearchQuery]);

    const handleSearchFocus = useCallback(() => handleEnterSearch(), [handleEnterSearch]);

    const handleSearchSubmit = useCallback(async () => {
        if (searchQuery && searchQuery.trim().length >= 3) {
            await handleSearchComplete(searchQuery);
        }
    }, [searchQuery, handleSearchComplete]);

    const handleRecentSearchPress = useCallback(async (searchTerm) => {
        setSearchQuery(searchTerm);
        await addRecentSearch(searchTerm);
    }, [setSearchQuery, addRecentSearch]);

    const handleRemoveRecentSearch = useCallback(async (searchTerm) => {
        await removeRecentSearch(searchTerm);
    }, [removeRecentSearch]);

    const handleClearAllRecentSearches = useCallback(async () => {
        Alert.alert(
            "Clear Search History",
            "Are you sure you want to clear all recent searches?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearRecentSearches();
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear search history");
                        }
                    },
                },
            ]
        );
    }, [clearRecentSearches]);

    const handleToggleCollapse = useCallback((collapsed) => setHeaderCollapsed(collapsed), []);
    const handleQuickActionsPress = useCallback(() => setIsQuickActionsExpanded(true), []);
    const handleQuickActionsClose = useCallback(() => setIsQuickActionsExpanded(false), []);

    const isLoading = contextLoading || categoryLoading;
    const hasError = error && !isLoading;

    if (isLoading) return <LoadingView />;
    if (hasError) return <ErrorView error={error} />;

    return (
        <View style={[styles.container, { paddingTop: insets.top + normalize(10) }]}>
            {!isSearching && (
                <FoodSelectionHeader
                    date={formattedDate}
                    dailyGoal={targetCalories}
                    selectedFoods={selectedFoods}
                    currentCalories={currentCalories}
                    targetCalories={targetCalories}
                    onQuickActionsPress={handleQuickActionsPress}
                />
            )}

            <View style={[
                styles.headerContainer,
                headerCollapsed && !isSearching && styles.headerContainerCollapsed,
                isSearching && styles.headerContainerSearching,
            ]}>
                <SearchBar
                    meal={meal}
                    selectedDate={selectedDate}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onFocus={handleSearchFocus}
                    onClear={handleExitSearch}
                    onSubmitEditing={handleSearchSubmit}
                    isSearching={isSearching}
                />

                {!isSearching && (
                    <CategorySelector
                        selectedCategory={selectedCategory}
                        setSelectedCategory={handleCategoryChange}
                        loading={categoryLoading}
                    />
                )}
            </View>

            {isSearching && searchLoading && (
                <View style={styles.searchLoadingContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={styles.searchLoadingText}>Searching foods...</Text>
                </View>
            )}

            <View style={[
                styles.foodListContainer,
                headerCollapsed && !isSearching && styles.foodListContainerExpanded,
                isSearching && styles.foodListContainerSearching,
            ]}>
                <FoodListItem
                    isSearching={isSearching}
                    selectedCategory={selectedCategory}
                    searchResults={searchResults}
                    categoryFoods={categoryFoods}
                    searchQuery={searchQuery}
                    handleNavigateToFoodDetail={handleNavigateToFoodDetail}
                    handlePlusPress={toggleFoodSelection}
                    selectedFoods={selectedFoods}
                    meal={meal}
                    recentSearches={recentSearches}
                    setSearchQuery={setSearchQuery}
                    onRecentSearchPress={handleRecentSearchPress}
                    onRemoveRecentSearch={handleRemoveRecentSearch}
                    onClearAllRecentSearches={handleClearAllRecentSearches}
                    recentSearchesLoading={recentSearchesLoading}
                />
            </View>

            <AddFoodMenu
                isExpanded={isQuickActionsExpanded}
                onClose={handleQuickActionsClose}
                navigation={navigation}
                meal={meal}
            />

            <View style={{ paddingBottom: insets.bottom || 20 }}>
                <DoneButton
                    selectedFoods={selectedFoods}
                    handleDone={handleDone}
                    disabled={selectedFoods.length === 0}
                />
            </View>
        </View>
    );
};

export default React.memo(FoodSelectionScreen);
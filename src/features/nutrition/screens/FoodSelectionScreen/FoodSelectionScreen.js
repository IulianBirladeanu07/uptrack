import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, ActivityIndicator, Alert, Text, Keyboard, BackHandler } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodContext } from '../../context/FoodContext';
import SearchBar from '../../components/SearchBar/SearchBar';
import FabMenu from '../../components/FabMenu/FabMenu';
import CategorySelector from '../../components/CategorySelector/CategorySelector';
import FoodListItem from '../../components/NutritionItem/FoodListItem';
import DoneButton from '../../../../shared/components/DoneButton/DoneButton';
import { useFoodSearch } from '../../helpers/useFoodSearch';
import { useRecentSearches } from '../../helpers/useRecentSearches';
import FoodSelectionHeader from '../../components/FoodSelectionHeader/FoodSelectionHeader';
import styles from './FoodSelectionScreenStyle';
import { normalize } from '../../../../shared/hooks/useResponsive';
import useFoodCategories from '../../helpers/useFoodCategories';

const MemoizedSearchBar = React.memo(SearchBar, (prev, next) => 
  prev.searchQuery === next.searchQuery && 
  prev.isSearching === next.isSearching &&
  prev.meal === next.meal &&
  prev.selectedDate === next.selectedDate
);

const MemoizedCategorySelector = React.memo(CategorySelector, (prev, next) => 
  prev.selectedCategory === next.selectedCategory && prev.loading === next.loading
);

const MemoizedFoodListItem = React.memo(FoodListItem, (prev, next) => {
  const prevSelectedLength = prev.selectedFoods?.length || 0;
  const nextSelectedLength = next.selectedFoods?.length || 0;
  
  return (
    prevSelectedLength === nextSelectedLength &&
    prev.categoryFoods === next.categoryFoods &&
    prev.searchResults === next.searchResults &&
    prev.meal === next.meal &&
    prev.isSearching === next.isSearching &&
    prev.recentSearches === next.recentSearches
  );
});

const MemoizedFabMenu = React.memo(FabMenu);

const MemoizedDoneButton = React.memo(DoneButton, (prev, next) => {
  const prevLength = prev.selectedFoods?.length || 0;
  const nextLength = next.selectedFoods?.length || 0;
  return prevLength === nextLength;
});

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
  
  const selectedFoodsRef = useRef([]);
  const searchTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  
  const { 
    handleAddMeal, 
    remainingCalories,
    dailyNutrition,
    userMacros,
    error,
    loading: contextLoading
  } = useFoodContext();

  const {
    categoryFoods,
    selectedCategory,
    handleCategoryChange,
    loading: categoryLoading
  } = useFoodCategories();

  const {
    recentSearches,
    loading: recentSearchesLoading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    hasRecentSearch,
    isEmpty: recentSearchesEmpty
  } = useRecentSearches();

  const [selectedFoods, setSelectedFoodsState] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults,
    loading: searchLoading, 
    handleSearch 
  } = useFoodSearch();

  const safeSearchResults = searchResults || [];
  const safeCategoryFoods = categoryFoods || [];
  const safeSelectedFoods = selectedFoods || [];
  const safeRecentSearches = recentSearches || [];

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const setSelectedFoods = useCallback((updater) => {
    const newFoods = typeof updater === 'function' ? updater(selectedFoodsRef.current || []) : updater;
    const safeFoods = Array.isArray(newFoods) ? newFoods : [];
    selectedFoodsRef.current = safeFoods;
    setSelectedFoodsState(safeFoods);
  }, []);

  const formattedDate = useMemo(() => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);
  
  const currentCalories = useMemo(() => {
    return Math.round(dailyNutrition?.calories || 0);
  }, [dailyNutrition?.calories]);

  const targetCalories = useMemo(() => {
    return Math.round(userMacros?.targetCalories || 2000);
  }, [userMacros?.targetCalories]);
  
  useEffect(() => {
    if (selectedFoodDetail && !selectedFoodsRef.current.some(food => 
        food.productName === selectedFoodDetail.productName)) {
      setSelectedFoods(prev => [...(prev || []), selectedFoodDetail]);
    }
  }, [selectedFoodDetail, setSelectedFoods]);

  const handleSearchComplete = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length >= 3 && !hasRecentSearch(trimmedQuery)) {
      await addRecentSearch(trimmedQuery);
    }
  }, [addRecentSearch, hasRecentSearch]);

  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      if (mountedRef.current) {
        if (query && query.trim() && query.trim().length >= 2) {
          handleSearch(query);
        } else {
          handleSearch('');
        }
      }
    }, 300);
  }, [handleSearch]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isSearching) {
          handleExitSearch();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [isSearching])
  );

  const handleNavigateToFoodDetail = useCallback(async (food) => {
    if (isSearching && searchQuery && searchQuery.trim().length >= 3) {
      await handleSearchComplete(searchQuery);
    }
    
    navigation.navigate('FoodDetail', { 
      food, 
      meal, 
      selectedDate, 
      remainingCalories 
    });
  }, [navigation, meal, selectedDate, remainingCalories, isSearching, searchQuery, handleSearchComplete]);

  const toggleFoodSelection = useCallback(async (item) => {
    if (isSearching && searchQuery && searchQuery.trim().length >= 3) {
      await handleSearchComplete(searchQuery);
    }
    
    setSelectedFoods(prev => {
      const safePrev = prev || [];
      const isSelected = safePrev.some(food => food.productName === item.productName);
      return isSelected 
        ? safePrev.filter(food => food.productName !== item.productName) 
        : [...safePrev, item];
    });
  }, [setSelectedFoods, isSearching, searchQuery, handleSearchComplete]);

  const handleDone = useCallback(async () => {
    const currentSelectedFoods = selectedFoodsRef.current || [];
    
    if (currentSelectedFoods.length === 0) {
      Alert.alert("No Foods Selected", "Please select at least one food item.");
      return;
    }
    
    const validatedFoods = currentSelectedFoods.map(food => ({
      ...food,
      id: food.id || `${Date.now()}_${Math.random()}`,
      calories: parseFloat(food.calories) || 0,
      protein: parseFloat(food.protein) || 0,
      carbohydrates: parseFloat(food.carbohydrates) || 0,
      fats: parseFloat(food.fats) || 0,
      quantity: food.quantity || 1,
      mealType: meal
    }));
    
    try {
      await handleAddMeal(meal, validatedFoods, selectedDate);
      navigation.navigate('Nutrition', { refresh: true });
    } catch (error) {
      Alert.alert("Error", `Failed to save meal: ${error.message}`);
    }
  }, [handleAddMeal, meal, selectedDate, navigation]);

  const handleEnterSearch = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleExitSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setSearchQuery('');
    setIsSearching(false);
    
    Keyboard.dismiss();
  }, [setSearchQuery]);

  const handleSearchInput = useCallback((query) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [setSearchQuery, debouncedSearch]);

  const handleSearchFocus = useCallback(() => {
    handleEnterSearch();
  }, [handleEnterSearch]);

  const handleSearchSubmit = useCallback(async () => {
    if (searchQuery && searchQuery.trim().length >= 3) {
      await handleSearchComplete(searchQuery);
    }
  }, [searchQuery, handleSearchComplete]);

  const handleRecentSearchPress = useCallback(async (searchTerm) => {
    setSearchQuery(searchTerm);
    handleSearch(searchTerm);
    await addRecentSearch(searchTerm);
  }, [setSearchQuery, handleSearch, addRecentSearch]);

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
          onPress: clearRecentSearches
        }
      ]
    );
  }, [clearRecentSearches]);

  const handleCaloriePress = useCallback(() => {
    navigation.navigate('CalorieGoal');
  }, [navigation]);

  const handleToggleCollapse = useCallback((collapsed) => {
    setHeaderCollapsed(collapsed);
  }, []);

  const isLoading = contextLoading || categoryLoading;
  const hasError = error && !isLoading;

  if (isLoading) {
    return <LoadingView />;
  }

  if (hasError) {
    return <ErrorView error={error} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + normalize(10) }]}>
      {!isSearching && (
        <FoodSelectionHeader 
          date={formattedDate}
          dailyGoal={targetCalories}
          selectedFoods={safeSelectedFoods}
          onCaloriePress={handleCaloriePress}
          currentCalories={currentCalories}
          targetCalories={targetCalories}
        />  
      )}

      <View style={[
        styles.headerContainer,
        headerCollapsed && !isSearching && styles.headerContainerCollapsed,
        isSearching && styles.headerContainerSearching
      ]}>
        <View style={styles.searchContainer}>
          <MemoizedSearchBar
            meal={meal}
            selectedDate={selectedDate}
            searchQuery={searchQuery || ''}
            setSearchQuery={handleSearchInput}
            handleSearch={handleSearchInput}
            onFocus={handleSearchFocus}
            onClear={handleExitSearch}
            onSubmitEditing={handleSearchSubmit}
            isSearching={isSearching}
            style={styles.searchBox}
          />
        </View>

        {!isSearching && (
          <MemoizedCategorySelector
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
        isSearching && styles.foodListContainerSearching
      ]}>
        <MemoizedFoodListItem 
          isSearching={isSearching}
          selectedCategory={selectedCategory}
          searchResults={safeSearchResults}
          categoryFoods={safeCategoryFoods}
          searchQuery={searchQuery}
          handleNavigateToFoodDetail={handleNavigateToFoodDetail}
          handlePlusPress={toggleFoodSelection}
          selectedFoods={safeSelectedFoods}
          meal={meal}
          recentSearches={safeRecentSearches}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearchInput}
          onRecentSearchPress={handleRecentSearchPress}
          onRemoveRecentSearch={handleRemoveRecentSearch}
          onClearAllRecentSearches={handleClearAllRecentSearches}
          recentSearchesLoading={recentSearchesLoading}
        />
      </View>

      {!isSearching && (
        <MemoizedFabMenu 
          navigation={navigation}
          meal={meal}
          isSearching={isSearching}
        />
      )}

      <View style={{ paddingBottom: insets.bottom || 20}}>
        <MemoizedDoneButton 
          selectedFoods={safeSelectedFoods}
          handleDone={handleDone}
          disabled={safeSelectedFoods.length === 0}
        />
      </View>
    </View>
  );
};

export default React.memo(FoodSelectionScreen);
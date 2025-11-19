import { useState, useCallback, useMemo } from 'react';
import { useFoodContext } from '../context/FoodContext';

const useFoodCategories = () => {
  const { 
    recentMeals, 
    frequentFoods, 
    favoriteFoods,
    loading: contextLoading
  } = useFoodContext();
  
  const [selectedCategory, setSelectedCategory] = useState('Frequent');

  // Optimized category data functions with early returns
  const getCategoryFoods = useCallback((category) => {
    const categoryLower = category?.toLowerCase();
    
    switch (categoryLower) {
      case 'frequent':
        return { 
          data: frequentFoods || [], 
          loaded: !contextLoading && Array.isArray(frequentFoods) 
        };
      case 'recent':
        return { 
          data: recentMeals || [], 
          loaded: !contextLoading && Array.isArray(recentMeals) 
        };
      case 'favorites':
        return { 
          data: favoriteFoods || [], 
          loaded: !contextLoading && Array.isArray(favoriteFoods) 
        };
      default:
        return { data: [], loaded: true };
    }
  }, [frequentFoods, recentMeals, favoriteFoods, contextLoading]);

  const getCategoryLoadingState = useCallback((category) => {
    if (contextLoading) return true;
    
    const categoryLower = category?.toLowerCase();
    switch (categoryLower) {
      case 'frequent':
        return !Array.isArray(frequentFoods);
      case 'recent':
        return !Array.isArray(recentMeals);
      case 'favorites':
        return !Array.isArray(favoriteFoods);
      default:
        return false;
    }
  }, [contextLoading, frequentFoods, recentMeals, favoriteFoods]);

  // Current category data with better memoization
  const categoryData = useMemo(() => {
    return getCategoryFoods(selectedCategory);
  }, [selectedCategory, getCategoryFoods]);

  const loading = useMemo(() => {
    return getCategoryLoadingState(selectedCategory);
  }, [selectedCategory, getCategoryLoadingState]);

  // Simplified category messages
  const message = useMemo(() => {
    if (loading) return `Loading ${selectedCategory.toLowerCase()} foods...`;
    
    if (categoryData.data.length === 0) {
      const messages = {
        frequent: 'No frequently used foods found. Foods will appear here as you log meals.',
        recent: 'No recent meals found. Your recent meals will appear here.',
        favorites: 'No favorite foods found. Add foods to favorites to see them here.'
      };
      return messages[selectedCategory.toLowerCase()] || 'No foods found for this category.';
    }
    return '';
  }, [selectedCategory, categoryData.data.length, loading]);

  // Category management
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Utility functions with better performance
  const getFoodsForCategory = useCallback((category) => {
    const { data } = getCategoryFoods(category);
    return data;
  }, [getCategoryFoods]);

  const isCategoryEmpty = useCallback((category) => {
    const { data, loaded } = getCategoryFoods(category);
    return loaded && data.length === 0;
  }, [getCategoryFoods]);

  const isCategoryAvailable = useCallback((category) => {
    const { loaded } = getCategoryFoods(category);
    return loaded;
  }, [getCategoryFoods]);

  // Optimized category statistics
  const getCategoryStats = useMemo(() => {
    const stats = {};
    
    if (!contextLoading) {
      if (Array.isArray(frequentFoods)) stats.Frequent = frequentFoods.length;
      if (Array.isArray(recentMeals)) stats.Recent = recentMeals.length;
      if (Array.isArray(favoriteFoods)) stats.Favorites = favoriteFoods.length;
    }

    return stats;
  }, [frequentFoods, recentMeals, favoriteFoods, contextLoading]);

  return {
    // Core functions
    getCategoryFoods,
    getCategoryLoadingState,
    
    // Selected category state
    selectedCategory,
    setSelectedCategory,
    handleCategoryChange,
    
    // Current category data
    categoryFoods: categoryData.data,
    loading,
    isDataReady: categoryData.loaded,
    message,
    
    // Utility functions
    getFoodsForCategory,
    isCategoryEmpty,
    isCategoryAvailable,
    getCategoryStats,
    
    // Direct data access (for compatibility)
    frequentFoods: frequentFoods || [],
    recentMeals: recentMeals || [],
    favoriteFoods: favoriteFoods || [],
    
    // Individual loading states
    frequentFoodsLoaded: !contextLoading && Array.isArray(frequentFoods),
    recentMealsLoaded: !contextLoading && Array.isArray(recentMeals),
    favoriteFoodsLoaded: !contextLoading && Array.isArray(favoriteFoods),
    
    // Global state
    dataReady: !contextLoading,
  };
};

export default useFoodCategories;
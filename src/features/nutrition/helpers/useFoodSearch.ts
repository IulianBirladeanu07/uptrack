import { useState, useCallback, useRef, useEffect } from 'react';
import {
  clearFoodCatalogQueryCache,
  fetchNonBarcodedProducts,
} from '../handlers/NutritionHandler';
import { RequestTracker } from '../utils/requestTracker';
import type { FoodSearchItem, FoodSuggestion } from '../../../shared/types';

export const useFoodSearch = () => {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestTracker = useRef(new RequestTracker());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);
  
  const performSearch = useCallback(async (query?: string | null) => {
    const requestId = requestTracker.current.begin();
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    const trimmedQuery = query.trim();

    setSearchError(null);
    setLoading(true);

    try {
      const results = await fetchNonBarcodedProducts(
        [],
        null,
        30,
        null,
        trimmedQuery
      );

      const processedResults: FoodSearchItem[] = results.map(food => ({
        id: food.id,
        productName: food.product_name_en || food.product_name_ro || 'Unknown',
        productNameEn: food.product_name_en,
        productNameRo: food.product_name_ro,
        category: food.category || 'uncategorized',

        calories: food.calories || 0,
        protein: food.protein || 0,
        carbohydrates: food.carbohydrates || 0,
        fats: food.fats || 0,
        fiber: food.fiber || 0,
        sugar: food.sugar || 0,
        salt: food.salt || 0,
        saturatedFats: food.saturated_fats || 0,
        
        image: food.image,
        lastUpdated: food.last_updated ?? new Date().toISOString(),
        servingSize: {
          unit: food.serving_size_unit ?? 'g',
          value: food.serving_size_value ?? 100,
        },
        
        relevanceScore: food.similarity_score || 0,
        matchType: food.match_type || 'contains'
      }));

      if (requestTracker.current.isCurrent(requestId) && mountedRef.current) {
        setSearchResults(processedResults);
      }

    } catch (error) {
      console.error('Search failed:', error);
      if (requestTracker.current.isCurrent(requestId) && mountedRef.current) {
        setSearchResults([]);
        setSearchError('Unable to search foods. Check your connection and try again.');
      }
    } finally {
      if (requestTracker.current.isCurrent(requestId) && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const setSearchQuery = useCallback((text?: string | null) => {
    const value = text || '';
    setSearchQueryState(value);
    requestTracker.current.invalidate();
    setSearchResults([]);
    setSearchError(null);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleSearch = useCallback((query?: string | null) => {
    const value = query || '';
    setSearchQueryState(value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    performSearch(value);
  }, [performSearch]);

  const getSuggestions = useCallback(async (partialQuery?: string | null): Promise<FoodSuggestion[]> => {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return [];
    }

    try {
      const results = await fetchNonBarcodedProducts(
        [], null, 8, null, partialQuery.trim()
      );

      const suggestions: FoodSuggestion[] = results.map(food => ({
        id: food.id,
        productName: food.product_name_en || food.product_name_ro,
        category: food.category,
        calories: food.calories || 0
      }));

      return suggestions;
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setSearchResults([]);
    setSearchError(null);
    setLoading(false);
    requestTracker.current.invalidate();
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    searchError,
    
    handleSearch,
    getSuggestions,
    clearSearch,
    
    resultsCount: searchResults.length,
    resetCache: clearFoodCatalogQueryCache,
  };
};
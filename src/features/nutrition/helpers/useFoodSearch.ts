import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  clearFoodCatalogQueryCache,
  fetchNonBarcodedProducts,
  loadNonBarcodedProducts,
  nonBarcodedProductsQueryKey,
} from '../handlers/NutritionHandler';
import type { FoodSearchItem, FoodSuggestion } from '../../../shared/types';

const toFoodSearchItem = (food: Awaited<ReturnType<typeof loadNonBarcodedProducts>>[number]): FoodSearchItem => ({
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
  matchType: food.match_type || 'contains',
});

export const useFoodSearch = () => {
  const [searchQuery, setSearchQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  }, []);
  const normalizedQuery = debouncedQuery.trim();
  const hasSearch = normalizedQuery.length >= 2;
  const search = useQuery({
    queryKey: nonBarcodedProductsQueryKey([], null, 30, null, hasSearch ? normalizedQuery : null),
    queryFn: () => loadNonBarcodedProducts([], null, 30, null, normalizedQuery),
    enabled: hasSearch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  const currentQuery = searchQuery.trim();
  const waitingForDebounce = currentQuery.length >= 2 && currentQuery !== normalizedQuery;
  const searchResults = waitingForDebounce ? [] : (search.data ?? []).map(toFoodSearchItem);
  const searchError = waitingForDebounce || !search.error
    ? null
    : 'Unable to search foods. Check your connection and try again.';
  const loading = currentQuery.length >= 2 && (waitingForDebounce || search.isFetching);

  const setSearchQuery = useCallback((text?: string | null) => {
    const value = text || '';
    setSearchQueryState(value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (value.trim().length < 2) {
      setDebouncedQuery('');
      return;
    }
    debounceTimeout.current = setTimeout(() => setDebouncedQuery(value.trim()), 300);
  }, []);

  const handleSearch = useCallback((query?: string | null) => {
    const value = query || '';
    setSearchQueryState(value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    setDebouncedQuery(value.trim());
  }, []);

  const getSuggestions = useCallback(async (partialQuery?: string | null): Promise<FoodSuggestion[]> => {
    if (!partialQuery || partialQuery.trim().length < 2) return [];
    try {
      const results = await fetchNonBarcodedProducts([], null, 8, null, partialQuery.trim());
      return results.map(food => ({
        id: food.id,
        productName: food.product_name_en || food.product_name_ro,
        category: food.category,
        calories: food.calories || 0,
      }));
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setDebouncedQuery('');
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
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

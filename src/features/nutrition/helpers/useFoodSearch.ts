import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchNonBarcodedProducts } from '../handlers/NutritionHandler';
import { RequestTracker } from '../utils/requestTracker';
import type { FoodSearchItem, FoodSuggestion } from '../../../shared/types';

type CacheEntry = {
  data: FoodSearchItem[] | FoodSuggestion[];
  timestamp: number;
};

export const useFoodSearch = () => {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCache = useRef(new Map<string, CacheEntry>());
  const requestTracker = useRef(new RequestTracker());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);
  
  const getCachedResult = useCallback(<T extends CacheEntry['data']>(key: string): T | null => {
    const cached = searchCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.data as T;
    }
    if (cached) searchCache.current.delete(key);
    return null;
  }, []);

  const setCachedResult = useCallback((key: string, data: CacheEntry['data']) => {
    if (searchCache.current.size > 20) {
      const firstKey = searchCache.current.keys().next().value;
      if (firstKey !== undefined) searchCache.current.delete(firstKey);
    }
    
    searchCache.current.set(key, {
      data,
      timestamp: Date.now()
    });
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
    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;

    setSearchError(null);
    const cached = getCachedResult<FoodSearchItem[]>(cacheKey);
    if (cached) {
      if (mountedRef.current && requestTracker.current.isCurrent(requestId)) {
        setSearchResults(cached);
        setLoading(false);
      }
      return;
    }

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

      setCachedResult(cacheKey, processedResults);
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
  }, [getCachedResult, setCachedResult]);

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

    const cacheKey = `suggestions_${partialQuery.toLowerCase()}`;
    const cached = getCachedResult<FoodSuggestion[]>(cacheKey);
    if (cached) return cached;

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

      setCachedResult(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }, [getCachedResult, setCachedResult]);

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
    resetCache: () => searchCache.current.clear(),
  };
};
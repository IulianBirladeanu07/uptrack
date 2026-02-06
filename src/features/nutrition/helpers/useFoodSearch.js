import { useState, useCallback, useRef } from 'react';
import { fetchNonBarcodedProducts } from '../handlers/NutritionHandler';

export const useFoodSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceTimeout = useRef(null);
  const searchCache = useRef(new Map());
  
  const getCachedResult = useCallback((key) => {
    const cached = searchCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.data;
    }
    if (cached) searchCache.current.delete(key);
    return null;
  }, []);

  const setCachedResult = useCallback((key, data) => {
    if (searchCache.current.size > 20) {
      const firstKey = searchCache.current.keys().next().value;
      searchCache.current.delete(firstKey);
    }
    
    searchCache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const trimmedQuery = query.trim();
    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;
    
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setSearchResults(cached);
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

      const processedResults = results.map(food => ({
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
        saturatedFat: food.saturated_fats || 0,
        
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
      setSearchResults(processedResults);

    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [getCachedResult, setCachedResult]);

  const debouncedSearch = useCallback((query) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query || '');
    
    if (query && query.trim().length >= 2) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const getSuggestions = useCallback(async (partialQuery) => {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return [];
    }

    const cacheKey = `suggestions_${partialQuery.toLowerCase()}`;
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const results = await fetchNonBarcodedProducts(
        [], null, 8, null, partialQuery.trim()
      );

      const suggestions = results.map(food => ({
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
    setSearchQuery('');
    setSearchResults([]);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    
    handleSearch,
    getSuggestions,
    clearSearch,
    
    resultsCount: searchResults.length,
    resetCache: () => searchCache.current.clear(),
  };
};
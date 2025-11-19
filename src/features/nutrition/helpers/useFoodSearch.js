// ===== hooks/useFoodSearch.js =====
import { useState, useCallback, useRef } from 'react';
import { fetchNonBarcodedProducts } from '../handlers/NutritionHandler';

export const useFoodSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceTimeout = useRef(null);
  const searchCache = useRef(new Map());
  
  // Simple cache with 1-hour TTL
  const getCachedResult = useCallback((key) => {
    const cached = searchCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.data;
    }
    if (cached) searchCache.current.delete(key);
    return null;
  }, []);

  const setCachedResult = useCallback((key, data) => {
    // Keep cache reasonable size
    if (searchCache.current.size > 20) {
      const firstKey = searchCache.current.keys().next().value;
      searchCache.current.delete(firstKey);
    }
    
    searchCache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  // Core search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const trimmedQuery = query.trim();
    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;
    
    // Check cache first
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setSearchResults(cached);
      return;
    }

    setLoading(true);

    try {
      const results = await fetchNonBarcodedProducts(
        [], // no filters
        null, // no order
        30, // limit
        null, // no pagination
        trimmedQuery
      );

      // Process results for the app
      const processedResults = results.map(food => ({
        id: food.id,
        productName: food.product_name_en || food.product_name_ro || 'Unknown',
        productNameEn: food.product_name_en,
        productNameRo: food.product_name_ro,
        category: food.category || 'uncategorized',
        
        // Nutrition data
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbohydrates: food.carbohydrates || 0,
        fats: food.fats || 0,
        fiber: food.fiber || 0,
        sugar: food.sugar || 0,
        salt: food.salt || 0,
        saturatedFat: food.saturated_fats || 0,
        
        // Additional info
        image: food.image,
        lastUpdated: food.last_updated ?? new Date().toISOString(),
        servingSize: {
          unit: food.serving_size_unit ?? 'g',
          value: food.serving_size_value ?? 100,
        },
        
        // Search metadata (if available)
        relevanceScore: food.similarity_score || 0,
        matchType: food.match_type || 'contains'
      }));

      // Cache results
      setCachedResult(cacheKey, processedResults);
      setSearchResults(processedResults);

    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [getCachedResult, setCachedResult]);

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  // Main search handler
  const handleSearch = useCallback((query) => {
    setSearchQuery(query || '');
    
    if (query && query.trim().length >= 2) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  // Quick suggestions for autocomplete
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
    // Core state
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    
    // Actions
    handleSearch,
    getSuggestions,
    clearSearch,
    
    // Utilities
    resultsCount: searchResults.length,
    resetCache: () => searchCache.current.clear(),
  };
};
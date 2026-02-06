import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@food_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentSearches = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter(item => item && typeof item === 'string'));
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRecentSearches = useCallback(async (searches) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }, []);

  const addRecentSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') return;
    
    const cleanedTerm = searchTerm.trim();
    if (cleanedTerm.length < 2) return;

    try {
      setRecentSearches(prevSearches => {
        const filteredSearches = prevSearches.filter(
          term => term.toLowerCase() !== cleanedTerm.toLowerCase()
        );
        
        const updatedSearches = [cleanedTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
        saveRecentSearches(updatedSearches);
        
        return updatedSearches;
      });
    } catch (error) {
      console.error('Error adding recent search:', error);
    }
  }, [saveRecentSearches]);

  const removeRecentSearch = useCallback(async (searchTerm) => {
    try {
      setRecentSearches(prevSearches => {
        const updatedSearches = prevSearches.filter(
          term => term.toLowerCase() !== searchTerm.toLowerCase()
        );
        
        saveRecentSearches(updatedSearches);        
        return updatedSearches;
      });
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  }, [saveRecentSearches]);

  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  const getRecentSearch = useCallback((index) => {
    return recentSearches[index] || null;
  }, [recentSearches]);

  const hasRecentSearch = useCallback((searchTerm) => {
    return recentSearches.some(
      term => term.toLowerCase() === searchTerm.toLowerCase()
    );
  }, [recentSearches]);

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  return {
    recentSearches,
    loading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getRecentSearch,
    hasRecentSearch,
    refreshRecentSearches: loadRecentSearches,
    isEmpty: recentSearches.length === 0,
    count: recentSearches.length,
  };
};
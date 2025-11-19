import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@food_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recent searches from AsyncStorage on component mount
  const loadRecentSearches = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure it's an array and has valid entries
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

  // Save recent searches to AsyncStorage
  const saveRecentSearches = useCallback(async (searches) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }, []);

  // Add a new search term to recent searches
  const addRecentSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') return;
    
    // Clean and normalize the search term
    const cleanedTerm = searchTerm.trim();
    if (cleanedTerm.length < 2) return; // Don't save searches shorter than 2 characters

    try {
      setRecentSearches(prevSearches => {
        // Remove the term if it already exists (to avoid duplicates)
        const filteredSearches = prevSearches.filter(
          term => term.toLowerCase() !== cleanedTerm.toLowerCase()
        );
        
        // Add the new term at the beginning and limit to MAX_RECENT_SEARCHES
        const updatedSearches = [cleanedTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
        
        // Save to AsyncStorage asynchronously
        saveRecentSearches(updatedSearches);
        
        return updatedSearches;
      });
    } catch (error) {
      console.error('Error adding recent search:', error);
    }
  }, [saveRecentSearches]);

  // Remove a specific search term
  const removeRecentSearch = useCallback(async (searchTerm) => {
    try {
      setRecentSearches(prevSearches => {
        const updatedSearches = prevSearches.filter(
          term => term.toLowerCase() !== searchTerm.toLowerCase()
        );
        
        // Save to AsyncStorage asynchronously
        saveRecentSearches(updatedSearches);
        
        return updatedSearches;
      });
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  }, [saveRecentSearches]);

  // Clear all recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  // Get a specific recent search by index
  const getRecentSearch = useCallback((index) => {
    return recentSearches[index] || null;
  }, [recentSearches]);

  // Check if a search term exists in recent searches
  const hasRecentSearch = useCallback((searchTerm) => {
    return recentSearches.some(
      term => term.toLowerCase() === searchTerm.toLowerCase()
    );
  }, [recentSearches]);

  // Load recent searches on hook initialization
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
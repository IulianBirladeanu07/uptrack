// hooks/useWeight.js

import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import WeightService from '../helpers/weightService';

/**
 * Custom hook for managing weight data throughout the app
 * Provides reactive weight data and methods for weight operations
 */
export const useWeight = (selectedDate = new Date()) => {
  const [weightData, setWeightData] = useState({
    currentWeight: null,
    weeklyAverage: null,
    lastWeekAverage: null,
    weeklyTrend: null,
    weighInCount: 0,
    loading: true,
    error: null,
  });

  const [userId, setUserId] = useState(null);

  // Get user ID
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    } else {
      setWeightData(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
    }
  }, []);

  // Load weight data when userId or selectedDate changes
  useEffect(() => {
    if (userId) {
      loadWeightData();
    }
  }, [userId, selectedDate]);

  const loadWeightData = useCallback(async () => {
    if (!userId) return;

    try {
      setWeightData(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await WeightService.getWeightDisplayData(userId, selectedDate);
      
      setWeightData({
        ...data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading weight data:', error);
      setWeightData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load weight data',
      }));
    }
  }, [userId, selectedDate]);

  const saveWeight = useCallback(async (weight, date = selectedDate) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await WeightService.saveWeightEntry(userId, date, weight);
      
      if (result.success) {
        // Update local state
        setWeightData(prev => ({
          ...prev,
          currentWeight: weight,
          weeklyAverage: result.currentWeekAverage,
          weeklyTrend: result.weeklyTrend,
          weighInCount: prev.weighInCount + (prev.currentWeight ? 0 : 1),
        }));

        return result;
      }
    } catch (error) {
      console.error('Error saving weight:', error);
      throw error;
    }
  }, [userId, selectedDate]);

  const getWeightForDate = useCallback(async (date) => {
    if (!userId) return null;

    try {
      return await WeightService.getWeightForDate(userId, date);
    } catch (error) {
      console.error('Error getting weight for date:', error);
      return null;
    }
  }, [userId]);

  const getCurrentWeekData = useCallback(async (date = selectedDate) => {
    if (!userId) return null;

    try {
      return await WeightService.getCurrentWeekData(userId, date);
    } catch (error) {
      console.error('Error getting current week data:', error);
      return null;
    }
  }, [userId, selectedDate]);

  const getWeightHistory = useCallback(async (weeks = 12) => {
    if (!userId) return [];

    try {
      return await WeightService.getWeightHistory(userId, weeks);
    } catch (error) {
      console.error('Error getting weight history:', error);
      return [];
    }
  }, [userId]);

  const getWeightTrend = useCallback(async (date = selectedDate) => {
    if (!userId) return { trend: null, lastWeekAverage: null, currentWeekAverage: null };

    try {
      return await WeightService.getWeightTrend(userId, date);
    } catch (error) {
      console.error('Error getting weight trend:', error);
      return { trend: null, lastWeekAverage: null, currentWeekAverage: null };
    }
  }, [userId, selectedDate]);

  const adjustUserTargets = useCallback(async () => {
    if (!userId) return null;

    try {
      return await WeightService.adjustUserTargetsBasedOnProgress(userId);
    } catch (error) {
      console.error('Error adjusting user targets:', error);
      return null;
    }
  }, [userId]);

  const refreshWeightData = useCallback(() => {
    loadWeightData();
  }, [loadWeightData]);

  // Helper methods for UI display
  const formatWeightDisplay = useCallback(() => {
    const { currentWeight, weeklyAverage, weeklyTrend, weighInCount } = weightData;
    
    if (currentWeight) {
      return {
        main: `${currentWeight} kg`,
        sub: weeklyTrend !== null 
          ? `${weeklyTrend > 0 ? '+' : ''}${weeklyTrend.toFixed(1)} kg vs last week`
          : weeklyAverage 
            ? `Avg: ${weeklyAverage} kg (${weighInCount} weigh-ins)`
            : 'Today\'s weight',
        hasWeight: true,
      };
    } else if (weeklyAverage) {
      return {
        main: `${weeklyAverage} kg`,
        sub: weeklyTrend !== null 
          ? `${weeklyTrend > 0 ? '+' : ''}${weeklyTrend.toFixed(1)} kg vs last week`
          : `Weekly avg (${weighInCount} weigh-ins)`,
        hasWeight: true,
      };
    } else {
      return {
        main: 'Tap to weigh',
        sub: 'Track your progress',
        hasWeight: false,
      };
    }
  }, [weightData]);

  const getTrendColor = useCallback(() => {
    if (weightData.weeklyTrend === null) return '#9CA3AF';
    return weightData.weeklyTrend > 0 ? '#10B981' : weightData.weeklyTrend < 0 ? '#EF4444' : '#9CA3AF';
  }, [weightData.weeklyTrend]);

  const getTrendIcon = useCallback(() => {
    if (weightData.weeklyTrend === null) return 'trending-neutral';
    return weightData.weeklyTrend > 0 ? 'trending-up' : weightData.weeklyTrend < 0 ? 'trending-down' : 'trending-neutral';
  }, [weightData.weeklyTrend]);

  return {
    // State
    ...weightData,
    userId,
    
    // Methods
    saveWeight,
    loadWeightData,
    refreshWeightData,
    getWeightForDate,
    getCurrentWeekData,
    getWeightHistory,
    getWeightTrend,
    adjustUserTargets,
    
    // UI Helpers
    formatWeightDisplay,
    getTrendColor,
    getTrendIcon,
  };
};

export default useWeight;
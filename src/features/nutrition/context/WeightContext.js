import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Weight data structure
// {
//   date: 'YYYY-MM-DD',
//   weight: number,
//   timestamp: ISO string,
//   note?: string
// }

const WEIGHT_STORAGE_KEY = '@weight_data';

const initialState = {
  weights: [], // Array of weight entries
  loading: false,
  error: null,
  lastSync: null,
};

const weightReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_WEIGHTS':
      return { ...state, weights: action.payload, loading: false, error: null };
    
    case 'ADD_WEIGHT':
      const newWeights = [...state.weights];
      const existingIndex = newWeights.findIndex(w => w.date === action.payload.date);
      
      if (existingIndex >= 0) {
        newWeights[existingIndex] = action.payload;
      } else {
        newWeights.push(action.payload);
      }
      
      return { 
        ...state, 
        weights: newWeights.sort((a, b) => new Date(b.date) - new Date(a.date)),
        loading: false,
        error: null
      };
    
    case 'DELETE_WEIGHT':
      return {
        ...state,
        weights: state.weights.filter(w => w.date !== action.payload),
        loading: false,
        error: null
      };
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    
    default:
      return state;
  }
};

const WeightContext = createContext();

export const WeightProvider = ({ children }) => {
  const [state, dispatch] = useReducer(weightReducer, initialState);

  // Load weights from storage on mount
  useEffect(() => {
    loadWeights();
  }, []);

  // Save weights to storage whenever weights change
  useEffect(() => {
    if (state.weights.length > 0) {
      saveWeights();
    }
  }, [state.weights]);

  const loadWeights = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const stored = await AsyncStorage.getItem(WEIGHT_STORAGE_KEY);
      if (stored) {
        const weights = JSON.parse(stored);
        dispatch({ type: 'SET_WEIGHTS', payload: weights });
      } else {
        dispatch({ type: 'SET_WEIGHTS', payload: [] });
      }
    } catch (error) {
      console.error('Failed to load weights:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load weight data' });
    }
  }, []);

  const saveWeights = useCallback(async () => {
    try {
      await AsyncStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(state.weights));
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to save weights:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save weight data' });
    }
  }, [state.weights]);

  const addWeight = useCallback(async (weight, date, note = '') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const weightEntry = {
        date: dateStr,
        weight: parseFloat(weight),
        timestamp: new Date().toISOString(),
        note: note.trim()
      };

      dispatch({ type: 'ADD_WEIGHT', payload: weightEntry });
      return weightEntry;
    } catch (error) {
      console.error('Failed to add weight:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add weight' });
      throw error;
    }
  }, []);

  const deleteWeight = useCallback(async (date) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      dispatch({ type: 'DELETE_WEIGHT', payload: dateStr });
    } catch (error) {
      console.error('Failed to delete weight:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete weight' });
      throw error;
    }
  }, []);

  const getWeightForDate = useCallback((date) => {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return state.weights.find(w => w.date === dateStr);
  }, [state.weights]);

  const getTodaysWeight = useCallback((date) => {
    const weightEntry = getWeightForDate(date);
    return weightEntry ? weightEntry.weight : null;
  }, [getWeightForDate]);

  const hasWeightForDate = useCallback((date) => {
    return getWeightForDate(date) !== undefined;
  }, [getWeightForDate]);

  const getWeeklyAverage = useCallback((centerDate) => {
    const centerDateObj = centerDate instanceof Date ? centerDate : new Date(centerDate);
    const weekStart = new Date(centerDateObj);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const relevantWeights = state.weights.filter(w => {
      const weightDate = new Date(w.date);
      return weightDate >= weekStart && weightDate <= centerDateObj;
    });

    if (relevantWeights.length === 0) {
      // If no weights in the past week, get the most recent weight
      return state.weights.length > 0 ? state.weights[0].weight : null;
    }

    const sum = relevantWeights.reduce((acc, w) => acc + w.weight, 0);
    return sum / relevantWeights.length;
  }, [state.weights]);

  const getWeightTrend = useCallback((date) => {
    const currentWeight = getTodaysWeight(date);
    const weeklyAverage = getWeeklyAverage(date);
    
    if (!currentWeight || !weeklyAverage) return 0;
    
    return currentWeight - weeklyAverage;
  }, [getTodaysWeight, getWeeklyAverage]);

  const getWeightHistory = useCallback((days = 30) => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    return state.weights.filter(w => {
      const weightDate = new Date(w.date);
      return weightDate >= startDate && weightDate <= endDate;
    });
  }, [state.weights]);

  const getWeightStats = useCallback(() => {
    if (state.weights.length === 0) {
      return {
        current: null,
        highest: null,
        lowest: null,
        average: null,
        totalEntries: 0,
        trend: 0
      };
    }

    const weights = state.weights.map(w => w.weight);
    const current = weights[0]; // Most recent (sorted)
    const highest = Math.max(...weights);
    const lowest = Math.min(...weights);
    const average = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    
    // Calculate trend over last 7 days vs previous 7 days
    const last7Days = state.weights.slice(0, 7);
    const previous7Days = state.weights.slice(7, 14);
    
    let trend = 0;
    if (last7Days.length > 0 && previous7Days.length > 0) {
      const recentAvg = last7Days.reduce((sum, w) => sum + w.weight, 0) / last7Days.length;
      const previousAvg = previous7Days.reduce((sum, w) => sum + w.weight, 0) / previous7Days.length;
      trend = recentAvg - previousAvg;
    }

    return {
      current,
      highest,
      lowest,
      average,
      totalEntries: state.weights.length,
      trend
    };
  }, [state.weights]);

  const value = {
    ...state,
    addWeight,
    deleteWeight,
    getWeightForDate,
    getTodaysWeight,
    hasWeightForDate,
    getWeeklyAverage,
    getWeightTrend,
    getWeightHistory,
    getWeightStats,
    loadWeights,
  };

  return (
    <WeightContext.Provider value={value}>
      {children}
    </WeightContext.Provider>
  );
};

export const useWeightContext = () => {
  const context = useContext(WeightContext);
  if (!context) {
    throw new Error('useWeightContext must be used within a WeightProvider');
  }
  return context;
};

export default WeightContext;
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SPLITS_CACHE_KEY = 'cached_splits';

export const clearSplitsCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SPLITS_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear workout splits cache:', error);
  }
};

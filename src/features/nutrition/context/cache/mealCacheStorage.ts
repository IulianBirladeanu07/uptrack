import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoggedFood, MealGroup, MealType } from '../../../../shared/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_CACHE_TTL = 30 * 60 * 1000;
const MEAL_CACHE_KEY_PREFIX = 'meal_cache_v2_';

const getMealCacheKey = (uid: string): string => `${MEAL_CACHE_KEY_PREFIX}${uid}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isLoggedFood = (value: unknown): value is LoggedFood =>
  isRecord(value) && typeof value['id'] === 'string';

const isMealGroup = (value: unknown): value is MealGroup =>
  isRecord(value) &&
  typeof value['date'] === 'string' &&
  MEAL_TYPES.includes(value['mealType'] as MealType) &&
  Array.isArray(value['foods']) &&
  value['foods'].every(isLoggedFood);

export const parsePersistedMealCache = (
  raw: string,
  now = Date.now(),
): MealGroup[] | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed['meals']) || !parsed['meals'].every(isMealGroup)) return null;
  const timestamp = parsed['ts'];
  if (
    typeof timestamp !== 'number' ||
    !Number.isFinite(timestamp) ||
    timestamp > now ||
    now - timestamp > MEAL_CACHE_TTL
  ) return null;
  return parsed['meals'];
};

export const persistMealCache = async (uid: string, meals: MealGroup[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      getMealCacheKey(uid),
      JSON.stringify({ meals, ts: Date.now() }),
    );
  } catch (error) {
    console.error('[FoodContext] meal cache persist failed:', error);
  }
};

export const loadPersistedMealCache = async (uid: string): Promise<MealGroup[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(getMealCacheKey(uid));
    if (!raw) return null;
    return parsePersistedMealCache(raw);
  } catch (error) {
    console.error('[FoodContext] meal cache load failed:', error);
    return null;
  }
};

export const clearPersistedMealCache = async (uid: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getMealCacheKey(uid));
  } catch (error) {
    console.error('[FoodContext] meal cache clear failed:', error);
  }
};

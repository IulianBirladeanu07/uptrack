import type { LoggedFood, MealGroup, MealType } from '../../../../shared/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const MEAL_CACHE_TTL = 30 * 60 * 1000;

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

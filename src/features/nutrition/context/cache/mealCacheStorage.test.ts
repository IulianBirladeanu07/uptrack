import { MEAL_CACHE_TTL, parsePersistedMealCache } from './mealCacheStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearPersistedMealCache,
  loadPersistedMealCache,
  persistMealCache,
} from './mealCacheStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const meal = {
  date: '2026-10-15',
  mealType: 'breakfast',
  foods: [{ id: 'food-1', calories: 200 }],
};

describe('parsePersistedMealCache', () => {
  it('accepts a fresh cache with the expected meal shape', () => {
    expect(parsePersistedMealCache(JSON.stringify({ meals: [meal], ts: 1000 }), 2000)).toEqual([meal]);
  });

  it('rejects malformed JSON, malformed meal groups, and expired caches', () => {
    expect(parsePersistedMealCache('{')).toBeNull();
    expect(parsePersistedMealCache(JSON.stringify({ meals: [{}], ts: 1000 }), 2000)).toBeNull();
    expect(parsePersistedMealCache(JSON.stringify({ meals: [meal], ts: 1000 }), 1000 + MEAL_CACHE_TTL + 1)).toBeNull();
    expect(parsePersistedMealCache(JSON.stringify({ meals: [meal], ts: 2001 }), 2000)).toBeNull();
  });
});

describe('persisted meal cache storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists meal groups under the uid-specific versioned key', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234);
    await persistMealCache('user-1', [meal]);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'meal_cache_v2_user-1',
      JSON.stringify({ meals: [meal], ts: 1234 }),
    );
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('loads and validates the uid-specific cache', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ meals: [meal], ts: Date.now() }),
    );

    await expect(loadPersistedMealCache('user-1')).resolves.toEqual([meal]);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('meal_cache_v2_user-1');
  });

  it('clears only the specified user cache', async () => {
    await clearPersistedMealCache('user-2');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('meal_cache_v2_user-2');
  });

  it('returns null and logs when reading the persisted cache fails', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

    await expect(loadPersistedMealCache('user-1')).resolves.toBeNull();
    expect(consoleError).toHaveBeenCalledWith('[FoodContext] meal cache load failed:', error);
    consoleError.mockRestore();
  });

  it('logs persistence failures without throwing', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(error);

    await expect(persistMealCache('user-1', [meal])).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[FoodContext] meal cache persist failed:', error);
    consoleError.mockRestore();
  });

  it('logs clear failures without throwing', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(error);

    await expect(clearPersistedMealCache('user-1')).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[FoodContext] meal cache clear failed:', error);
    consoleError.mockRestore();
  });
});

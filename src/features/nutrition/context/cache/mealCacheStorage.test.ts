import { MEAL_CACHE_TTL, parsePersistedMealCache } from './mealCacheStorage';

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

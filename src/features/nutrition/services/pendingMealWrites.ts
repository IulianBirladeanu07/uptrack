import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoggedFood, MealGroup, MealType } from '../../../shared/types';
import { AsyncOperationQueue } from '../context/AsyncOperationQueue';
import { SAVE_TIMEOUT_MS, withTimeout } from '../../../shared/utils/withTimeout';
import { writeMealType } from './mealService';

export type PendingMealWrite = {
  id: string;
  date: string;
  mealType: MealType;
  foods: LoggedFood[];
};

const KEY_PREFIX = 'pending_meal_writes_v1_';
const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
const storageQueue = new AsyncOperationQueue();
const flushes = new Map<string, Promise<void>>();
const activeWrites = new Map<string, Promise<void>>();
let sequence = 0;

const storageKey = (uid: string) => `${KEY_PREFIX}${uid}`;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isFoods = (value: unknown): value is LoggedFood[] =>
  Array.isArray(value) && value.every(food => isRecord(food) && typeof food['id'] === 'string');
const isPendingWrite = (value: unknown): value is PendingMealWrite =>
  isRecord(value) && typeof value['id'] === 'string' && typeof value['date'] === 'string' &&
  mealTypes.includes(value['mealType'] as MealType) && isFoods(value['foods']);

export const loadPendingMealWrites = async (uid: string): Promise<PendingMealWrite[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingWrite) : [];
  } catch (error) {
    console.error('[FoodContext] pending meal writes load failed:', error);
    return [];
  }
};

const savePendingMealWrites = (uid: string, writes: PendingMealWrite[]) =>
  AsyncStorage.setItem(storageKey(uid), JSON.stringify(writes));

export const enqueuePendingMealWrite = async (
  uid: string,
  date: string,
  mealType: MealType,
  foods: LoggedFood[],
): Promise<PendingMealWrite[]> => storageQueue.run(uid, async () => {
  const writes = await loadPendingMealWrites(uid);
  const next = writes.filter(write => write.date !== date || write.mealType !== mealType);
  next.push({ id: `${Date.now()}-${sequence++}`, date, mealType, foods });
  await savePendingMealWrites(uid, next);
  return next;
});

export const removePendingMealWrite = async (uid: string, id: string): Promise<PendingMealWrite[]> =>
  storageQueue.run(uid, async () => {
    const next = (await loadPendingMealWrites(uid)).filter(write => write.id !== id);
    await savePendingMealWrites(uid, next);
    return next;
  });

export const overlayPendingMealWrites = (
  meals: MealGroup[],
  writes: PendingMealWrite[],
): MealGroup[] => {
  const byKey = new Map(meals.map(meal => [`${meal.date}:${meal.mealType}`, meal]));
  writes.forEach(write => byKey.set(`${write.date}:${write.mealType}`, {
    date: write.date,
    mealType: write.mealType,
    foods: write.foods,
  }));
  return [...byKey.values()];
};

const activeKey = (uid: string, write: PendingMealWrite) => `${uid}:${write.date}:${write.mealType}`;

const writeAndRemoveWhenAcknowledged = (uid: string, write: PendingMealWrite): Promise<void> => {
  const key = activeKey(uid, write);
  const active = activeWrites.get(key);
  if (active) return active;
  const request = writeMealType(uid, write.mealType, write.foods, write.date)
    .then(async () => { await removePendingMealWrite(uid, write.id); })
    .finally(() => {
      if (activeWrites.get(key) === request) activeWrites.delete(key);
    });
  activeWrites.set(key, request);
  return request;
};

export const flushPendingMealWrites = async (uid: string): Promise<PendingMealWrite[]> => {
  const existing = flushes.get(uid);
  if (existing) {
    await existing;
    return flushPendingMealWrites(uid);
  }
  const flush = (async () => {
    while (true) {
      const [write] = await loadPendingMealWrites(uid);
      if (!write) break;
      try {
        await withTimeout(writeAndRemoveWhenAcknowledged(uid, write), SAVE_TIMEOUT_MS);
      } catch {
        break;
      }
    }
  })();
  flushes.set(uid, flush);
  try {
    await flush;
  } finally {
    if (flushes.get(uid) === flush) flushes.delete(uid);
  }
  return loadPendingMealWrites(uid);
};

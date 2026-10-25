const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
  },
}));

jest.mock('./mealService', () => ({ writeMealType: jest.fn() }));

import { writeMealType } from './mealService';
import {
  enqueuePendingMealWrite,
  flushPendingMealWrites,
  loadPendingMealWrites,
  overlayPendingMealWrites,
} from './pendingMealWrites';
import type { LoggedFood } from '../../../shared/types';

const oats: LoggedFood = { id: 'oats', calories: 100 };

describe('pending meal writes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    (writeMealType as jest.Mock).mockResolvedValue(undefined);
  });

  it('persists the newest snapshot for a meal and overlays it over server data', async () => {
    await enqueuePendingMealWrite('user-1', '2026-10-24', 'breakfast', [oats]);
    const latest = [{ ...oats, calories: 200 }];
    const pending = await enqueuePendingMealWrite('user-1', '2026-10-24', 'breakfast', latest);
    const overlay = overlayPendingMealWrites([
      { date: '2026-10-24', mealType: 'breakfast', foods: [] },
    ], pending);

    expect(pending).toHaveLength(1);
    expect(overlay).toEqual([{ date: '2026-10-24', mealType: 'breakfast', foods: latest }]);
    expect(await loadPendingMealWrites('user-1')).toEqual(pending);
  });

  it('removes a queued snapshot after the Firestore write is acknowledged', async () => {
    await enqueuePendingMealWrite('user-1', '2026-10-24', 'lunch', [oats]);

    await expect(flushPendingMealWrites('user-1')).resolves.toEqual([]);

    expect(writeMealType).toHaveBeenCalledWith('user-1', 'lunch', [oats], '2026-10-24');
  });

  it('retains a queued snapshot after Firestore rejects it', async () => {
    const pending = await enqueuePendingMealWrite('user-1', '2026-10-24', 'dinner', [oats]);
    (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('offline'));

    await expect(flushPendingMealWrites('user-1')).resolves.toEqual(pending);
    expect(await loadPendingMealWrites('user-1')).toEqual(pending);
  });
});

jest.mock('../services/pendingMealWrites', () => ({
  enqueuePendingMealWrite: jest.fn(),
  flushPendingMealWrites: jest.fn(),
}));

import { enqueuePendingMealWrite, flushPendingMealWrites } from '../services/pendingMealWrites';
import type { LoggedFood } from '../../../shared/types';
import { persistOptimisticMealWrite } from './optimisticMealWrite';

const makeFood = (id: string): LoggedFood => ({ id, calories: 100 });

describe('persistOptimisticMealWrite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (enqueuePendingMealWrite as jest.Mock).mockResolvedValue([{ id: 'pending' }]);
    (flushPendingMealWrites as jest.Mock).mockResolvedValue([]);
  });

  it('persists a durable snapshot before attempting to flush it', async () => {
    const updateFoods = jest.fn();
    const persistCache = jest.fn();

    await expect(persistOptimisticMealWrite({
      uid: 'user-1',
      mealType: 'lunch',
      dateKey: '2026-10-17',
      nextFoods: [makeFood('new')],
      getCurrentFoods: () => [makeFood('new')],
      updateFoods,
      persistCache,
      isCurrentRequest: () => true,
      rollback: () => [],
    })).resolves.toBeUndefined();

    expect(enqueuePendingMealWrite).toHaveBeenCalledWith('user-1', '2026-10-17', 'lunch', [makeFood('new')]);
    expect(flushPendingMealWrites).toHaveBeenCalledWith('user-1');
    expect(updateFoods).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
  });

  it('rolls back when the durable queue cannot be persisted', async () => {
    const error = new Error('storage failed');
    (enqueuePendingMealWrite as jest.Mock).mockRejectedValueOnce(error);
    const updateFoods = jest.fn();
    const persistCache = jest.fn();
    const previousFoods = [makeFood('previous')];

    await expect(persistOptimisticMealWrite({
      uid: 'user-1',
      mealType: 'dinner',
      dateKey: '2026-10-17',
      nextFoods: [makeFood('optimistic')],
      getCurrentFoods: () => [makeFood('optimistic')],
      updateFoods,
      persistCache,
      isCurrentRequest: () => true,
      rollback: () => previousFoods,
    })).rejects.toBe(error);

    expect(updateFoods).toHaveBeenNthCalledWith(1, [makeFood('optimistic')]);
    expect(updateFoods).toHaveBeenNthCalledWith(2, previousFoods);
    expect(persistCache).toHaveBeenCalledTimes(2);
    expect(flushPendingMealWrites).not.toHaveBeenCalled();
  });

  it('keeps a durable optimistic write visible while the backend is unavailable', async () => {
    (flushPendingMealWrites as jest.Mock).mockResolvedValueOnce([{ id: 'pending' }]);
    const updateFoods = jest.fn();
    const persistCache = jest.fn();
    const rollback = jest.fn(() => []);
    const onPendingWritesChanged = jest.fn();

    await expect(persistOptimisticMealWrite({
      uid: 'user-1',
      mealType: 'snacks',
      dateKey: '2026-10-17',
      nextFoods: [makeFood('optimistic')],
      getCurrentFoods: () => [makeFood('optimistic')],
      updateFoods,
      persistCache,
      isCurrentRequest: () => false,
      rollback,
      onPendingWritesChanged,
    })).resolves.toBeUndefined();

    expect(updateFoods).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
    expect(onPendingWritesChanged).toHaveBeenLastCalledWith(1);
  });
});

jest.mock('../services/mealService', () => ({
  writeMealType: jest.fn(),
}));

import { writeMealType } from '../services/mealService';
import type { LoggedFood } from '../../../shared/types';
import { persistOptimisticMealWrite } from './optimisticMealWrite';

const makeFood = (id: string): LoggedFood => ({ id, calories: 100 });

describe('persistOptimisticMealWrite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps the optimistic result when the server write succeeds', async () => {
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

    expect(writeMealType).toHaveBeenCalledWith('user-1', 'lunch', [makeFood('new')], '2026-10-17');
    expect(updateFoods).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
  });

  it('rolls back and persists the restored foods after a current-user write failure', async () => {
    const error = new Error('write failed');
    (writeMealType as jest.Mock).mockRejectedValueOnce(error);
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
  });

  it('does not roll back state after the active user changes', async () => {
    (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('write failed'));
    const updateFoods = jest.fn();
    const persistCache = jest.fn();
    const rollback = jest.fn(() => []);

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
    })).rejects.toThrow('write failed');

    expect(updateFoods).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
  });

  it('allows an operation-specific rollback guard to skip stale item rollback', async () => {
    (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('write failed'));
    const updateFoods = jest.fn();
    const persistCache = jest.fn();
    const rollback = jest.fn(() => null);

    await expect(persistOptimisticMealWrite({
      uid: 'user-1',
      mealType: 'breakfast',
      dateKey: '2026-10-17',
      nextFoods: [makeFood('optimistic')],
      getCurrentFoods: () => [makeFood('optimistic')],
      updateFoods,
      persistCache,
      isCurrentRequest: () => true,
      rollback,
    })).rejects.toThrow('write failed');

    expect(rollback).toHaveBeenCalled();
    expect(updateFoods).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
  });
});

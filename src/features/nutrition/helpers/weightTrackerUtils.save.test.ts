jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock('react-native', () => ({ Animated: {} }));
jest.mock('../../../shared/firestore/converters', () => ({ userConverter: {} }));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('../helpers/learningCompletionService', () => ({
  evaluateWeeklyProgress: jest.fn(),
  snapshotPreviousWeek: jest.fn(),
  deriveStartWeight: jest.fn(),
  checkAndRunWeeklyEval: jest.fn(),
}));
jest.mock('../services/weightService', () => ({
  __esModule: true,
  default: { getUserWeightData: jest.fn(), setCachedUserData: jest.fn() },
}));

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { evaluateWeeklyProgress, snapshotPreviousWeek, deriveStartWeight } from '../helpers/learningCompletionService';
import WeightService from '../services/weightService';
import { handleSaveLogic, loadUserWeightData } from './weightTrackerUtils';
import type { MealCacheLike } from '../../../shared/types';

const userRef = { path: 'users/user-1' };
const mealCache = {} as MealCacheLike;
const NOW = new Date(2026, 9, 15, 12, 0, 0);

const storedUser = (data: Record<string, unknown> | null) => {
  (getDoc as jest.Mock).mockResolvedValue({
    exists: () => data !== null,
    data: () => data,
  });
  (WeightService.getUserWeightData as jest.Mock).mockResolvedValue(data as never);
};

const save = (
  weight: number,
  date: string | Date,
  cache: MealCacheLike | null = null,
) => {
  const setCurrentWeight = jest.fn();
  const setWeeklyAverage = jest.fn();
  const reload = jest.fn().mockResolvedValue(undefined);
  const result = handleSaveLogic('user-1', weight, date, setCurrentWeight, setWeeklyAverage, reload, cache);
  return { result, setCurrentWeight, setWeeklyAverage, reload };
};

const firstWrite = () => (setDoc as jest.Mock).mock.calls[0][1];

describe('handleSaveLogic persistence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (doc as jest.Mock).mockReturnValue({ withConverter: jest.fn(() => userRef) });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (deriveStartWeight as jest.Mock).mockReturnValue(85);
    (snapshotPreviousWeek as jest.Mock).mockResolvedValue(null);
    (evaluateWeeklyProgress as jest.Mock).mockResolvedValue(null);
    (WeightService.setCachedUserData as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('creates the current week, derives the average and trend, and merges the write into the user document', async () => {
    storedUser({
      startWeight: 85,
      lastSnapshotWeek: '2026-10-05',
      weightIns: [{ weekStart: '2026-10-05', days: { monday: 81, tuesday: 80 }, average: 80.5 }],
    });

    const { result, setCurrentWeight, setWeeklyAverage, reload } = save(79, '2026-10-15');
    await result;

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect((setDoc as jest.Mock).mock.calls[0][0]).toBe(userRef);
    expect((setDoc as jest.Mock).mock.calls[0][2]).toEqual({ merge: true });
    expect(firstWrite()).toEqual({
      weightIns: [
        { weekStart: '2026-10-05', days: { monday: 81, tuesday: 80 }, average: 80.5 },
        { weekStart: '2026-10-12', days: { thursday: 79 }, average: 79, createdAt: expect.any(String) },
      ],
      lastWeightUpdate: NOW.toISOString(),
      weeklyTrend: -1.5,
      currentWeight: 79,
    });
    expect(setCurrentWeight).toHaveBeenCalledWith(79);
    expect(setWeeklyAverage).toHaveBeenCalledWith(79);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps the other days of an existing week and replaces a re-logged day', async () => {
    storedUser({
      startWeight: 85,
      weightIns: [{ weekStart: '2026-10-12', days: { monday: 80, tuesday: 79, thursday: 90 }, average: 83 }],
    });

    const { result, setWeeklyAverage } = save(78, '2026-10-15');
    await result;

    expect(firstWrite().weightIns).toEqual([
      { weekStart: '2026-10-12', days: { monday: 80, tuesday: 79, thursday: 78 }, average: 79 },
    ]);
    expect(firstWrite().weeklyTrend).toBeNull();
    expect(setWeeklyAverage).toHaveBeenCalledWith(79);
  });

  it('does not overwrite the current weight when a day before the latest entry is backfilled', async () => {
    storedUser({
      startWeight: 85,
      currentWeight: 79,
      weightIns: [{ weekStart: '2026-10-12', days: { thursday: 79 }, average: 79 }],
    });

    const { result, setCurrentWeight, setWeeklyAverage } = save(80, '2026-10-13');
    await result;

    expect(firstWrite().weightIns[0].days).toEqual({ tuesday: 80, thursday: 79 });
    expect(firstWrite()).not.toHaveProperty('currentWeight');
    expect(setCurrentWeight).not.toHaveBeenCalled();
    expect(setWeeklyAverage).toHaveBeenCalledWith(79.5);
  });

  it('stores a derived start weight only when the profile has none', async () => {
    storedUser({ weightIns: [] });
    await save(79, '2026-10-15').result;
    expect(firstWrite().startWeight).toBe(85);

    (setDoc as jest.Mock).mockClear();
    storedUser({ startWeight: 90, weightIns: [] });
    await save(79, '2026-10-15').result;
    expect(firstWrite()).not.toHaveProperty('startWeight');
  });

  it('saves into a new user document when none exists yet', async () => {
    storedUser(null);

    await save(79, '2026-10-15').result;

    expect(firstWrite().weightIns).toEqual([
      { weekStart: '2026-10-12', days: { thursday: 79 }, average: 79, createdAt: expect.any(String) },
    ]);
    expect(firstWrite().currentWeight).toBe(79);
  });

  it.each([
    ['Sunday belongs to the week that started on the previous Monday', '2026-10-18', '2026-10-12', 'sunday'],
    ['Monday starts a new week', '2026-10-19', '2026-10-19', 'monday'],
    ['the week containing the US daylight-saving change', '2026-11-01', '2026-10-26', 'sunday'],
    ['the week containing the EU daylight-saving change', '2026-10-25', '2026-10-19', 'sunday'],
  ])('files %s', async (_label, date, weekStart, dayKey) => {
    storedUser({ startWeight: 85, weightIns: [] });

    await save(79, date).result;

    const [week] = firstWrite().weightIns;
    expect(week.weekStart).toBe(weekStart);
    expect(Object.keys(week.days)).toEqual([dayKey]);
  });

  it('reports failure and touches neither cache nor screen state when the write is rejected', async () => {
    storedUser({ startWeight: 85, weightIns: [] });
    const error = new Error('permission-denied');
    (setDoc as jest.Mock).mockRejectedValueOnce(error);

    const { result, setCurrentWeight, setWeeklyAverage, reload } = save(79, '2026-10-15', mealCache);

    await expect(result).rejects.toBe(error);
    expect(WeightService.setCachedUserData).not.toHaveBeenCalled();
    expect(setCurrentWeight).not.toHaveBeenCalled();
    expect(setWeeklyAverage).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(snapshotPreviousWeek).not.toHaveBeenCalled();
  });

  it('reports failure when the existing user document cannot be read, without writing', async () => {
    const error = new Error('unavailable');
    (getDoc as jest.Mock).mockRejectedValueOnce(error);

    await expect(save(79, '2026-10-15').result).rejects.toBe(error);

    expect(setDoc).not.toHaveBeenCalled();
  });

  describe('first weigh-in of a new week', () => {
    const previousWeek = { weekStart: '2026-10-05', days: { monday: 81 }, average: 81 };
    const snapshot = { weekStart: '2026-10-05', weeksSinceCutStart: 3 };

    beforeEach(() => {
      storedUser({ startWeight: 85, weightIns: [previousWeek] });
      (snapshotPreviousWeek as jest.Mock).mockResolvedValue(snapshot);
    });

    it('snapshots the previous week once, records it, evaluates progress, and caches the combined result', async () => {
      (evaluateWeeklyProgress as jest.Mock).mockResolvedValue({ dailyCalories: 2300 });

      const { result, reload } = save(80, '2026-10-15', mealCache);
      await result;

      expect(snapshotPreviousWeek).toHaveBeenCalledWith('user-1', previousWeek, mealCache, expect.objectContaining({
        weightIns: expect.arrayContaining([expect.objectContaining({ weekStart: '2026-10-12' })]),
      }));
      expect(setDoc).toHaveBeenCalledTimes(2);
      expect((setDoc as jest.Mock).mock.calls[1]).toEqual([userRef, { lastSnapshotWeek: '2026-10-05' }, { merge: true }]);
      expect(evaluateWeeklyProgress).toHaveBeenCalledTimes(1);
      expect((evaluateWeeklyProgress as jest.Mock).mock.calls[0][0]).toBe('user-1');
      expect(WeightService.setCachedUserData).toHaveBeenCalledWith('user-1', expect.objectContaining({
        weeklyNutrition: [snapshot],
        weeksSinceCutStart: 3,
        lastSnapshotWeek: '2026-10-05',
        dailyCalories: 2300,
        currentWeight: 80,
      }));
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does nothing weekly when the previous week was already snapshotted', async () => {
      storedUser({ startWeight: 85, lastSnapshotWeek: '2026-10-05', weightIns: [previousWeek] });

      await save(80, '2026-10-15', mealCache).result;

      expect(snapshotPreviousWeek).not.toHaveBeenCalled();
      expect(evaluateWeeklyProgress).not.toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('does nothing weekly without a meal cache or when editing a past week', async () => {
      await save(80, '2026-10-15', null).result;
      expect(snapshotPreviousWeek).not.toHaveBeenCalled();

      storedUser({
        startWeight: 85,
        weightIns: [
          { weekStart: '2026-09-28', days: { monday: 82 }, average: 82 },
          { weekStart: '2026-10-05', days: { monday: 81 }, average: 81 },
        ],
      });
      await save(80, '2026-10-06', mealCache).result;
      expect(snapshotPreviousWeek).not.toHaveBeenCalled();
      expect(evaluateWeeklyProgress).not.toHaveBeenCalled();
    });

    it('still reports the saved weight when the weekly snapshot fails after the write succeeded', async () => {
      (snapshotPreviousWeek as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));

      const { result, setCurrentWeight, reload } = save(80, '2026-10-15', mealCache);
      await result;

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(WeightService.setCachedUserData).toHaveBeenCalledWith('user-1', expect.objectContaining({ currentWeight: 80 }));
      expect(setCurrentWeight).toHaveBeenCalledWith(80);
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does not cache a snapshot marker that failed to persist', async () => {
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('unavailable'));

      const { result, reload } = save(80, '2026-10-15', mealCache);
      await result;

      const cached = (WeightService.setCachedUserData as jest.Mock).mock.calls[0][1];
      expect(cached.currentWeight).toBe(80);
      expect(cached).not.toHaveProperty('lastSnapshotWeek');
      expect(evaluateWeeklyProgress).not.toHaveBeenCalled();
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('still reports the saved weight when the weekly evaluation fails after the write succeeded', async () => {
      (evaluateWeeklyProgress as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));

      const { result, setCurrentWeight, reload } = save(80, '2026-10-15', mealCache);
      await result;

      expect(WeightService.setCachedUserData).toHaveBeenCalledWith('user-1', expect.objectContaining({
        currentWeight: 80,
        lastSnapshotWeek: '2026-10-05',
      }));
      expect(setCurrentWeight).toHaveBeenCalledWith(80);
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});

describe('loadUserWeightData week selection', () => {
  const run = async (selectedDate: string) => {
    const setters = Array.from({ length: 10 }, () => jest.fn());
    await loadUserWeightData('user-1', selectedDate, ...(setters as [
      jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock, jest.Mock,
    ]));
    return setters;
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (doc as jest.Mock).mockReturnValue({ withConverter: jest.fn(() => userRef) });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the selected day\'s week and the week before it, not the current calendar week', async () => {
    storedUser({
      currentWeight: 79,
      weightIns: [
        { weekStart: '2026-09-28', days: { monday: 83 }, average: 83 },
        { weekStart: '2026-10-05', days: { monday: 81 }, average: 81 },
        { weekStart: '2026-10-12', days: { monday: 79 }, average: 79 },
      ],
    });

    const [, , setWeeklyData, setWeeklyAverage, setLastWeekAverage] = await run('2026-10-07');

    expect(setWeeklyData).toHaveBeenCalledWith(expect.objectContaining({ weekStart: '2026-10-05' }));
    expect(setWeeklyAverage).toHaveBeenCalledWith(81);
    expect(setLastWeekAverage).toHaveBeenCalledWith(83);
  });

  it('reports no averages for a week without entries', async () => {
    storedUser({ currentWeight: 79, weightIns: [{ weekStart: '2026-10-12', days: { monday: 79 }, average: 79 }] });

    const [, , setWeeklyData, setWeeklyAverage, setLastWeekAverage] = await run('2026-11-02');

    expect(setWeeklyData).toHaveBeenCalledWith(undefined);
    expect(setWeeklyAverage).toHaveBeenCalledWith(null);
    expect(setLastWeekAverage).toHaveBeenCalledWith(null);
  });

  it('leaves every setter untouched when the user document does not exist', async () => {
    storedUser(null);

    const setters = await run('2026-10-15');

    setters.forEach(setter => expect(setter).not.toHaveBeenCalled());
  });
});

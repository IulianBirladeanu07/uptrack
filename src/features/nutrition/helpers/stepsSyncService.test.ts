jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, id) => ({ db, collection, id })),
  setDoc: jest.fn(() => Promise.resolve()),
  runTransaction: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { runTransaction, setDoc } from 'firebase/firestore';
import { diffSteps, chunkRange, persistDailySteps, restorePendingSteps } from './stepsSyncService';

let transactionProfile: Record<string, unknown> = {};
const transactionSet = jest.fn();
const transact = runTransaction as jest.Mock;
transact.mockImplementation(async (_db, callback) => callback({
  get: async () => ({ exists: () => true, data: () => transactionProfile }),
  set: transactionSet,
}));

describe('diffSteps', () => {
  test('only past days, new or larger', () => {
    const out = diffSteps({ '2026-10-01': 8000, '2026-10-02': 9000 }, { '2026-10-01': 8000, '2026-10-02': 9500, '2026-10-03': 7000, '2026-10-04': 300 }, '2026-10-04');
    expect(out).toEqual({ '2026-10-02': 9500, '2026-10-03': 7000 });
  });

  describe('restorePendingSteps', () => {
    test('requeues failed entries without overwriting newer pending values', () => {
      expect(restorePendingSteps(
        { '2026-10-01': 8000, '2026-10-02': 9000 },
        { '2026-10-02': 10000, '2026-10-03': 7000 },
      )).toEqual({
        '2026-10-01': 8000,
        '2026-10-02': 10000,
        '2026-10-03': 7000,
      });
    });
  });

  test('ignores junk values', () => {
    expect(diffSteps({}, { '2026-10-01': 29, '2026-10-02': 0, '2026-10-03': 'x' }, '2026-10-04')).toEqual({});
  });
});

describe('chunkRange', () => {
  test('splits into contiguous non-overlapping chunks that cover the range', () => {
    const chunks = chunkRange(new Date(2026, 0, 1), new Date(2026, 9, 4, 12), 30);
    expect(chunks[0][0]).toEqual(new Date(2026, 0, 1));
    expect(chunks[chunks.length - 1][1]).toEqual(new Date(2026, 9, 4, 12));
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i - 1][1];
      const next = new Date(prevEnd);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      expect(chunks[i][0]).toEqual(next);
    }
    expect(chunks.length).toBe(Math.ceil(277 / 30));
  });

  test('single chunk when range is shorter than chunk size', () => {
    const chunks = chunkRange(new Date(2026, 9, 1), new Date(2026, 9, 4, 12), 30);
    expect(chunks).toHaveLength(1);
  });

  test('empty when start is after end', () => {
    expect(chunkRange(new Date(2026, 9, 5), new Date(2026, 9, 4), 30)).toEqual([]);
  });
});

describe('persistDailySteps', () => {
  beforeEach(() => {
    transactionProfile = {};
    transactionSet.mockReset();
    (setDoc as jest.Mock).mockClear();
  });

  test('writes dailySteps as a merged map', async () => {
    const ok = await persistDailySteps('u1', { '2026-10-03': 8000 });
    expect(ok).toBe(true);
    expect(setDoc).toHaveBeenCalledWith({ db: {}, collection: 'users', id: 'u1' }, { dailySteps: { '2026-10-03': 8000 } }, { merge: true });
  });

  test('repairs from the latest profile snapshot while preserving concurrently added weeks', async () => {
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2026, 10, 2 + index);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const dailySteps = Object.fromEntries(dates.map((date, index) => [date, index === 6 ? 13570 : 13000]));
    const concurrentSnapshot = { weekStart: '2026-11-09', avgCalories: 2400 };
    transactionProfile = {
      dailySteps,
      weeklyNutrition: [
        { weekStart: '2026-11-02', avgSteps: 23027, totalSteps: 161191, daysLoggedSteps: 7 },
        concurrentSnapshot,
      ],
    };

    await persistDailySteps('u1', {}, false, ['2026-11-02']);

    expect(transactionSet).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(
      { db: {}, collection: 'users', id: 'u1' },
      {
        weeklyNutrition: [
          { weekStart: '2026-11-02', avgSteps: 13081, totalSteps: 91570, daysLoggedSteps: 7 },
          concurrentSnapshot,
        ],
      },
      { merge: true },
    );
  });

  test('writes daily steps and snapshot repair together in one transaction', async () => {
    transactionProfile = {
      dailySteps: { '2026-11-02': 12000 },
      weeklyNutrition: [{ weekStart: '2026-11-02', avgSteps: 12000, totalSteps: 12000, daysLoggedSteps: 1 }],
    };

    await persistDailySteps('u1', { '2026-11-02': 13000 }, false, ['2026-11-02']);

    expect(transactionSet).toHaveBeenCalledWith(
      { db: {}, collection: 'users', id: 'u1' },
      {
        dailySteps: { '2026-11-02': 13000 },
        weeklyNutrition: [{ weekStart: '2026-11-02', avgSteps: 13000, totalSteps: 13000, daysLoggedSteps: 1 }],
      },
      { merge: true },
    );
  });

  test('adds stepsBackfilledAt when marking backfill', async () => {
    await persistDailySteps('u1', { a: 1 }, true);
    const payload = setDoc.mock.calls[0][1];
    expect(payload.dailySteps).toEqual({ a: 1 });
    expect(typeof payload.stepsBackfilledAt).toBe('string');
  });

  test('marks backfill even with no entries', async () => {
    await persistDailySteps('u1', {}, true);
    const payload = setDoc.mock.calls[0][1];
    expect(payload.dailySteps).toBeUndefined();
    expect(payload.stepsBackfilledAt).toBeDefined();
  });

  test('does nothing without uid or without entries and no flag', async () => {
    expect(await persistDailySteps(null, { a: 1 })).toBe(false);
    expect(await persistDailySteps('u1', {})).toBe(false);
    expect(setDoc).not.toHaveBeenCalled();
  });
});

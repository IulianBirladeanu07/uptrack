jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, id) => ({ db, collection, id })),
  setDoc: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { setDoc } from 'firebase/firestore';
import { diffSteps, chunkRange, persistDailySteps } from './stepsSyncService';

describe('diffSteps', () => {
  test('returns only new or changed positive days', () => {
    const out = diffSteps({ '2026-10-01': 8000, '2026-10-02': 9000 }, { '2026-10-01': 8000, '2026-10-02': 9500, '2026-10-03': 7000 });
    expect(out).toEqual({ '2026-10-02': 9500, '2026-10-03': 7000 });
  });

  test('ignores zero, negative and non-numeric values', () => {
    expect(diffSteps({}, { a: 0, b: -5, c: 'x', d: null })).toEqual({});
  });

  test('rounds fractional values and compares rounded', () => {
    expect(diffSteps({ a: 100 }, { a: 100.4 })).toEqual({});
    expect(diffSteps({ a: 100 }, { a: 100.6 })).toEqual({ a: 101 });
  });

  test('handles missing stored and incoming', () => {
    expect(diffSteps(undefined, { a: 5 })).toEqual({ a: 5 });
    expect(diffSteps({ a: 5 }, undefined)).toEqual({});
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
  test('writes dailySteps as a merged map', async () => {
    const ok = await persistDailySteps('u1', { '2026-10-03': 8000 });
    expect(ok).toBe(true);
    expect(setDoc).toHaveBeenCalledWith({ db: {}, collection: 'users', id: 'u1' }, { dailySteps: { '2026-10-03': 8000 } }, { merge: true });
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

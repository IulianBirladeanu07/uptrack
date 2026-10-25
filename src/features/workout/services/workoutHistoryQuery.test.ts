jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  limit: jest.fn(value => ({ limit: value })),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  startAfter: jest.fn(value => ({ startAfter: value })),
  Timestamp: { fromDate: jest.fn(date => date) },
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { getDocs, limit, orderBy, startAfter, where } from 'firebase/firestore';
import { queryClient } from '../../../shared/query/queryClient';
import {
  fetchUserWorkoutHistory,
  fetchUserWorkoutHistoryInRange,
  fetchUserWorkoutHistoryPage,
  fetchWorkoutHistoryPage,
} from './workoutHistoryQuery';

describe('workout history page cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('fetches bounded pages, advances from the last document, and caches each page', async () => {
    const firstPageDocs = Array.from({ length: 2 }, (_, index) => ({
      id: `workout-${index}`,
      data: () => ({ index }),
    }));
    const secondPageDocs = [{ id: 'workout-2', data: () => ({ index: 2 }) }];
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({ docs: firstPageDocs })
      .mockResolvedValueOnce({ docs: secondPageDocs });

    await expect(fetchUserWorkoutHistoryPage('user-1', 2, 0)).resolves.toMatchObject({
      records: [
        { id: 'workout-0', data: { index: 0 } },
        { id: 'workout-1', data: { index: 1 } },
      ],
      hasMore: true,
    });
    await expect(fetchUserWorkoutHistoryPage('user-1', 2, 1)).resolves.toMatchObject({
      records: [{ id: 'workout-2', data: { index: 2 } }],
      hasMore: false,
    });
    await fetchUserWorkoutHistoryPage('user-1', 2, 1);

    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(startAfter).toHaveBeenCalledWith(firstPageDocs[1]);
  });

  it('fetches an infinite-query page directly from its cursor and user', async () => {
    const cursor = { id: 'workout-1', data: () => ({}) };
    const next = { id: 'workout-2', data: () => ({}) };
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [next] });

    await expect(fetchWorkoutHistoryPage('user-2', 100, cursor as never)).resolves.toEqual({
      records: [{ id: 'workout-2', data: {} }],
      hasMore: false,
      lastDocument: next,
    });

    expect(startAfter).toHaveBeenCalledWith(cursor);
    expect(where).toHaveBeenCalledWith('uid', '==', 'user-2');
    expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(limit).toHaveBeenCalledWith(100);
  });

  it('reuses the shared first page for smaller recent-history requests', async () => {
    const docs = Array.from({ length: 4 }, (_, index) => ({
      id: `workout-${index}`,
      data: () => ({ index }),
    }));
    (getDocs as jest.Mock).mockResolvedValue({ docs });

    await expect(fetchUserWorkoutHistory('user-1', 2)).resolves.toEqual([
      { id: 'workout-0', data: { index: 0 } },
      { id: 'workout-1', data: { index: 1 } },
    ]);
    await fetchUserWorkoutHistoryPage('user-1', 100, 0);

    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it('queries workout history within an explicit date range', async () => {
    const start = new Date('2026-01-05T00:00:00.000Z');
    const end = new Date('2026-01-12T00:00:00.000Z');
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: 'workout-1', data: () => ({}) }],
    });

    await expect(fetchUserWorkoutHistoryInRange('user-1', start, end)).resolves.toEqual([
      { id: 'workout-1', data: {} },
    ]);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });
});

jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  limit: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  Timestamp: { fromDate: jest.fn(date => date) },
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { getAuth } from 'firebase/auth';
import { getDocs } from 'firebase/firestore';
import { queryClient } from '../../../shared/query/queryClient';
import {
  countWorkoutsThisWeek,
  getLastWorkout,
  getSetsFromLastWorkout,
} from './workoutHistoryService';

describe('workout history service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDocs as jest.Mock).mockReset();
    queryClient.clear();
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
  });

  it('returns matching prior workout sets using the first recent workout with that exercise', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        { data: () => ({ exercises: [{ exerciseName: 'Row', sets: [{ weight: 40, reps: 10 }] }] }) },
        {
          data: () => ({
            exercises: [
              { exerciseName: 'Bench', muscleGroup: 'Chest', sets: [{ weight: 50, reps: 8 }] },
              { exerciseName: 'Bench', muscleGroup: 'Chest', sets: [{ weight: 45, reps: 10 }] },
            ],
          }),
        },
        { data: () => ({ exercises: [{ exerciseName: 'Bench', sets: [{ weight: 60, reps: 5 }] }] }) },
      ],
    });

    await expect(getSetsFromLastWorkout('Bench', 'Chest')).resolves.toEqual([
      { id: 'Bench-0', weight: '50', reps: '8', isValidated: false, repsModified: false },
      { id: 'Bench-1', weight: '45', reps: '10', isValidated: false, repsModified: false },
    ]);
  });

  it('preserves the existing empty-array fallback when prior-workout lookup fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getDocs as jest.Mock).mockRejectedValue(new Error('history unavailable'));

    await expect(getSetsFromLastWorkout('Bench')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      'Error retrieving sets from last workout:',
      'history unavailable',
    );

    consoleError.mockRestore();
  });

  it('reuses one cached recent-history query across per-exercise lookups', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{
        id: 'workout-1',
        data: () => ({
          exercises: [
            { exerciseName: 'Bench', muscleGroup: 'Chest', sets: [{ weight: 50, reps: 8 }] },
            { exerciseName: 'Row', muscleGroup: 'Back', sets: [{ weight: 40, reps: 10 }] },
          ],
        }),
      }],
    });

    await expect(getSetsFromLastWorkout('Bench', 'Chest')).resolves.toHaveLength(1);
    await expect(getSetsFromLastWorkout('Row', 'Back')).resolves.toHaveLength(1);

    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it('returns the latest workout or null when the history is empty', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ workoutName: 'Latest' }) }] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(getLastWorkout()).resolves.toEqual({ workoutName: 'Latest' });
    queryClient.clear();
    await expect(getLastWorkout()).resolves.toBeNull();
  });

  it('counts this week using a bounded history range', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ data: () => ({ timestamp: { toDate: () => new Date() } }) }],
    });

    await expect(countWorkoutsThisWeek()).resolves.toBe(1);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });
});

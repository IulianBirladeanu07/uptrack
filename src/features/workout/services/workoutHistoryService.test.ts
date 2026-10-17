jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  limit: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { getAuth } from 'firebase/auth';
import { getDocs } from 'firebase/firestore';
import { getLastWorkout, getSetsFromLastWorkout } from './workoutHistoryService';

describe('workout history service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('history unavailable'));

    await expect(getSetsFromLastWorkout('Bench')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      'Error retrieving sets from last workout:',
      'history unavailable',
    );

    consoleError.mockRestore();
  });

  it('returns the latest workout or null when the history is empty', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ workoutName: 'Latest' }) }] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    await expect(getLastWorkout()).resolves.toEqual({ workoutName: 'Latest' });
    await expect(getLastWorkout()).resolves.toBeNull();
  });
});

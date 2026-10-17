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
import { getExerciseHistory } from './exerciseHistoryService';

describe('getExerciseHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
  });

  it('returns only valid matching sets with best-set and volume summaries', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'workout-1',
          data: () => ({
            timestamp: '2026-10-16',
            workoutName: '',
            exercises: [
              {
                exerciseName: 'Bench Press',
                muscleGroup: 'Chest',
                sets: [
                  { weight: '50', reps: '8' },
                  { weight: '-1', reps: '8' },
                  { weight: '45', reps: '0' },
                ],
              },
              {
                exerciseName: 'Row',
                muscleGroup: 'Back',
                sets: [{ weight: '100', reps: '10' }],
              },
            ],
          }),
        },
        {
          id: 'workout-2',
          data: () => ({
            exercises: [{
              exerciseName: 'Bench Press',
              muscleGroup: 'Chest',
              sets: [{ weight: '55', reps: '6' }],
            }],
          }),
        },
      ],
    });

    await expect(getExerciseHistory('Bench Press', 'Chest')).resolves.toEqual([
      {
        id: 'workout-1',
        timestamp: '2026-10-16',
        workoutName: 'Workout',
        sets: [{ weight: '50', reps: '8' }],
        best: { weight: 50, reps: 8, estimated1RM: expect.any(Number), e1rm: expect.any(Number) },
        totalVolume: 400,
      },
      {
        id: 'workout-2',
        timestamp: undefined,
        workoutName: 'Workout',
        sets: [{ weight: '55', reps: '6' }],
        best: { weight: 55, reps: 6, estimated1RM: expect.any(Number), e1rm: expect.any(Number) },
        totalVolume: 330,
      },
    ]);
  });

  it('throws and logs when no user is authenticated', async () => {
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(getExerciseHistory('Bench Press')).rejects.toThrow('User not authenticated.');
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching exercise history:',
      'User not authenticated.',
    );

    consoleError.mockRestore();
  });
});

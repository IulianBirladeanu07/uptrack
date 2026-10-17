import type { WorkoutExercise } from '../types';
import { buildWorkoutCompletionData } from './buildWorkoutCompletionData';

describe('buildWorkoutCompletionData', () => {
  const previousSets = [
    { id: 'previous-set', weight: '60', reps: '8', isValidated: false, repsModified: false },
  ];
  const exercises: WorkoutExercise[] = [{
    exerciseName: 'Bench Press',
    muscleGroup: 'Chest',
    lastWorkoutSets: previousSets,
    sets: [
      { id: 'set-1', weight: '65', reps: '8', isValidated: true, repsModified: false },
      { id: 'set-2', weight: '60', reps: '8', isValidated: false, repsModified: false },
    ],
  }];

  it('annotates personal records and serializes only persisted workout fields', () => {
    const timestamp = { serverTimestamp: true };
    const result = buildWorkoutCompletionData({
      exerciseData: exercises,
      uid: 'user-1',
      timestamp,
      note: 'Good session',
      duration: '45:00',
      workoutName: 'Upper A',
    });

    expect(result.exercisesWithPR[0].sets.map(set => set.isPR)).toEqual([true, false]);
    expect(result.workoutDataToSend).toMatchObject({
      uid: 'user-1',
      timestamp,
      note: 'Good session',
      duration: '45:00',
      workoutName: 'Upper A',
      exercises: [{
        exerciseName: 'Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { weight: 65, reps: 8, isValidated: true, isPR: true, estimated1RM: expect.any(String) },
          { weight: 60, reps: 8, isValidated: false, isPR: false, estimated1RM: expect.any(String) },
        ],
      }],
    });
    expect(result.workoutDataToSend.exercises[0]).not.toHaveProperty('lastWorkoutSets');
    expect(result.exercisesWithPR[0].lastWorkoutSets).toBe(previousSets);
  });

  it('uses N/A for zero reps and labels bodyweight rep records', () => {
    const result = buildWorkoutCompletionData({
      exerciseData: [{
        exerciseName: 'Push-up',
        sets: [
          { id: 'set-1', weight: '0', reps: '12', isValidated: true, repsModified: false },
          { id: 'set-2', weight: '0', reps: '0', isValidated: true, repsModified: false },
        ],
      }],
      uid: 'user-1',
      timestamp: null,
      note: '',
      duration: '10:00',
      workoutName: null,
    });

    expect(result.exercisesWithPR[0].sets[0].isPR).toBe(true);
    expect(result.workoutDataToSend.exercises[0].sets).toEqual([
      { weight: 0, reps: 12, isValidated: true, isPR: true, estimated1RM: expect.any(String) },
      { weight: 0, reps: 0, isValidated: true, isPR: false, estimated1RM: 'N/A' },
    ]);
  });

  it('does not mutate the active session exercises or their sets', () => {
    const result = buildWorkoutCompletionData({
      exerciseData: exercises,
      uid: 'user-1',
      timestamp: null,
      note: '',
      duration: '1:00',
      workoutName: null,
    });

    expect(exercises[0].sets[0]).not.toHaveProperty('isPR');
    expect(result.exercisesWithPR[0].sets[0]).not.toBe(exercises[0].sets[0]);
    expect(exercises[0].lastWorkoutSets).toBe(previousSets);
  });
});

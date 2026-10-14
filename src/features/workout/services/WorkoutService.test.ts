const mockStore = new Map();
const mockGetItem = jest.fn();
const mockGetSetsFromLastWorkout = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args) => mockGetItem(...args),
  setItem: jest.fn(async (k, v) => {
    mockStore.set(k, v);
  }),
  removeItem: jest.fn(async (k) => {
    mockStore.delete(k);
  }),
}));
jest.mock('../handlers/WorkoutHandler', () => ({
  getSetsFromLastWorkout: (...args) => mockGetSetsFromLastWorkout(...args),
}));

const ex = (name) => ({
  exerciseName: name,
  sets: [{ id: `${name}-1`, weight: '50', reps: '5', isValidated: false, repsModified: false }],
});

let svc;

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  mockStore.clear();
  mockGetItem.mockReset().mockImplementation(async k => (mockStore.has(k) ? mockStore.get(k) : null));
  mockGetSetsFromLastWorkout.mockReset();
  svc = require('./WorkoutService').workoutService;
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('active workout storage per user', () => {
  test('user B never restores user A workout', async () => {
    await svc.setUser('a');
    svc.setExerciseData([ex('Bench')]);
    await svc.persistWorkout();
    expect(mockStore.has('activeWorkout_a')).toBe(true);

    await svc.setUser('b');
    expect(svc.getExerciseData()).toEqual([]);
    expect(await svc.restoreWorkout()).toBeNull();
    expect(svc.getExerciseData()).toEqual([]);
  });

  test('a pending persist for user A lands under the key of A', async () => {
    await svc.setUser('a');
    svc.setExerciseData([ex('Squat')]);
    expect(mockStore.has('activeWorkout_a')).toBe(false);

    await svc.setUser('b');
    const saved = JSON.parse(mockStore.get('activeWorkout_a'));
    expect(saved.exercises).toHaveLength(1);
    expect(saved.exercises[0].exerciseName).toBe('Squat');
    expect(mockStore.has('activeWorkout_b')).toBe(false);
  });

  test('user A gets the workout back after signing in again', async () => {
    await svc.setUser('a');
    svc.setExerciseData([ex('Row')]);
    await svc.setUser('b');
    await svc.setUser('a');

    const restored = await svc.restoreWorkout();
    expect(restored.exercises[0].exerciseName).toBe('Row');
    expect(svc.getExerciseData()).toHaveLength(1);
  });

  test('setUser with the same uid keeps the in-memory workout', async () => {
    await svc.setUser('a');
    svc.setExerciseData([ex('Press')]);
    await svc.setUser('a');
    expect(svc.getExerciseData()).toHaveLength(1);
  });

  test('the legacy device-wide key is removed', async () => {
    mockStore.set('activeWorkout', JSON.stringify({ isActive: true, exercises: [ex('Old')] }));
    await svc.setUser('a');
    expect(mockStore.has('activeWorkout')).toBe(false);
    expect(await svc.restoreWorkout()).toBeNull();
  });

  test('without a user nothing is persisted or restored', async () => {
    svc.setExerciseData([ex('Curl')]);
    await svc.persistWorkout();
    expect(mockStore.size).toBe(0);
    expect(await svc.restoreWorkout()).toBeNull();
  });

  test('signing out clears the in-memory workout and notifies listeners', async () => {
    const seen = [];
    svc.subscribe((d) => seen.push(d));
    await svc.setUser('a');
    svc.setExerciseData([ex('Dip')]);
    await svc.setUser(null);
    expect(svc.getExerciseData()).toEqual([]);
    expect(seen[seen.length - 1]).toEqual([]);
    expect(mockStore.has('activeWorkout_a')).toBe(true);
  });

  test('a restore started for A does not load into B', async () => {
    await svc.setUser('a');
    svc.setExerciseData([ex('Lunge')]);
    await svc.persistWorkout();

    const pending = svc.restoreWorkout();
    await svc.setUser('b');
    expect(await pending).toBeNull();
    expect(svc.getExerciseData()).toEqual([]);
  });

  test('a pending restore cannot recreate a workout after it is cleared', async () => {
    let resolveSavedWorkout;
    mockGetItem.mockImplementationOnce(() => new Promise(resolve => {
      resolveSavedWorkout = resolve;
    }));

    await svc.setUser('a');
    const pending = svc.restoreWorkout();
    await svc.clearWorkout();
    resolveSavedWorkout(JSON.stringify({
      startTime: Date.now() - 60000,
      exercises: [ex('Cleared workout')],
      note: '',
      templateName: '',
      isActive: true,
      lastSaved: Date.now() - 60000,
    }));

    await expect(pending).resolves.toBeNull();
    expect(svc.getExerciseData()).toEqual([]);
  });

  test('a stale restore does not overwrite a later session for the same user', async () => {
    let resolveSavedWorkout;
    mockGetItem.mockImplementationOnce(() => new Promise(resolve => {
      resolveSavedWorkout = resolve;
    }));

    await svc.setUser('a');
    const pending = svc.restoreWorkout();
    await svc.setUser('b');
    await svc.setUser('a');
    svc.setExerciseData([ex('Current session')]);

    resolveSavedWorkout(JSON.stringify({
      startTime: Date.now() - 60000,
      exercises: [ex('Stale session')],
      note: '',
      templateName: '',
      isActive: true,
      lastSaved: Date.now() - 60000,
    }));

    await expect(pending).resolves.toBeNull();
    expect(svc.getExerciseData().map(exercise => exercise.exerciseName)).toEqual(['Current session']);
  });

  test('clearWorkout removes only the key of the current user', async () => {
    mockStore.set('activeWorkout_a', '{}');
    mockStore.set('activeWorkout_b', '{}');
    await svc.setUser('a');
    mockStore.set('activeWorkout_a', '{}');
    await svc.clearWorkout();
    expect(mockStore.has('activeWorkout_a')).toBe(false);
    expect(mockStore.has('activeWorkout_b')).toBe(true);
  });

  test('does not cache previous-user history after switching accounts', async () => {
    let resolvePreviousSets;
    mockGetSetsFromLastWorkout
      .mockImplementationOnce(() => new Promise(resolve => {
        resolvePreviousSets = resolve;
      }))
      .mockResolvedValueOnce([{
        id: 'bench-b',
        weight: '80',
        reps: '8',
        isValidated: false,
        repsModified: false,
      }]);

    await svc.setUser('a');
    const previousUserRequest = svc.fetchLastSets('Bench Press');

    await svc.setUser('b');
    resolvePreviousSets([{
      id: 'bench-a',
      weight: '100',
      reps: '5',
      isValidated: false,
      repsModified: false,
    }]);

    await expect(previousUserRequest).resolves.toEqual([]);
    await expect(svc.fetchLastSets('Bench Press')).resolves.toEqual([{
      id: 'bench-b',
      weight: '80',
      reps: '8',
      isValidated: false,
      repsModified: false,
    }]);
  });

  test('does not load a template into a different user session', async () => {
    let resolvePreviousSets;
    mockGetSetsFromLastWorkout.mockImplementationOnce(() => new Promise(resolve => {
      resolvePreviousSets = resolve;
    }));

    await svc.setUser('a');
    const previousUserLoad = svc.loadWorkoutFromTemplate([{
      exerciseName: 'Bench Press',
      numSets: 1,
      repRange: '5-8',
      sets: [],
    }]);

    await svc.setUser('b');
    resolvePreviousSets([{
      id: 'bench-a',
      weight: '100',
      reps: '5',
      isValidated: false,
      repsModified: false,
    }]);

    await expect(previousUserLoad).resolves.toEqual([]);
    expect(svc.getExerciseData()).toEqual([]);
  });

  test('a pending template load cannot recreate a workout after it is cleared', async () => {
    let resolvePreviousSets;
    mockGetSetsFromLastWorkout.mockImplementationOnce(() => new Promise(resolve => {
      resolvePreviousSets = resolve;
    }));

    await svc.setUser('a');
    svc.startWorkout();
    const pending = svc.loadWorkoutFromTemplate([{
      exerciseName: 'Bench Press',
      numSets: 1,
      repRange: '5-8',
      sets: [],
    }]);
    await svc.clearWorkout();
    resolvePreviousSets([]);

    await expect(pending).resolves.toEqual([]);
    expect(svc.getExerciseData()).toEqual([]);
  });

  test('does not add duplicate exercise names from the same batch', () => {
    svc.setExerciseData([ex('Squat')]);

    svc.addExercises([ex('Bench Press'), ex('Bench Press'), ex('Squat')]);

    expect(svc.getExerciseData().map(exercise => exercise.exerciseName)).toEqual([
      'Squat',
      'Bench Press',
    ]);
  });
});

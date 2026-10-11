const mockStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => (mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn(async (k, v) => {
    mockStore.set(k, v);
  }),
  removeItem: jest.fn(async (k) => {
    mockStore.delete(k);
  }),
}));
jest.mock('../handlers/WorkoutHandler', () => ({ getSetsFromLastWorkout: jest.fn() }));

const ex = (name) => ({
  exerciseName: name,
  sets: [{ id: `${name}-1`, weight: '50', reps: '5', isValidated: false, repsModified: false }],
});

let svc;

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  mockStore.clear();
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

  test('clearWorkout removes only the key of the current user', async () => {
    mockStore.set('activeWorkout_a', '{}');
    mockStore.set('activeWorkout_b', '{}');
    await svc.setUser('a');
    mockStore.set('activeWorkout_a', '{}');
    await svc.clearWorkout();
    expect(mockStore.has('activeWorkout_a')).toBe(false);
    expect(mockStore.has('activeWorkout_b')).toBe(true);
  });
});

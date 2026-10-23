import { setDoc, doc } from 'firebase/firestore';
import { sendWorkoutDataToFirestore } from './workoutSessionService';
import { workoutService } from './WorkoutService';

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'user-1' } }),
}));

let mockNextId = 0;
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, name: string) => ({ name })),
  doc: jest.fn((ref: { name?: string } | unknown, ...segments: string[]) => {
    const collectionName = (ref as { name?: string }).name ?? segments[0];
    const id = segments.length > 1 ? segments[1] : `auto-${++mockNextId}`;
    return { path: `${collectionName}/${id}`, id };
  }),
  serverTimestamp: jest.fn(() => 'server-time'),
  setDoc: jest.fn(),
}));

jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('./WorkoutService', () => ({
  workoutService: { workoutStartTime: 1000, clearLastSetCache: jest.fn() },
}));
jest.mock('./buildWorkoutCompletionData', () => ({
  buildWorkoutCompletionData: jest.fn(() => ({ exercisesWithPR: [], workoutDataToSend: { uid: 'user-1' } })),
}));
jest.mock('../../../shared/query/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn().mockResolvedValue(undefined) },
}));

const navigation = { navigate: jest.fn() };
const message = jest.fn();
const finish = () =>
  sendWorkoutDataToFirestore([], '', true, navigation, message, () => '0:30', 30, 'user-1', 'Push');

const savedPaths = () => (setDoc as jest.Mock).mock.calls.map(([ref]) => (ref as { path: string }).path);

describe('finishing a workout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockNextId = 0;
    (workoutService as { workoutStartTime: number | null }).workoutStartTime = 1000;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('a retry after a timed-out save writes to the same document so it cannot be saved twice', async () => {
    (setDoc as jest.Mock).mockImplementationOnce(() => new Promise(() => undefined));

    const first = finish();
    await jest.advanceTimersByTimeAsync(12000);
    await expect(first).resolves.toBe(false);
    expect(message).toHaveBeenCalledWith('Could not save. Check your connection and try again.');

    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(finish()).resolves.toBe(true);

    const paths = savedPaths();
    expect(paths).toHaveLength(2);
    expect(paths[1]).toBe(paths[0]);
    expect(doc).toHaveBeenCalledWith({}, 'workoutHistory', expect.any(String));
  });

  test('the next workout after a successful save gets its own document', async () => {
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await expect(finish()).resolves.toBe(true);
    await expect(finish()).resolves.toBe(true);

    const paths = savedPaths();
    expect(paths[1]).not.toBe(paths[0]);
  });

  test('a different workout session never reuses a pending document', async () => {
    (setDoc as jest.Mock).mockImplementationOnce(() => new Promise(() => undefined));
    const first = finish();
    await jest.advanceTimersByTimeAsync(12000);
    await first;

    (workoutService as { workoutStartTime: number | null }).workoutStartTime = 2000;
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
    await expect(finish()).resolves.toBe(true);

    const paths = savedPaths();
    expect(paths[1]).not.toBe(paths[0]);
  });
});

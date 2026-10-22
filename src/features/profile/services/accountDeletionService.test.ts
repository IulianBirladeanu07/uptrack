const mockCalls = [];
const mockStore = { docsByCollection: {}, storageError: null, reauthError: null, batchError: null, localKeys: [], clearError: null };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, name) => ({ name })),
  doc: jest.fn((db, name, id) => ({ name, id })),
  where: jest.fn((f, op, v) => ({ f, op, v })),
  query: jest.fn((c, w) => ({ name: c.name, w })),
  getDocs: jest.fn(async (q) => {
    mockCalls.push(`list:${q.name}:${q.w.v}`);
    const docs = mockStore.docsByCollection[q.name] || [];
    return { docs: docs.map(id => ({ ref: { name: q.name, id } })) };
  }),
  writeBatch: jest.fn(() => {
    const ops = [];
    return {
      delete: (r) => ops.push(r),
      commit: async () => {
        if (mockStore.batchError) throw mockStore.batchError;
        mockCalls.push(`batch:${ops[0].name}:${ops.length}`);
      },
    };
  }),
  deleteDoc: jest.fn(async (r) => {
    mockCalls.push(`deleteDoc:${r.name}:${r.id}`);
  }),
}));
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((s, path) => ({ path })),
  deleteObject: jest.fn(async (r) => {
    mockCalls.push(`picture:${r.path}`);
    if (mockStore.storageError) throw mockStore.storageError;
  }),
}));
jest.mock('firebase/auth', () => ({
  reauthenticateWithCredential: jest.fn(async () => {
    mockCalls.push('reauth');
    if (mockStore.reauthError) throw mockStore.reauthError;
  }),
  deleteUser: jest.fn(async () => {
    mockCalls.push('deleteUser');
  }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(async () => mockStore.localKeys),
  multiRemove: jest.fn(async (keys) => {
    mockCalls.push(`local:${keys.join(',')}`);
  }),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('../../workout/services/WorkoutService', () => ({
  workoutService: {
    setUser: jest.fn(async () => {
      mockCalls.push('workoutReset');
      if (mockStore.clearError) throw mockStore.clearError;
    }),
  },
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    signOut: jest.fn(async () => {
      mockCalls.push('googleSignOut');
    }),
  },
}));

import { deleteAccount } from './accountDeletionService';

const user = { uid: 'u1' };
const credential = { providerId: 'password' };

beforeEach(() => {
  mockCalls.length = 0;
  mockStore.docsByCollection = {};
  mockStore.storageError = null;
  mockStore.reauthError = null;
  mockStore.batchError = null;
  mockStore.localKeys = [];
  mockStore.clearError = null;
});

describe('deleteAccount', () => {
  test('reauthenticates first and deletes nothing when it fails', async () => {
    mockStore.reauthError = Object.assign(new Error('bad'), { code: 'auth/wrong-password' });
    await expect(deleteAccount(user, credential)).rejects.toMatchObject({ code: 'auth/wrong-password' });
    expect(mockCalls).toEqual(['reauth']);
  });

  test('deletes picture, owned collections, the user document and the auth user in that order', async () => {
    mockStore.docsByCollection = { meals: ['a', 'b'], workoutHistory: ['c'], measurements: ['d'] };
    await deleteAccount(user, credential);
    expect(mockCalls).toEqual([
      'reauth',
      'picture:profilePictures/u1.jpg',
      'list:meals:u1',
      'batch:meals:2',
      'list:workoutHistory:u1',
      'batch:workoutHistory:1',
      'list:workoutTemplates:u1',
      'list:workoutSplits:u1',
      'list:measurements:u1',
      'batch:measurements:1',
      'list:customExercises:u1',
      'deleteDoc:users:u1',
      'deleteUser',
      'workoutReset',
      'googleSignOut',
    ]);
  });

  test('splits large collections into several batches', async () => {
    mockStore.docsByCollection = { meals: Array.from({ length: 850 }, (_, i) => `m${i}`) };
    await deleteAccount(user, credential);
    const batches = mockCalls.filter(c => c.startsWith('batch:meals'));
    expect(batches).toEqual(['batch:meals:400', 'batch:meals:400', 'batch:meals:50']);
  });

  test('a missing profile picture is not an error', async () => {
    mockStore.storageError = Object.assign(new Error('none'), { code: 'storage/object-not-found' });
    await deleteAccount(user, credential);
    expect(mockCalls).toContain('deleteUser');
  });

  test('another storage error stops before any data is deleted', async () => {
    mockStore.storageError = Object.assign(new Error('denied'), { code: 'storage/unauthorized' });
    await expect(deleteAccount(user, credential)).rejects.toMatchObject({ code: 'storage/unauthorized' });
    expect(mockCalls.some(c => c.startsWith('list:') || c === 'deleteUser')).toBe(false);
  });

  test('a failed data deletion keeps the auth user', async () => {
    mockStore.docsByCollection = { meals: ['a'] };
    mockStore.batchError = Object.assign(new Error('denied'), { code: 'permission-denied' });
    await expect(deleteAccount(user, credential)).rejects.toMatchObject({ code: 'permission-denied' });
    expect(mockCalls).not.toContain('deleteUser');
    expect(mockCalls).not.toContain('deleteDoc:users:u1');
  });

  test('removes only local keys that end with the uid', async () => {
    mockStore.localKeys = ['meal_cache_v2_u1', 'user_u1', 'home_week_u1', 'activeWorkout_u1', 'user_u2', 'cached_splits'];
    await deleteAccount(user, credential);
    expect(mockCalls).toContain('local:meal_cache_v2_u1,user_u1,home_week_u1,activeWorkout_u1');
  });

  test('a local cleanup failure does not fail a deleted account', async () => {
    mockStore.clearError = new Error('storage');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(deleteAccount(user, credential)).resolves.toBeUndefined();
    spy.mockRestore();
  });
});

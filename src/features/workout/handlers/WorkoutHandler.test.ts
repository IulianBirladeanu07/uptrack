jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
const mockTransaction = {
  get: jest.fn(async () => ({ exists: () => false, data: () => undefined })),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, collection, id) => collection === undefined
    ? { collection: 'workoutTemplates', id: 'auto-template-id' }
    : { collection, id }),
  getDocs: jest.fn(),
  limit: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  setDoc: jest.fn(),
  runTransaction: jest.fn(async (_db, callback) => callback(mockTransaction)),
  updateDoc: jest.fn(),
  where: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('../utils/exerciseCatalog', () => ({
  customDocToExercise: jest.fn(),
  mergeCustomExercises: jest.fn(),
}));

import { getAuth } from 'firebase/auth';
import { doc, getDocs, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import {
  addTemplateToFirestore,
  addSplitToFirestore,
  deleteTemplateFromFirestore,
  getExerciseHistory,
  fetchSplitsFromFirestore,
  sendWorkoutDataToFirestore,
  TemplateNameAlreadyExistsError,
  updateSplitInFirestore,
  updateTemplateInFirestore,
} from './WorkoutHandler';

describe('sendWorkoutDataToFirestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.get.mockImplementation(async () => ({ exists: () => false, data: () => undefined }));
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  test('reports saved when navigation to workout details fails after the write', async () => {
    const navigation = {
      navigate: jest.fn(() => {
        throw new Error('navigation unavailable');
      }),
    };
    const showMessage = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(sendWorkoutDataToFirestore(
      [{
        exerciseName: 'Bench Press',
        sets: [{
          id: 'set-1',
          weight: '50',
          reps: '8',
          isValidated: true,
          repsModified: false,
        }],
      }],
      '',
      true,
      navigation,
      showMessage,
      seconds => `0:${seconds}`,
      60,
      'user-1',
    )).resolves.toBe(true);

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(showMessage).toHaveBeenCalledWith('Workout saved, but workout details could not be opened.');
    expect(consoleError).toHaveBeenCalledWith(
      'Workout saved but failed to open workout details:',
      'navigation unavailable',
    );
    consoleError.mockRestore();
  });

  test('does not save a workout after the signed-in account changes', async () => {
    const showMessage = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const navigation = { navigate: jest.fn() };

    await expect(sendWorkoutDataToFirestore(
      [{
        exerciseName: 'Bench Press',
        sets: [{ id: 'set-1', weight: '50', reps: '8', isValidated: true, repsModified: false }],
      }],
      '',
      true,
      navigation,
      showMessage,
      seconds => `0:${seconds}`,
      60,
      'user-2',
    )).resolves.toBe(false);

    expect(setDoc).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('normalizes template names and escapes path separators in document ids', async () => {
    await addTemplateToFirestore(
      { templateName: 'Push/Pull', exercises: [] },
      ' Push/Pull ',
    );

    expect(doc).toHaveBeenCalledWith({}, 'workoutTemplates', 'push%2Fpull_user-1');
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(setDoc).not.toHaveBeenCalled();
    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      { workoutTemplateNames: { 'push%2Fpull': 'push%2Fpull_user-1' } },
      { mergeFields: ['workoutTemplateNames'] },
    );
  });

  test('rejects a template name already used regardless of case or surrounding spaces', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'existing-template', data: () => ({ templateName: ' push/pull ' }) }],
    });

    await expect(addTemplateToFirestore(
      { templateName: 'Push/Pull', exercises: [] },
      'PUSH/PULL',
    )).rejects.toBeInstanceOf(TemplateNameAlreadyExistsError);
    consoleError.mockRestore();
  });

  test('rejects a template name reserved concurrently after the duplicate-name query', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const transactionSet = jest.fn();
    (runTransaction as jest.Mock).mockImplementationOnce(async (_db, callback) => callback({
      get: jest.fn().mockImplementation(async ref => ({
        exists: () => ref.collection === 'users',
        data: () => ref.collection === 'users'
          ? { workoutTemplateNames: { 'push%2Fpull': 'push%2Fpull_user-1' } }
          : undefined,
      })),
      set: transactionSet,
      update: jest.fn(),
    }));

    await expect(addTemplateToFirestore(
      { templateName: 'Push/Pull', exercises: [] },
      'push/pull',
    )).rejects.toBeInstanceOf(TemplateNameAlreadyExistsError);
    expect(transactionSet).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('does not read the template document inside the creation transaction', async () => {
    await addTemplateToFirestore(
      { templateName: 'Push Day', exercises: [] },
      'Push Day',
    );

    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
    expect(mockTransaction.get).toHaveBeenCalledWith({ collection: 'users', id: 'user-1' });
    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'workoutTemplates', id: 'push%20day_user-1' },
      expect.objectContaining({ templateName: 'Push Day', uid: 'user-1' }),
    );
  });

  test('creates a template under a new id when the registry holds the deterministic id for a renamed template', async () => {
    mockTransaction.get.mockImplementation(async ref => ({
      exists: () => ref.collection === 'users',
      data: () => ref.collection === 'users'
        ? { workoutTemplateNames: { 'pull%20day': 'push%20day_user-1' } }
        : undefined,
    }));

    await expect(addTemplateToFirestore(
      { templateName: 'Push Day', exercises: [] },
      'Push Day',
    )).resolves.toBe('auto-template-id_user-1');

    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      {
        workoutTemplateNames: {
          'pull%20day': 'push%20day_user-1',
          'push%20day': 'auto-template-id_user-1',
        },
      },
      { mergeFields: ['workoutTemplateNames'] },
    );
  });

  test('creates a template under a new id when the deterministic id belongs to a renamed template', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'push%20day_user-1', data: () => ({ templateName: 'Pull Day' }) }],
    });

    await expect(addTemplateToFirestore(
      { templateName: 'Push Day', exercises: [] },
      'Push Day',
    )).resolves.toBe('auto-template-id_user-1');

    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      { workoutTemplateNames: { 'push%20day': 'auto-template-id_user-1' } },
      { mergeFields: ['workoutTemplateNames'] },
    );
    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'workoutTemplates', id: 'auto-template-id_user-1' },
      expect.objectContaining({ templateName: 'Push Day', uid: 'user-1' }),
    );
  });

  test('rejects renaming a template to another template name', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'other-template', data: () => ({ templateName: 'Leg Day' }) }],
    });

    await expect(updateTemplateInFirestore('current-template', {
      templateName: 'leg day',
    })).rejects.toBeInstanceOf(TemplateNameAlreadyExistsError);
    consoleError.mockRestore();
  });

  test('rejects a rename reserved by a concurrent template update', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    mockTransaction.get.mockImplementation(async ref => {
      if (ref.collection === 'users') {
        return {
          exists: () => true,
          data: () => ({ workoutTemplateNames: { 'leg%20day': 'other-template' } }),
        };
      }
      return {
        exists: () => true,
        data: () => ({ templateName: 'Push Day' }),
      };
    });

    await expect(updateTemplateInFirestore('current-template', {
      templateName: 'Leg Day',
    })).rejects.toBeInstanceOf(TemplateNameAlreadyExistsError);

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('updates only supplied template fields and preserves explicit zero values', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    mockTransaction.get.mockImplementation(async ref => ({
      exists: () => true,
      data: () => ref.collection === 'workoutTemplates'
        ? { templateName: 'Old Name' }
        : { workoutTemplateNames: { 'old%20name': 'template-1' } },
    }));

    await expect(updateTemplateInFirestore('template-1', {
      templateName: '  Push Day  ',
      duration: 0,
      note: '',
    })).resolves.toBe('template-1');

    expect(updateDoc).not.toHaveBeenCalled();
    expect(mockTransaction.update).toHaveBeenCalledWith(
      { collection: 'workoutTemplates', id: 'template-1' },
      {
        templateName: 'Push Day',
        duration: 0,
        note: '',
        updatedAt: 'server-timestamp',
      },
    );
    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      { workoutTemplateNames: { 'push%20day': 'template-1' } },
      { mergeFields: ['workoutTemplateNames'] },
    );
  });

  test('releases a template name reservation when deleting its template', async () => {
    mockTransaction.get.mockImplementation(async ref => ({
      exists: () => true,
      data: () => ref.collection === 'workoutTemplates'
        ? { templateName: 'Push Day' }
        : { workoutTemplateNames: { 'push%20day': 'template-1', 'leg%20day': 'template-2' } },
    }));

    await expect(deleteTemplateFromFirestore('template-1')).resolves.toBe(true);

    expect(mockTransaction.set).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      { workoutTemplateNames: { 'leg%20day': 'template-2' } },
      { mergeFields: ['workoutTemplateNames'] },
    );
    expect(mockTransaction.delete).toHaveBeenCalledWith({
      collection: 'workoutTemplates',
      id: 'template-1',
    });
  });

  test('rejects an empty template name without writing', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateTemplateInFirestore('template-1', {
      templateName: '   ',
    })).rejects.toThrow('Template name cannot be empty');

    expect(updateDoc).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('updates only supplied split fields and preserves explicit zero values', async () => {
    await expect(updateSplitInFirestore('split-1', {
      name: 'Strength',
      durationWeeks: 0,
    })).resolves.toBe('split-1');

    expect(updateDoc).toHaveBeenCalledWith({ collection: 'workoutSplits', id: 'split-1' }, {
      name: 'Strength',
      durationWeeks: 0,
      updatedAt: 'server-timestamp',
    });
  });

  test('propagates exercise-history read failures so the screen can show retry', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('history unavailable');
    (getDocs as jest.Mock).mockRejectedValueOnce(error);

    await expect(getExerciseHistory('Bench Press', 'Chest')).rejects.toBe(error);
    expect(consoleError).toHaveBeenCalledWith('Error fetching exercise history:', 'history unavailable');
    consoleError.mockRestore();
  });

  test('restores template ids when enriching persisted split schedules', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'split-1',
          data: () => ({
            schedule: {
              monday: { templateId: 'template-1', templateName: 'Old name' },
            },
          }),
        }],
      })
      .mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'template-1',
          data: () => ({
            templateName: 'Push',
            exercises: [{ exerciseName: 'Bench Press' }],
            duration: 45,
          }),
        }],
      });

    const splits = await fetchSplitsFromFirestore();

    expect(splits[0].schedule?.['monday']).toMatchObject({
      id: 'template-1',
      templateId: 'template-1',
      templateName: 'Push',
    });
  });

  test('saves unassigned split days as rest days', async () => {
    (doc as jest.Mock).mockReturnValueOnce({ id: 'split-1' });

    await expect(addSplitToFirestore({
      schedule: { monday: null },
    })).resolves.toBe('split-1');

    expect(setDoc).toHaveBeenCalledWith({ id: 'split-1' }, expect.objectContaining({
      schedule: {
        monday: {
          templateId: 'rest-day',
          templateName: 'Rest Day',
          exercises: [],
          duration: '0',
        },
      },
      uid: 'user-1',
    }));
  });
});

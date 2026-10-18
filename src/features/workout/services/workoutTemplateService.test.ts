jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-1' } })),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, collectionName, id) => ({ collectionName, id })),
  getDocs: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('./splitCache', () => ({ clearSplitsCache: jest.fn() }));

import { getAuth } from 'firebase/auth';
import { getDocs } from 'firebase/firestore';
import { queryClient } from '../../../shared/query/queryClient';
import { fetchTemplatesFromFirestore } from './workoutTemplateService';

describe('workout template query cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('reuses templates for the same user and keeps other users isolated', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({
        docs: [{ id: 'template-a', data: () => ({ templateName: 'A' }) }],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'template-b', data: () => ({ templateName: 'B' }) }],
      });

    await expect(fetchTemplatesFromFirestore()).resolves.toEqual([
      { id: 'template-a', templateName: 'A' },
    ]);
    await expect(fetchTemplatesFromFirestore()).resolves.toEqual([
      { id: 'template-a', templateName: 'A' },
    ]);
    expect(getDocs).toHaveBeenCalledTimes(1);

    jest.mocked(getAuth).mockReturnValue({ currentUser: { uid: 'user-2' } } as never);
    await expect(fetchTemplatesFromFirestore()).resolves.toEqual([
      { id: 'template-b', templateName: 'B' },
    ]);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });
});

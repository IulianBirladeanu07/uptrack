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

import { getDocs } from 'firebase/firestore';
import { queryClient } from '../../../shared/query/queryClient';
import { fetchTemplatesFromFirestore } from './workoutTemplateService';

describe('workout template query cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('caches reads per uid without sharing templates across users', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({
        docs: [{ id: 'template-a', data: () => ({ templateName: 'A' }) }],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'template-b', data: () => ({ templateName: 'B' }) }],
      });

    await expect(fetchTemplatesFromFirestore('user-1')).resolves.toEqual([
      { id: 'template-a', templateName: 'A' },
    ]);
    await expect(fetchTemplatesFromFirestore('user-1')).resolves.toEqual([
      { id: 'template-a', templateName: 'A' },
    ]);
    await expect(fetchTemplatesFromFirestore('user-2')).resolves.toEqual([
      { id: 'template-b', templateName: 'B' },
    ]);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });
});

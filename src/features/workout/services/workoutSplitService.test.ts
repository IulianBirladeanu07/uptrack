jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ currentUser: { uid: 'user-1' } })),
}));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    deleteDoc: jest.fn(),
    doc: jest.fn((_db, collectionName, id) => ({ collectionName, id })),
    getDocs: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => 'server-timestamp'),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    where: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('./splitCache', () => ({ clearSplitsCache: jest.fn() }));
jest.mock('./workoutTemplateService', () => ({ fetchTemplatesFromFirestore: jest.fn() }));

import { updateDoc } from 'firebase/firestore';
import { updateSplitInFirestore } from './workoutSplitService';

describe('updateSplitInFirestore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sanitizes hydrated schedule data before writing it', async () => {
        await updateSplitInFirestore('split-1', {
            schedule: {
                monday: {
                    templateId: 'template-1',
                    templateName: 'Push',
                    exercises: [{ exerciseName: 'Press' }],
                    duration: '45',
                    hydratedOnly: true,
                    legacyValue: undefined,
                },
                tuesday: null,
            },
        });

        expect(updateDoc).toHaveBeenCalledWith(
            { collectionName: 'workoutSplits', id: 'split-1' },
            {
                updatedAt: 'server-timestamp',
                schedule: {
                    monday: {
                        templateId: 'template-1',
                        templateName: 'Push',
                        exercises: [{ exerciseName: 'Press' }],
                        duration: '45',
                    },
                    tuesday: {
                        templateId: 'rest-day',
                        templateName: 'Rest Day',
                        exercises: [],
                        duration: '0',
                    },
                },
            },
        );
    });
});

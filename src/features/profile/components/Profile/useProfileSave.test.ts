import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { Auth, User } from 'firebase/auth';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import type { UserData } from '../../../../shared/types';
import { queryClient } from '../../../../shared/query/queryClient';
import { userProfileQueryKey } from '../../../auth/services/userProfileQuery';
import type { ProfileFormSeed, ProfileIdentitySeed } from '../../utils/profileSeed';
import { useProfileSave } from './useProfileSave';

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));
jest.mock('firebase/auth', () => ({
    verifyBeforeUpdateEmail: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
    getDownloadURL: jest.fn(),
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
}));
jest.mock('../../../auth/services/firebaseConfigService', () => ({
    db: {},
}));

const alert = jest.mocked(Alert.alert);
const verifyEmail = jest.mocked(verifyBeforeUpdateEmail);
const getDocument = jest.mocked(doc);
const saveDocument = jest.mocked(setDoc);
const getDownload = jest.mocked(getDownloadURL);
const storage = jest.mocked(getStorage);
const storageRef = jest.mocked(ref);
const upload = jest.mocked(uploadBytes);
const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

const form: ProfileFormSeed = {
    age: 30,
    height: 175,
    gender: 'female',
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: 'moderately_active',
    experienceLevel: 'beginner',
    stressLevel: 'moderate',
    autoAdjustEnabled: true,
};
const original = { ...form };
const identity: ProfileIdentitySeed = { username: ' New name ', email: 'new@example.com' };
const savedIdentity: ProfileIdentitySeed = { username: 'Old name', email: 'old@example.com' };
const userData = { planConfidence: 'calibrated' } as UserData;
const authenticatedUser = {
    uid: 'user-1',
    email: 'old@example.com',
    providerData: [{ providerId: 'password' }],
} as User;
const auth = { currentUser: authenticatedUser } as Auth;

const createParams = (overrides: Partial<Parameters<typeof useProfileSave>[0]> = {}) => ({
    auth,
    isPasswordAccount: false,
    userData,
    form,
    original,
    identity,
    savedIdentity,
    pendingUri: null,
    planChanged: false,
    refreshUserData: jest.fn().mockResolvedValue(userData),
    setOriginal: jest.fn(),
    setIdentity: jest.fn(),
    setSavedIdentity: jest.fn(),
    setPicture: jest.fn(),
    setPendingUri: jest.fn(),
    ...overrides,
});

describe('useProfileSave', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        queryClient.clear();
        getDocument.mockReturnValue({} as ReturnType<typeof doc>);
        saveDocument.mockResolvedValue(undefined);
        verifyEmail.mockResolvedValue(undefined);
        upload.mockResolvedValue({} as Awaited<ReturnType<typeof uploadBytes>>);
        getDownload.mockResolvedValue('https://storage.example/profile.jpg?token=abc');
        storage.mockReturnValue({} as ReturnType<typeof getStorage>);
        storageRef.mockReturnValue({} as ReturnType<typeof ref>);
    });

    it('writes profile identity, refreshes data, and commits the saved form state', async () => {
        queryClient.setQueryData(userProfileQueryKey(authenticatedUser.uid), userData);
        const params = createParams();
        const { result } = renderHook(() => useProfileSave(params), { wrapper });

        await act(async () => {
            await result.current.persist();
        });

        expect(getDocument).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1');
        expect(saveDocument).toHaveBeenCalledWith(expect.anything(), { username: 'New name' }, { merge: true });
        expect(queryClient.getQueryState(userProfileQueryKey(authenticatedUser.uid))?.isInvalidated).toBe(true);
        expect(params.refreshUserData).toHaveBeenCalledTimes(1);
        expect(params.setOriginal).toHaveBeenCalledWith({ ...form });
        expect(params.setIdentity).toHaveBeenCalledWith({ username: 'New name', email: 'new@example.com' });
        expect(params.setSavedIdentity).toHaveBeenCalledWith({ username: 'New name', email: 'new@example.com' });
        expect(params.setPendingUri).toHaveBeenCalledWith(null);
        expect(alert).toHaveBeenCalledWith('Done', 'Profile updated.');
        expect(result.current.saving).toBe(false);
    });

    it('does not save when there is no authenticated user', async () => {
        const { result } = renderHook(() => useProfileSave(createParams({
            auth: { currentUser: null } as Auth,
        })), { wrapper });

        await act(async () => {
            await result.current.persist();
        });

        expect(alert).toHaveBeenCalledWith('Error', 'User not authenticated');
        expect(saveDocument).not.toHaveBeenCalled();
        expect(result.current.saving).toBe(false);
    });

    it('stops after recent-login email verification failures', async () => {
        verifyEmail.mockRejectedValue({ code: 'auth/requires-recent-login' });
        const { result } = renderHook(() => useProfileSave(createParams({ isPasswordAccount: true })), { wrapper });

        await act(async () => {
            await result.current.persist();
        });

        expect(verifyEmail).toHaveBeenCalledWith(authenticatedUser, 'new@example.com');
        expect(alert).toHaveBeenCalledWith(
            'Re-authentication required',
            'Log out and back in, then change your email again.',
        );
        expect(saveDocument).not.toHaveBeenCalled();
        expect(result.current.saving).toBe(false);
    });

    it('keeps the existing profile email while confirmation is pending', async () => {
        const params = createParams({
            isPasswordAccount: true,
            refreshUserData: jest.fn().mockResolvedValue(undefined),
        });
        const { result } = renderHook(() => useProfileSave(params), { wrapper });

        await act(async () => {
            await result.current.persist();
        });

        expect(verifyEmail).toHaveBeenCalledWith(authenticatedUser, 'new@example.com');
        expect(params.setIdentity).toHaveBeenCalledWith({ username: 'New name', email: 'old@example.com' });
        expect(alert).toHaveBeenCalledWith(
            'Saved, but not refreshed',
            'Your changes were saved, but the app could not reload your profile yet. Open the link we sent to new@example.com to change your email.',
        );
        expect(alert).not.toHaveBeenCalledWith('Confirm Your New Email', expect.any(String));
    });

    it('uploads a pending profile picture and stores the versioned URL', async () => {
        const fetchResponse = new Response('image', { headers: { 'Content-Type': 'image/png' } });
        const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(fetchResponse);
        const params = createParams({ pendingUri: 'file://profile.png' });
        const { result } = renderHook(() => useProfileSave(params), { wrapper });

        try {
            await act(async () => {
                await result.current.persist();
            });

            expect(fetchSpy).toHaveBeenCalledWith('file://profile.png');
            expect(storage).toHaveBeenCalledTimes(1);
            expect(storageRef).toHaveBeenCalledWith(expect.anything(), 'profilePictures/user-1.jpg');
            expect(upload).toHaveBeenCalledWith(
                expect.anything(),
                expect.any(Blob),
                { contentType: 'image/png' },
            );
            expect(saveDocument).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ profilePicture: expect.stringMatching(/^https:\/\/storage\.example\/profile\.jpg\?token=abc&v=\d+$/) }),
                { merge: true },
            );
            expect(params.setPicture).toHaveBeenCalledWith(expect.stringMatching(/&v=\d+$/));
        } finally {
            fetchSpy.mockRestore();
        }
    });

    it('reports save failures and clears the busy state', async () => {
        saveDocument.mockRejectedValue(new Error('write failed'));
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useProfileSave(createParams()), { wrapper });

        try {
            await act(async () => {
                await result.current.persist();
            });

            expect(logError).toHaveBeenCalledWith('Profile save error:', expect.any(Error));
            expect(alert).toHaveBeenCalledWith('Error', 'Failed to save. Try again.');
            expect(result.current.saving).toBe(false);
        } finally {
            logError.mockRestore();
        }
    });
});

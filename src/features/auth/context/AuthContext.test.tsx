import React, { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../shared/query/queryClient';
import { userProfileQueryKey } from '../services/userProfileQuery';
import { AuthContext, AuthProvider } from './AuthContext';

type MockUser = {
    uid: string;
    email: string;
    emailVerified: boolean;
    providerData: { providerId: string }[];
};

const mockAuth: { currentUser: MockUser | null } = { currentUser: null };
let mockListener: ((user: MockUser | null) => Promise<void>) | null = null;
let mockNetworkListener: ((state: { isConnected?: boolean; isInternetReachable?: boolean }) => void) | null = null;

jest.mock('firebase/auth', () => ({
    onAuthStateChanged: (_auth: unknown, cb: (user: MockUser | null) => Promise<void>) => {
        mockListener = cb;
        return jest.fn();
    },
    signOut: jest.fn(),
}));

jest.mock('expo-network', () => ({
    addNetworkStateListener: (listener: typeof mockNetworkListener) => {
        mockNetworkListener = listener;
        return { remove: jest.fn() };
    },
}));

const mockGetDoc = jest.fn(async () => ({
    exists: () => true,
    data: () => ({ profileSetupComplete: true, autoAdjustEnabled: true, weeksSinceCutStart: 0 }),
}));
jest.mock('firebase/firestore', () => ({
    doc: () => ({ withConverter: () => ({}) }),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: jest.fn(async () => undefined),
}));

jest.mock('../../../shared/firestore/converters', () => ({ userConverter: {} }));
jest.mock('../services/firebaseConfigService', () => ({
    get auth() {
        return mockAuth;
    },
    db: {},
}));
jest.mock('../services/emailSyncService', () => ({
    syncAuthEmail: async (_uid: string, _email: string | null, data: unknown) => data,
}));
jest.mock('../../nutrition/helpers/learningCompletionService', () => ({ deriveStartWeight: () => null }));
jest.mock('../../nutrition/helpers/useRecentSearches', () => ({ RECENT_SEARCHES_KEY: 'recent' }));
jest.mock('../../workout/services/splitCache', () => ({ SPLITS_CACHE_KEY: 'splits' }));
jest.mock('../../../shared/theme/constants', () => ({ SEARCH: { STORAGE_KEY: 'search' } }));
jest.mock('@react-native-google-signin/google-signin', () => ({ GoogleSignin: { signOut: jest.fn() } }));
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async (key: string) => mockStorage[key] ?? null),
        setItem: jest.fn(async (key: string, value: string) => { mockStorage[key] = value; }),
        multiRemove: jest.fn(async (keys: string[]) => { keys.forEach(k => { delete mockStorage[k]; }); }),
        removeItem: jest.fn(async (key: string) => { delete mockStorage[key]; }),
    },
}));

const unverified: MockUser = { uid: 'u1', email: 'a@b.c', emailVerified: false, providerData: [{ providerId: 'password' }] };
const verified: MockUser = { ...unverified, emailVerified: true };

const renderProvider = () => {
    const seen: { loading: boolean; authenticated: boolean; isOffline: boolean }[] = [];
    const Probe = () => {
        const { loading, authenticated, isOffline } = useContext(AuthContext)!;
        seen.push({ loading, authenticated, isOffline });
        return null;
    };
    render(<QueryClientProvider client={queryClient}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
    return seen;
};

const begin = (user: MockUser | null) => {
    mockAuth.currentUser = user;
    let pending: Promise<void> = Promise.resolve();
    act(() => {
        pending = mockListener!(user);
    });
    return pending;
};

const finish = (pending: Promise<void>) => act(async () => {
    await pending;
});

const emit = async (user: MockUser | null) => finish(begin(user));

describe('AuthProvider loading state', () => {
    beforeEach(() => {
        mockAuth.currentUser = null;
        mockListener = null;
        mockNetworkListener = null;
        queryClient.clear();
        Object.keys(mockStorage).forEach(k => { delete mockStorage[k]; });
        mockGetDoc.mockImplementation(async () => ({
            exists: () => true,
            data: () => ({ profileSetupComplete: true, autoAdjustEnabled: true, weeksSinceCutStart: 0 }),
        }));
    });

    it('does not show the loading state while an unverified account is signed in and straight back out', async () => {
        const seen = renderProvider();
        await emit(null);
        const last = () => seen[seen.length - 1];
        expect(last()).toEqual({ loading: false, authenticated: false, isOffline: false });

        const signedIn = begin(unverified);
        expect(last()!.loading).toBe(false);
        await finish(signedIn);

        const signedOut = begin(null);
        expect(last()!.loading).toBe(false);
        await finish(signedOut);

        expect(last()).toEqual({ loading: false, authenticated: false, isOffline: false });
    });

    it('still loads the profile for a verified account', async () => {
        const seen = renderProvider();
        await emit(null);
        const last = () => seen[seen.length - 1];

        const signedIn = begin(verified);
        expect(last()!.loading).toBe(true);
        await finish(signedIn);

        expect(last()).toEqual({ loading: false, authenticated: true, isOffline: false });
        expect(queryClient.getQueryData(userProfileQueryKey(verified.uid))).toEqual({
            profileSetupComplete: true,
            autoAdjustEnabled: true,
            weeksSinceCutStart: 0,
        });
    });

    it('stops loading when the first event is an unverified account', async () => {
        const seen = renderProvider();

        await emit(unverified);

        expect(seen[seen.length - 1]).toEqual({ loading: false, authenticated: false, isOffline: false });
    });

    it('clears cached user data when the authenticated identity changes', async () => {
        const seen = renderProvider();
        await emit(verified);
        queryClient.setQueryData(['workout-history', verified.uid, 50], { value: 'private data' });
        queryClient.setQueryData(['food-catalog', 'products', 'oats'], { value: 'public data' });

        await emit({ ...verified, uid: 'user-2' });

        expect(queryClient.getQueryData(['workout-history', verified.uid, 50])).toBeUndefined();
        expect(queryClient.getQueryData(userProfileQueryKey(verified.uid))).toBeUndefined();
        expect(queryClient.getQueryData(userProfileQueryKey('user-2'))).toEqual({
            profileSetupComplete: true,
            autoAdjustEnabled: true,
            weeksSinceCutStart: 0,
        });
        expect(queryClient.getQueryData(['food-catalog', 'products', 'oats'])).toEqual({
            value: 'public data',
        });
        expect(seen[seen.length - 1]).toEqual({ loading: false, authenticated: true, isOffline: false });
    });

    it('stays signed in from cache when Firestore is unreachable', async () => {
        mockStorage['user_u1'] = JSON.stringify({ profileSetupComplete: true, targetCalories: 2100 });
        mockGetDoc.mockRejectedValue(Object.assign(new Error('offline'), { code: 'unavailable' }));

        const seen = renderProvider();
        await emit(verified);

        expect(seen[seen.length - 1]).toEqual({ loading: false, authenticated: true, isOffline: true });
        expect(queryClient.getQueryData(userProfileQueryKey(verified.uid))).toEqual({
            profileSetupComplete: true,
            targetCalories: 2100,
        });
    });

    it('refreshes the cached profile when internet connectivity returns', async () => {
        mockStorage['user_u1'] = JSON.stringify({ profileSetupComplete: true, targetCalories: 2100 });
        mockGetDoc.mockRejectedValueOnce(Object.assign(new Error('offline'), { code: 'unavailable' }));

        const seen = renderProvider();
        await emit(verified);
        expect(seen[seen.length - 1]?.isOffline).toBe(true);

        mockGetDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ profileSetupComplete: true, autoAdjustEnabled: true, weeksSinceCutStart: 0 }),
        });
        act(() => mockNetworkListener?.({ isConnected: true, isInternetReachable: true }));

        await waitFor(() => expect(seen[seen.length - 1]).toEqual({
            loading: false,
            authenticated: true,
            isOffline: false,
        }));
        expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('does not authenticate offline when there is no cached profile', async () => {
        mockGetDoc.mockRejectedValue(Object.assign(new Error('offline'), { code: 'unavailable' }));

        const seen = renderProvider();
        await emit(verified);

        expect(seen[seen.length - 1]).toEqual({ loading: false, authenticated: false, isOffline: false });
    });

});

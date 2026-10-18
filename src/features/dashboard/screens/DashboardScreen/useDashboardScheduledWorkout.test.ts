import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { fetchSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
import { getScheduledDay } from '../../../workout/utils/splitSchedule';
import { SPLITS_CACHE_KEY } from '../../../workout/services/splitCache';
import { useDashboardScheduledWorkout } from './useDashboardScheduledWorkout';

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return {
        useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
    };
});
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ currentUser: { uid: 'user-1' } })),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
    },
}));
jest.mock('../../../workout/services/workoutSplitService', () => ({
    fetchSplitsFromFirestore: jest.fn(),
}));
jest.mock('../../../workout/utils/splitSchedule', () => ({
    getScheduledDay: jest.fn(),
}));

const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);
const fetchSplits = jest.mocked(fetchSplitsFromFirestore);
const scheduledDay = jest.mocked(getScheduledDay);

const splits = [
    { id: 'split-a', name: 'A' },
    { id: 'split-b', name: 'B' },
];
const scheduled = {
    templateName: 'Strength Day',
    duration: 55,
    exercises: [{ exerciseName: 'Squat' }, { exerciseName: 'Row' }],
};

describe('useDashboardScheduledWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(getAuth).mockReturnValue({ currentUser: { uid: 'user-1' } } as never);
        getItem.mockResolvedValue(null);
        setItem.mockResolvedValue(undefined);
        fetchSplits.mockResolvedValue(splits);
        scheduledDay.mockReturnValue(scheduled);
    });

    it('uses a fresh split cache without fetching and resolves the selected rotation', async () => {
        getItem.mockResolvedValue(JSON.stringify({ uid: 'user-1', splits, ts: Date.now() }));

        const { result } = renderHook(() => useDashboardScheduledWorkout('split-b', '2026-10-01'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current).toEqual({
            workout: {
                name: 'Strength Day',
                duration: 55,
                exerciseCount: 2,
                exercises: scheduled.exercises,
            },
            loading: false,
            loadError: false,
        });
        expect(scheduledDay).toHaveBeenCalledWith(splits[1], expect.any(Date), '2026-10-01');
        expect(fetchSplits).not.toHaveBeenCalled();
        expect(setItem).not.toHaveBeenCalled();
    });

    it('fetches and caches splits when the cached value has expired', async () => {
        getItem.mockResolvedValue(JSON.stringify({
            uid: 'user-1',
            splits: [{ id: 'stale' }],
            ts: Date.now() - 15 * 60 * 1000 - 1,
        }));

        const { result } = renderHook(() => useDashboardScheduledWorkout(undefined, null));

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(setItem).toHaveBeenCalledWith(
            SPLITS_CACHE_KEY,
            expect.stringContaining('"uid":"user-1"'),
        ));

        expect(fetchSplits).toHaveBeenCalledTimes(1);
        expect(scheduledDay).toHaveBeenCalledWith(splits[0], expect.any(Date), null);
        expect(result.current.loadError).toBe(false);
    });

    it('does not serve a different account the cached split schedule', async () => {
        getAuth.mockReturnValue({ currentUser: { uid: 'user-2' } } as never);
        getItem.mockResolvedValue(JSON.stringify({
            uid: 'user-1',
            splits: [{ id: 'private-split' }],
            ts: Date.now(),
        }));

        const { result } = renderHook(() => useDashboardScheduledWorkout(null, null));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(fetchSplits).toHaveBeenCalledTimes(1);
        expect(scheduledDay).toHaveBeenCalledWith(splits[0], expect.any(Date), null);
    });

    it('falls back to Firestore when the persisted cache is malformed', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        getItem.mockResolvedValue('{invalid json');

        try {
            const { result } = renderHook(() => useDashboardScheduledWorkout(null, null));
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(logError).toHaveBeenCalledWith('Dashboard split cache load failed:', expect.any(SyntaxError));
            expect(fetchSplits).toHaveBeenCalledTimes(1);
            expect(result.current.loadError).toBe(false);
        } finally {
            logError.mockRestore();
        }
    });

    it('exposes the load error and no scheduled workout when Firestore fails', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        fetchSplits.mockRejectedValue(new Error('offline'));

        try {
            const { result } = renderHook(() => useDashboardScheduledWorkout(null, null));
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current).toEqual({ workout: null, loading: false, loadError: true });
            expect(logError).toHaveBeenCalledWith('Dashboard split load failed:', expect.any(Error));
            expect(setItem).not.toHaveBeenCalled();
        } finally {
            logError.mockRestore();
        }
    });

    it('does not update state or write cache after the focus effect is cancelled', async () => {
        let finishFetch: (result: typeof splits) => void = () => {};
        fetchSplits.mockReturnValue(new Promise(resolve => { finishFetch = resolve; }));
        const { result, unmount } = renderHook(() => useDashboardScheduledWorkout(null, null));

        await waitFor(() => expect(fetchSplits).toHaveBeenCalledTimes(1));
        unmount();

        await act(async () => {
            finishFetch(splits);
        });

        expect(result.current).toEqual({ workout: null, loading: true, loadError: false });
        expect(setItem).not.toHaveBeenCalled();
    });
});

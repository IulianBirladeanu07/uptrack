import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
import { getScheduledDay } from '../../../workout/utils/splitSchedule';
import { SPLITS_CACHE_KEY } from '../../../workout/services/splitCache';
import { useDashboardScheduledWorkout } from './useDashboardScheduledWorkout';

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return { useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]) };
});
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
}));
jest.mock('../../../workout/services/workoutSplitService', () => ({ loadSplitsFromFirestore: jest.fn() }));
jest.mock('../../../workout/utils/splitSchedule', () => ({ getScheduledDay: jest.fn() }));

const loadSplits = jest.mocked(loadSplitsFromFirestore);
const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);
const scheduledDay = jest.mocked(getScheduledDay);
const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

const splits = [{ id: 'split-1' }];
const scheduled = { templateName: 'Strength Day', duration: 55, exercises: [{ exerciseName: 'Squat' }] };

describe('useDashboardScheduledWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getItem.mockResolvedValue(null);
        setItem.mockResolvedValue(undefined);
        loadSplits.mockResolvedValue(splits);
        scheduledDay.mockReturnValue(scheduled);
    });

    it('uses the shared split query and refreshes the user-scoped offline cache', async () => {
        const client = createClient();
        const { result } = renderHook(() => useDashboardScheduledWorkout('split-1', '2026-10-01', 'user-1'), {
            wrapper: createWrapper(client),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(setItem).toHaveBeenCalledWith(
            SPLITS_CACHE_KEY,
            expect.stringContaining('"uid":"user-1"'),
        ));
        expect(result.current.workout).toMatchObject({
            name: 'Strength Day',
            duration: 55,
            exerciseCount: 1,
        });
        expect(loadSplits).toHaveBeenCalledWith('user-1');
        client.clear();
    });

    it('keeps a fresh matching local cache visible if the shared query is offline', async () => {
        getItem.mockResolvedValue(JSON.stringify({ uid: 'user-1', splits, ts: Date.now() }));
        loadSplits.mockRejectedValue(new Error('offline'));
        const client = createClient();
        const logError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useDashboardScheduledWorkout(null, null, 'user-1'), {
            wrapper: createWrapper(client),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.workout).toMatchObject({ name: 'Strength Day' });
        expect(result.current.loadError).toBe(false);
        logError.mockRestore();
        client.clear();
    });
});

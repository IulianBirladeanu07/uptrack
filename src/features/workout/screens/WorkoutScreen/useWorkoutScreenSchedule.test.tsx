import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { WorkoutSplit } from '../../types';
import { loadSplitsFromFirestore } from '../../services/workoutSplitService';
import { useWorkoutScreenSchedule } from './useWorkoutScreenSchedule';

jest.mock('../../services/workoutSplitService', () => ({
    loadSplitsFromFirestore: jest.fn(),
}));

const loadSplits = jest.mocked(loadSplitsFromFirestore);

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return { useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]) };
});

const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

describe('useWorkoutScreenSchedule', () => {
    beforeEach(() => jest.clearAllMocks());

    it('derives current and upcoming workouts from the shared split query', async () => {
        const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] ?? 'monday';
        const tomorrowKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][(new Date().getDay() + 1) % 7] ?? 'tuesday';
        const splits: WorkoutSplit[] = [{ id: 'selected', schedule: {
            [todayKey]: { templateName: 'Push', exercises: [{ exerciseName: 'Press' }] },
            [tomorrowKey]: { templateName: 'Pull', exercises: [{ exerciseName: 'Row' }] },
        } }];
        loadSplits.mockResolvedValue(splits);
        const client = createClient();
        const { result } = renderHook(() => useWorkoutScreenSchedule('selected', undefined, 'user-1'), {
            wrapper: createWrapper(client),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.activeSplit).toMatchObject({ schedule: splits[0]?.schedule });
        expect(result.current.todayWorkout).toMatchObject({ name: 'Push' });
        expect(result.current.upcomingWorkouts[0]).toMatchObject({ name: 'Pull' });
        expect(loadSplits).toHaveBeenCalledWith('user-1');
        client.clear();
    });

    it('exposes a retryable failed query when there is no cached split data', async () => {
        const client = createClient();
        loadSplits.mockRejectedValue(new Error('offline'));
        const { result } = renderHook(() => useWorkoutScreenSchedule(undefined, undefined, 'user-1'), {
            wrapper: createWrapper(client),
        });

        await waitFor(() => expect(result.current.loadError).toBe(true));
        expect(result.current.activeSplit).toBeNull();
        expect(result.current.todayWorkout).toBeNull();
        client.clear();
    });
});

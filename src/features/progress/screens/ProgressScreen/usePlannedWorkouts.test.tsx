import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { WorkoutSplit } from '../../../workout/types';
import { loadSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
import { resolvePlannedWorkouts, usePlannedWorkouts } from './usePlannedWorkouts';

jest.mock('../../../workout/services/workoutSplitService', () => ({
    loadSplitsFromFirestore: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return { useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]) };
});

const loadSplits = jest.mocked(loadSplitsFromFirestore);
const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
const createWrapper = (client: QueryClient) => ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

const split = (id: string, workouts: number): WorkoutSplit => ({
    id,
    schedule: Object.fromEntries(Array.from({ length: workouts }, (_, index) => [
        `day-${index + 1}`,
        { exercises: [{ exerciseName: `Exercise ${index + 1}` }] },
    ])),
});

describe('usePlannedWorkouts', () => {
    beforeEach(() => jest.clearAllMocks());

    it('derives the weekly plan from shared uid-scoped split data', async () => {
        loadSplits.mockResolvedValue([split('first', 2), split('active', 4)]);
        const client = createClient();
        const { result } = renderHook(() => usePlannedWorkouts('active', 'user-1'), {
            wrapper: createWrapper(client),
        });

        await waitFor(() => expect(result.current).toBe(4));
        expect(loadSplits).toHaveBeenCalledWith('user-1');
        client.clear();
    });

    it('resolves selected/fallback splits and empty plans', () => {
        const splits = [split('first', 3), split('active', 5)];
        const nestedId = { ...split('', 4), data: { id: 'nested-active' } };

        expect(resolvePlannedWorkouts(splits, 'active')).toBe(5);
        expect(resolvePlannedWorkouts(splits, 'missing')).toBe(3);
        expect(resolvePlannedWorkouts([nestedId], 'nested-active')).toBe(4);
        expect(resolvePlannedWorkouts([], 'active')).toBeNull();
        expect(resolvePlannedWorkouts([split('active', 0)], 'active')).toBeNull();
    });
});

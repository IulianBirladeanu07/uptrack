import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkoutSplit } from '../../../workout/types';
import { fetchSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
import { resolvePlannedWorkouts, usePlannedWorkouts } from './usePlannedWorkouts';

jest.mock('@react-navigation/native', () => {
    const React = require('react');
    return {
        useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
    };
});
jest.mock('../../../workout/services/workoutSplitService', () => ({
    fetchSplitsFromFirestore: jest.fn(),
}));

const fetchSplits = jest.mocked(fetchSplitsFromFirestore);

const split = (id: string, workouts: number): WorkoutSplit => ({
    id,
    schedule: Object.fromEntries(
        Array.from({ length: workouts }, (_, index) => [
            `day-${index + 1}`,
            { exercises: [{ exerciseName: `Exercise ${index + 1}` }] },
        ]),
    ),
});

describe('usePlannedWorkouts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses the active split and falls back to the first split when there is no match', () => {
        const splits = [split('first', 3), split('active', 5)];
        const nestedId = { ...split('', 4), data: { id: 'nested-active' } };

        expect(resolvePlannedWorkouts(splits, 'active')).toBe(5);
        expect(resolvePlannedWorkouts(splits, 'missing')).toBe(3);
        expect(resolvePlannedWorkouts([nestedId], 'nested-active')).toBe(4);
    });

    it('returns null when no splits are available or the selected split has no workouts', () => {
        expect(resolvePlannedWorkouts([], 'active')).toBeNull();
        expect(resolvePlannedWorkouts([split('active', 0)], 'active')).toBeNull();
    });

    it('loads the planned weekly workouts when the screen gains focus', async () => {
        fetchSplits.mockResolvedValue([split('first', 2), split('active', 4)]);

        const { result } = renderHook(() => usePlannedWorkouts('active'));

        await waitFor(() => expect(result.current).toBe(4));
        expect(fetchSplits).toHaveBeenCalledTimes(1);
    });

    it('sets the planned count to null when the focused account has no splits', async () => {
        fetchSplits.mockResolvedValue([]);
        const { result } = renderHook(() => usePlannedWorkouts('active'));

        await waitFor(() => expect(fetchSplits).toHaveBeenCalledTimes(1));
        expect(result.current).toBeNull();
    });

    it('clears the previous split target when a new split fetch fails', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        fetchSplits.mockResolvedValueOnce([split('active', 4)]).mockRejectedValueOnce(new Error('offline'));

        try {
            const { result, rerender } = renderHook(
                ({ activeSplitId }: { activeSplitId: string }) => usePlannedWorkouts(activeSplitId),
                { initialProps: { activeSplitId: 'active' } },
            );
            await waitFor(() => expect(result.current).toBe(4));

            rerender({ activeSplitId: 'other' });
            await waitFor(() => expect(fetchSplits).toHaveBeenCalledTimes(2));
            await waitFor(() => expect(logError).toHaveBeenCalledWith('Progress split load error:', 'offline'));
            expect(result.current).toBeNull();
        } finally {
            logError.mockRestore();
        }
    });

    it('ignores a split response after the focus effect has been cancelled', async () => {
        const finishes: ((splits: WorkoutSplit[]) => void)[] = [];
        fetchSplits.mockImplementation(() => new Promise(resolve => { finishes.push(resolve); }));
        const { result, rerender } = renderHook(
            ({ activeSplitId }: { activeSplitId: string }) => usePlannedWorkouts(activeSplitId),
            { initialProps: { activeSplitId: 'first' } },
        );

        await waitFor(() => expect(fetchSplits).toHaveBeenCalledTimes(1));
        rerender({ activeSplitId: 'second' });
        await waitFor(() => expect(fetchSplits).toHaveBeenCalledTimes(2));

        await act(async () => {
            finishes[0]([split('first', 3)]);
        });
        expect(result.current).toBeNull();

        await act(async () => {
            finishes[1]([split('second', 2)]);
        });
        expect(result.current).toBe(2);
    });
});

import { act, renderHook } from '@testing-library/react-native';
import type { WorkoutSplit } from '../../types';
import { fetchSplitsFromFirestore } from '../../services/workoutSplitService';
import { useWorkoutScreenSchedule } from './useWorkoutScreenSchedule';

jest.mock('../../services/workoutSplitService', () => ({
    fetchSplitsFromFirestore: jest.fn(),
}));

const fetchSplits = fetchSplitsFromFirestore as jest.MockedFunction<typeof fetchSplitsFromFirestore>;

describe('useWorkoutScreenSchedule', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads the active split and derives the current and upcoming workouts', async () => {
        const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        const todayKey = weekdayKeys[today.getDay()];
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const tomorrowKey = weekdayKeys[tomorrow.getDay()];
        const splits: WorkoutSplit[] = [
            {
                id: 'selected',
                schedule: {
                    [todayKey ?? 'monday']: {
                        templateName: 'Push',
                        exercises: [{ exerciseName: 'Press' }],
                    },
                    [tomorrowKey ?? 'tuesday']: {
                        templateName: 'Pull',
                        exercises: [{ exerciseName: 'Row' }],
                    },
                },
            },
            { id: 'other', schedule: {} },
        ];
        fetchSplits.mockResolvedValue(splits);

        const { result } = renderHook(() => useWorkoutScreenSchedule('selected'));
        await act(async () => {
            await result.current.loadActiveSplit();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.activeSplit).toMatchObject({
            schedule: splits[0]?.schedule,
        });
        expect(result.current.todayWorkout).toMatchObject({
            name: 'Push',
            exercises: [{ exerciseName: 'Press' }],
        });
        expect(result.current.upcomingWorkouts[0]).toMatchObject({
            name: 'Pull',
            exercises: [{ exerciseName: 'Row' }],
        });
    });

    it('clears schedule state when no splits are returned', async () => {
        fetchSplits.mockResolvedValue([]);
        const { result } = renderHook(() => useWorkoutScreenSchedule());

        await act(async () => {
            await result.current.loadActiveSplit();
        });

        expect(result.current.activeSplit).toBeNull();
        expect(result.current.todayWorkout).toBeNull();
        expect(result.current.upcomingWorkouts).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('keeps the existing schedule and reports fetch errors', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        fetchSplits.mockRejectedValue(new Error('offline'));
        const { result } = renderHook(() => useWorkoutScreenSchedule());

        await act(async () => {
            await result.current.loadActiveSplit();
        });

        expect(result.current.activeSplit).toBeNull();
        expect(result.current.todayWorkout).toBeNull();
        expect(result.current.upcomingWorkouts).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(consoleError).toHaveBeenCalledWith('Error loading split:', expect.any(Error));
        consoleError.mockRestore();
    });

    it('does not restore the initial loading screen when refetching after the first load', async () => {
        fetchSplits.mockResolvedValue([]);
        const { result } = renderHook(() => useWorkoutScreenSchedule());
        await act(async () => {
            await result.current.loadActiveSplit();
        });

        let resolveFetch: ((splits: WorkoutSplit[]) => void) | undefined;
        fetchSplits.mockReturnValue(new Promise(resolve => {
            resolveFetch = resolve;
        }));
        let pendingLoad: Promise<void> | undefined;
        act(() => {
            pendingLoad = result.current.loadActiveSplit();
        });
        expect(result.current.loading).toBe(false);

        await act(async () => {
            resolveFetch?.([]);
            await pendingLoad;
        });
        expect(result.current.loading).toBe(false);
    });

    it('ignores an older split response after the selected split changes', async () => {
        const firstSplit: WorkoutSplit = {
            id: 'first',
            schedule: {
                [(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] ?? 'monday')]: {
                    templateName: 'First',
                    exercises: [{ exerciseName: 'Press' }],
                },
            },
        };
        const secondSplit: WorkoutSplit = {
            id: 'second',
            schedule: {
                [(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] ?? 'monday')]: {
                    templateName: 'Second',
                    exercises: [{ exerciseName: 'Row' }],
                },
            },
        };
        const pending: ((splits: WorkoutSplit[]) => void)[] = [];
        fetchSplits.mockImplementation(() => new Promise(resolve => { pending.push(resolve); }));

        const { result, rerender } = renderHook(
            ({ activeSplitId }: { activeSplitId: string }) => useWorkoutScreenSchedule(activeSplitId),
            { initialProps: { activeSplitId: 'first' } },
        );
        let firstLoad: Promise<void> | undefined;
        act(() => {
            firstLoad = result.current.loadActiveSplit();
        });

        rerender({ activeSplitId: 'second' });
        let secondLoad: Promise<void> | undefined;
        act(() => {
            secondLoad = result.current.loadActiveSplit();
        });

        await act(async () => {
            pending[1]?.([secondSplit]);
            await secondLoad;
        });
        await act(async () => {
            pending[0]?.([firstSplit]);
            await firstLoad;
        });

        expect(result.current.activeSplit).toMatchObject({
            schedule: secondSplit.schedule,
        });
        expect(result.current.todayWorkout).toMatchObject({ name: 'Second' });
    });
});

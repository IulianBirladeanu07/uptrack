import { act, renderHook } from '@testing-library/react-native';
import { useDashboardWorkoutSummary } from './useDashboardWorkoutSummary';

describe('useDashboardWorkoutSummary', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('recomputes today and weekly summaries across local midnight and the Monday boundary', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 4, 17, 23, 59, 59));
        const workoutHistory = [
            {
                timestamp: { toDate: () => new Date(2026, 4, 17, 22, 0) },
                duration: '40:00',
                exercises: [{}],
            },
            {
                timestamp: { toDate: () => new Date(2026, 4, 18, 0, 2) },
                duration: '25:00',
                exercises: [{}, {}],
            },
        ];
        const { result, unmount } = renderHook(() => useDashboardWorkoutSummary(workoutHistory));

        expect(result.current.weeklyWorkoutsCount).toBe(1);
        expect(result.current.completedToday).toEqual({
            durationLabel: '40 mins',
            exerciseCount: 1,
        });

        act(() => {
            jest.advanceTimersByTime(1100);
        });

        expect(result.current.weeklyWorkoutsCount).toBe(1);
        expect(result.current.completedToday).toEqual({
            durationLabel: '25 mins',
            exerciseCount: 2,
        });
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});

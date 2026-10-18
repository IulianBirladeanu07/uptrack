import { useMemo } from 'react';
import { useLocalDayKey } from '../../../../shared/hooks/useLocalDayKey';
import {
    countWeeklyWorkouts,
    getCompletedToday,
    type DashboardWorkoutHistoryEntry,
} from './dashboardWorkoutSummary';

export const useDashboardWorkoutSummary = (
    workoutHistory: DashboardWorkoutHistoryEntry[] | null | undefined,
) => {
    const localDayKey = useLocalDayKey();

    const weeklyWorkoutsCount = useMemo(
        () => countWeeklyWorkouts(workoutHistory),
        [workoutHistory, localDayKey],
    );
    const completedToday = useMemo(
        () => getCompletedToday(workoutHistory),
        [workoutHistory, localDayKey],
    );

    return { weeklyWorkoutsCount, completedToday };
};

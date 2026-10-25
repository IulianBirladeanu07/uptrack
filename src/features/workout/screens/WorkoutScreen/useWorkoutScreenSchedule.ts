import { useCallback, useMemo } from 'react';
import type { SplitLike } from '../../utils/splitSchedule';
import type { UpcomingWorkout } from './ComingUpCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';
import { buildWorkoutScheduleDisplay } from './workoutScheduleDisplay';
import { selectActiveWorkoutSplit } from './activeWorkoutSplit';
import { useWorkoutSplits } from '../../hooks/useWorkoutSplits';
import { useLocalDayKey } from '../../../../shared/hooks/useLocalDayKey';

type WorkoutScreenScheduleState = {
    activeSplit: SplitLike;
    todayWorkout: WorkoutDisplayData | null;
    upcomingWorkouts: UpcomingWorkout[];
    loading: boolean;
    loadError: boolean;
    loadActiveSplit: () => Promise<void>;
};

export const useWorkoutScreenSchedule = (
    activeSplitId?: string | null,
    rotationStartDate?: unknown,
    uid?: string | null,
): WorkoutScreenScheduleState => {
    const localDayKey = useLocalDayKey();
    const splitsQuery = useWorkoutSplits(uid);

    const activeSplit = useMemo(
        () => selectActiveWorkoutSplit(splitsQuery.data ?? [], activeSplitId),
        [activeSplitId, splitsQuery.data],
    );
    const schedule = useMemo(
        () => activeSplit
            ? buildWorkoutScheduleDisplay(activeSplit, new Date(), rotationStartDate)
            : null,
        [activeSplit, localDayKey, rotationStartDate],
    );
    const loadActiveSplit = useCallback(async () => {
        if (splitsQuery.data === undefined || splitsQuery.isStale) {
            await splitsQuery.refetch();
        }
    }, [splitsQuery.data, splitsQuery.isStale, splitsQuery.refetch]);

    return {
        activeSplit,
        todayWorkout: schedule?.todayWorkout ?? null,
        upcomingWorkouts: schedule?.upcomingWorkouts ?? [],
        loading: splitsQuery.isLoading,
        loadError: splitsQuery.isError && splitsQuery.data === undefined,
        loadActiveSplit,
    };
};

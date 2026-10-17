import { useCallback, useRef, useState } from 'react';
import { fetchSplitsFromFirestore } from '../../services/workoutSplitService';
import type { SplitLike } from '../../utils/splitSchedule';
import { selectActiveWorkoutSplit } from './activeWorkoutSplit';
import type { UpcomingWorkout } from './ComingUpCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';
import { buildWorkoutScheduleDisplay } from './workoutScheduleDisplay';

type WorkoutScreenScheduleState = {
    activeSplit: SplitLike;
    todayWorkout: WorkoutDisplayData | null;
    upcomingWorkouts: UpcomingWorkout[];
    loading: boolean;
    loadActiveSplit: () => Promise<void>;
};

export const useWorkoutScreenSchedule = (
    activeSplitId?: string | null,
    rotationStartDate?: unknown,
): WorkoutScreenScheduleState => {
    const [activeSplit, setActiveSplit] = useState<SplitLike>(null);
    const [todayWorkout, setTodayWorkout] = useState<WorkoutDisplayData | null>(null);
    const [upcomingWorkouts, setUpcomingWorkouts] = useState<UpcomingWorkout[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnceRef = useRef(false);

    const loadActiveSplit = useCallback(async () => {
        try {
            if (!hasLoadedOnceRef.current) {
                setLoading(true);
            }
            const splits = await fetchSplitsFromFirestore();
            if (!splits.length) {
                setActiveSplit(null);
                setTodayWorkout(null);
                setUpcomingWorkouts([]);
                return;
            }

            const selectedSplit = selectActiveWorkoutSplit(splits, activeSplitId);
            if (!selectedSplit) return;
            setActiveSplit(selectedSplit);

            const scheduleDisplay = buildWorkoutScheduleDisplay(
                selectedSplit,
                new Date(),
                rotationStartDate,
            );
            setTodayWorkout(scheduleDisplay.todayWorkout);
            setUpcomingWorkouts(scheduleDisplay.upcomingWorkouts);
        } catch (error) {
            console.error('Error loading split:', error);
        } finally {
            hasLoadedOnceRef.current = true;
            setLoading(false);
        }
    }, [activeSplitId, rotationStartDate]);

    return { activeSplit, todayWorkout, upcomingWorkouts, loading, loadActiveSplit };
};

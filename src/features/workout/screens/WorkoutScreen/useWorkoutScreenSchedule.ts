import { useCallback, useEffect, useRef, useState } from 'react';
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
    const requestGenerationRef = useRef(0);

    const loadActiveSplit = useCallback(async () => {
        const requestGeneration = ++requestGenerationRef.current;
        try {
            if (!hasLoadedOnceRef.current) {
                setLoading(true);
            }
            const splits = await fetchSplitsFromFirestore();
            if (requestGeneration !== requestGenerationRef.current) return;
            if (!splits.length) {
                setActiveSplit(null);
                setTodayWorkout(null);
                setUpcomingWorkouts([]);
                return;
            }

            const selectedSplit = selectActiveWorkoutSplit(splits, activeSplitId);
            if (!selectedSplit) {
                setActiveSplit(null);
                setTodayWorkout(null);
                setUpcomingWorkouts([]);
                return;
            }
            setActiveSplit(selectedSplit);

            const scheduleDisplay = buildWorkoutScheduleDisplay(
                selectedSplit,
                new Date(),
                rotationStartDate,
            );
            setTodayWorkout(scheduleDisplay.todayWorkout);
            setUpcomingWorkouts(scheduleDisplay.upcomingWorkouts);
        } catch (error) {
            if (requestGeneration === requestGenerationRef.current) {
                console.error('Error loading split:', error);
            }
        } finally {
            if (requestGeneration === requestGenerationRef.current) {
                hasLoadedOnceRef.current = true;
                setLoading(false);
            }
        }
    }, [activeSplitId, rotationStartDate]);

    useEffect(() => () => {
        requestGenerationRef.current++;
    }, []);

    return { activeSplit, todayWorkout, upcomingWorkouts, loading, loadActiveSplit };
};

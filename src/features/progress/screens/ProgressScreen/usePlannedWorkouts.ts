import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
import { getWorkoutsPerWeek } from '../../../workout/utils/splitSchedule';
import type { SplitLike } from '../../../workout/utils/splitSchedule';
import type { WorkoutSplit } from '../../../workout/types';

const getSplitId = (split: WorkoutSplit): string | undefined =>
    split.id ?? (split.data as { id?: string } | undefined)?.id;

export const resolvePlannedWorkouts = (
    splits: WorkoutSplit[],
    activeSplitId: string | null | undefined,
): number | null => {
    if (!splits.length) return null;
    const activeSplit = splits.find(split => getSplitId(split) === activeSplitId) ?? splits[0];
    return getWorkoutsPerWeek(activeSplit as SplitLike) || null;
};

export const usePlannedWorkouts = (activeSplitId: string | null | undefined): number | null => {
    const [planned, setPlanned] = useState<number | null>(null);
    const previousSplitId = useRef(activeSplitId);

    useFocusEffect(
        useCallback(() => {
            let focused = true;
            if (previousSplitId.current !== activeSplitId) {
                previousSplitId.current = activeSplitId;
                setPlanned(null);
            }
            const loadPlannedWorkouts = async () => {
                try {
                    const splits = await fetchSplitsFromFirestore();
                    if (focused) setPlanned(resolvePlannedWorkouts(splits, activeSplitId));
                } catch (error) {
                    console.error('Progress split load error:', (error as Error).message);
                }
            };

            void loadPlannedWorkouts();
            return () => {
                focused = false;
            };
        }, [activeSplitId]),
    );

    return planned;
};

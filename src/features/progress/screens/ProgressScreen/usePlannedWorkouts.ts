import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { WorkoutSplit } from '../../../workout/types';
import { useWorkoutSplits } from '../../../workout/hooks/useWorkoutSplits';
import { getWorkoutsPerWeek } from '../../../workout/utils/splitSchedule';
import type { SplitLike } from '../../../workout/utils/splitSchedule';

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

export const usePlannedWorkouts = (
    activeSplitId: string | null | undefined,
    uid: string | null | undefined,
): number | null => {
    const [focused, setFocused] = useState(false);
    const splitsQuery = useWorkoutSplits(uid, focused);

    useFocusEffect(
        useCallback(() => {
            setFocused(true);
            return () => setFocused(false);
        }, []),
    );

    useEffect(() => {
        if (splitsQuery.error) {
            console.error('Progress split load error:', (splitsQuery.error as Error).message);
        }
    }, [splitsQuery.error]);

    return resolvePlannedWorkouts(splitsQuery.data ?? [], activeSplitId);
};

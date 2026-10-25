import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSplit } from '../../../workout/types';
import { useWorkoutSplits } from '../../../workout/hooks/useWorkoutSplits';
import { SPLITS_CACHE_KEY } from '../../../workout/services/splitCache';
import { getScheduledDay } from '../../../workout/utils/splitSchedule';
import type { SplitLike } from '../../../workout/utils/splitSchedule';
import { useLocalDayKey } from '../../../../shared/hooks/useLocalDayKey';

const SPLITS_CACHE_TTL = 15 * 60 * 1000;

export type ScheduledWorkout = {
    name: string;
    duration: number;
    exerciseCount: number;
    exercises: unknown[];
};

export const resolveWorkoutFromSplits = (
    splits: WorkoutSplit[],
    activeSplitId: string | null | undefined,
    rotationStartDate: unknown,
): ScheduledWorkout | null => {
    if (!splits?.length) return null;
    const activeSplit = (activeSplitId && splits.find(split => split.id === activeSplitId)) || splits[0];
    const workout = getScheduledDay(activeSplit as SplitLike, new Date(), rotationStartDate);
    const exercises = workout?.exercises || [];
    return exercises.length > 0 ? {
        name: (workout?.['templateName'] as string | undefined) || 'Workout',
        duration: (workout?.['duration'] as number | undefined) || 45,
        exerciseCount: exercises.length,
        exercises,
    } : null;
};

export const useDashboardScheduledWorkout = (
    activeSplitId: string | null | undefined,
    rotationStartDate: unknown,
    uid: string | null | undefined,
) => {
    const localDayKey = useLocalDayKey();
    const [focused, setFocused] = useState(false);
    const [cachedSplits, setCachedSplits] = useState<{ uid: string; splits: WorkoutSplit[] } | null>(null);
    const [cacheLoaded, setCacheLoaded] = useState(false);
    const splitsQuery = useWorkoutSplits(uid, focused);

    useFocusEffect(
        useCallback(() => {
            setFocused(true);
            return () => setFocused(false);
        }, []),
    );

    useEffect(() => {
        let cancelled = false;
        setCacheLoaded(false);
        if (!uid) {
            setCachedSplits(null);
            setCacheLoaded(true);
            return;
        }
        AsyncStorage.getItem(SPLITS_CACHE_KEY)
            .then(raw => {
                if (!raw) return;
                const cached = JSON.parse(raw) as { uid?: string; splits?: WorkoutSplit[]; ts?: number };
                if (cached.uid === uid && Array.isArray(cached.splits) && typeof cached.ts === 'number'
                    && Date.now() - cached.ts < SPLITS_CACHE_TTL && !cancelled) {
                    setCachedSplits({ uid, splits: cached.splits });
                }
            })
            .catch(error => console.error('Dashboard split cache load failed:', error))
            .finally(() => {
                if (!cancelled) setCacheLoaded(true);
            });
        return () => { cancelled = true; };
    }, [uid]);

    useEffect(() => {
        if (!uid || !splitsQuery.data) return;
        setCachedSplits({ uid, splits: splitsQuery.data });
        AsyncStorage.setItem(SPLITS_CACHE_KEY, JSON.stringify({
            uid,
            splits: splitsQuery.data,
            ts: Date.now(),
        })).catch(error => console.error('Dashboard split cache save failed:', error));
    }, [splitsQuery.data, uid]);

    const splits = splitsQuery.data ?? (cachedSplits && cachedSplits.uid === uid ? cachedSplits.splits : undefined);
    const workout = useMemo(
        () => splits ? resolveWorkoutFromSplits(splits, activeSplitId, rotationStartDate) : null,
        [activeSplitId, localDayKey, rotationStartDate, splits],
    );
    const loadWorkout = useCallback(async () => {
        if (splitsQuery.data === undefined || splitsQuery.isStale) await splitsQuery.refetch();
    }, [splitsQuery.data, splitsQuery.isStale, splitsQuery.refetch]);
    const loading = Boolean(uid) && splits === undefined && (!cacheLoaded || splitsQuery.isLoading);
    const loadError = Boolean(uid) && splitsQuery.isError && splits === undefined;

    useEffect(() => {
        if (loadError) console.error('Dashboard split load failed:', splitsQuery.error);
    }, [loadError, splitsQuery.error]);

    return { workout, loading, loadError, refreshing: splitsQuery.isRefetching, loadWorkout };
};

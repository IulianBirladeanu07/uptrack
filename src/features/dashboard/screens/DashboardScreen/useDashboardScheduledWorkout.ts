import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSplit } from '../../../workout/types';
import { fetchSplitsFromFirestore } from '../../../workout/services/workoutSplitService';
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
) => {
    const localDayKey = useLocalDayKey();
    const [workout, setWorkout] = useState<ScheduledWorkout | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            setLoading(true);
            setLoadError(false);

            const loadWorkout = async () => {
                try {
                    const cached = await AsyncStorage.getItem(SPLITS_CACHE_KEY);
                    if (cached) {
                        const { splits, ts } = JSON.parse(cached) as { splits: WorkoutSplit[]; ts: number };
                        if (Date.now() - ts < SPLITS_CACHE_TTL) {
                            if (!cancelled) {
                                setWorkout(resolveWorkoutFromSplits(splits, activeSplitId, rotationStartDate));
                                setLoading(false);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Dashboard split cache load failed:', error);
                }

                try {
                    const splits = await fetchSplitsFromFirestore();
                    if (!cancelled) {
                        setWorkout(resolveWorkoutFromSplits(splits, activeSplitId, rotationStartDate));
                        setLoadError(false);
                        AsyncStorage.setItem(SPLITS_CACHE_KEY, JSON.stringify({ splits, ts: Date.now() }))
                            .catch(error => console.error('Dashboard split cache save failed:', error));
                    }
                } catch (error) {
                    console.error('Dashboard split load failed:', error);
                    if (!cancelled) {
                        setWorkout(null);
                        setLoadError(true);
                    }
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };

            loadWorkout();
            return () => { cancelled = true; };
        }, [activeSplitId, rotationStartDate, localDayKey]),
    );

    return { workout, loading, loadError };
};

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeNotice } from '../../../../shared/types';
import { parseDismissedAdjustmentTimestamps } from '../../../profile/utils/homeDismissalStorage';

export const useHomeNoticeDismissals = (uid: string | undefined) => {
    const [dismissedAdjustments, setDismissedAdjustments] = useState<string[]>([]);
    const [goalReachedDismissed, setGoalReachedDismissed] = useState(false);
    const [stepsPermissionDismissedAt, setStepsPermissionDismissedAt] = useState<string | null>(null);
    const [noticesLoaded, setNoticesLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setNoticesLoaded(false);
        setDismissedAdjustments([]);
        setGoalReachedDismissed(false);
        setStepsPermissionDismissedAt(null);
        if (!uid) {
            setNoticesLoaded(true);
            return () => { cancelled = true; };
        }
        const loadDismissalState = async () => {
            try {
                const [adjRaw, goalRaw, stepsRaw] = await Promise.all([
                    AsyncStorage.getItem(`home_dismissed_adjustments_${uid}`),
                    AsyncStorage.getItem(`home_goal_reached_dismissed_${uid}`),
                    AsyncStorage.getItem(`home_steps_permission_dismissed_${uid}`),
                ]);
                if (cancelled) return;
                const adjustmentTimestamps = parseDismissedAdjustmentTimestamps(adjRaw);
                if (adjustmentTimestamps === null) {
                    console.error('Invalid persisted home adjustment dismissals.');
                } else {
                    setDismissedAdjustments(adjustmentTimestamps);
                }
                setGoalReachedDismissed(goalRaw === 'true');
                setStepsPermissionDismissedAt(stepsRaw || null);
            } catch (error) {
                console.error('loadDismissalState error:', error);
            } finally {
                if (!cancelled) setNoticesLoaded(true);
            }
        };
        loadDismissalState();
        return () => { cancelled = true; };
    }, [uid]);

    const dismissNotice = useCallback(async (notice: HomeNotice) => {
        if (!uid) return;
        try {
            if (notice.type === 'calorie_adjustment') {
                const updated = [...dismissedAdjustments, notice.dismissKey!];
                setDismissedAdjustments(updated);
                await AsyncStorage.setItem(`home_dismissed_adjustments_${uid}`, JSON.stringify(updated));
            } else if (notice.type === 'goal_reached') {
                setGoalReachedDismissed(true);
                await AsyncStorage.setItem(`home_goal_reached_dismissed_${uid}`, 'true');
            } else if (notice.type === 'steps_permission') {
                const now = new Date().toISOString();
                setStepsPermissionDismissedAt(now);
                await AsyncStorage.setItem(`home_steps_permission_dismissed_${uid}`, now);
            }
        } catch (error) {
            console.error('handleDismissNotice error:', error);
        }
    }, [uid, dismissedAdjustments]);

    return {
        dismissedAdjustments,
        goalReachedDismissed,
        stepsPermissionDismissedAt,
        noticesLoaded,
        dismissNotice,
    };
};

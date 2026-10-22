import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Platform } from 'react-native';
import type { DailySteps } from '../../types';
import { formatLocalDateKey } from '../../utils/localDateKey';
import type { StepsAccess } from '../../services/healthConnectSteps';

type HealthKit = typeof import('react-native-health').default;
type HealthConnect = typeof import('../../services/healthConnectSteps');

type Backend =
    | { kind: 'ios'; kit: HealthKit }
    | { kind: 'android'; hc: HealthConnect };

export type StepDisplayHandle = {
    retry: () => void;
};

export type StepDisplayProps = {
    onStepsUpdate?: (steps: number, dateKey: string) => void;
    onStepsHistory?: (entries: DailySteps) => void;
    onStepsError?: (errorCode: string) => void;
    onStepsLoading?: (isLoading: boolean) => void;
    onConnectedChange?: (connected: boolean) => void;
};

const backend: Backend = Platform.OS === 'ios'
    ? { kind: 'ios', kit: require('react-native-health').default }
    : { kind: 'android', hc: require('../../services/healthConnectSteps') };

const ACCESS_ERRORS: Record<Exclude<StepsAccess, 'ready'>, string> = {
    unavailable: 'health_connect_unavailable',
    update_required: 'health_connect_update_required',
    permission_denied: 'permission_denied',
};

const STEPS_LOOKBACK_DAYS = 30;
const ROLLOVER_LOOKBACK_DAYS = 3;

const StepDisplay = forwardRef<StepDisplayHandle, StepDisplayProps>(({ onStepsUpdate, onStepsHistory, onStepsError, onStepsLoading, onConnectedChange }, ref) => {
    const [initialized, setInitialized] = useState(false);
    const initializingRef = useRef(false);
    const lastDayKeyRef = useRef<string | null>(null);

    const initializeHealthKit = (kit: HealthKit) => {
        return new Promise<void>((resolve, reject) => {
            const permissions = {
                permissions: {
                    read: [kit.Constants.Permissions.Steps],
                    write: [],
                },
            };
            kit.initHealthKit(permissions, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    };

    const fetchTodaySteps = async (): Promise<number | null> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        if (backend.kind === 'ios') {
            const { kit } = backend;
            return new Promise((resolve) => {
                kit.getStepCount(
                    { startDate: today.toISOString() },
                    (err, results) => resolve(err ? null : (results.value || 0))
                );
            });
        }

        try {
            const byDate = await backend.hc.readDailySteps(today, now);
            return byDate[formatLocalDateKey(today)] ?? null;
        } catch (err) {
            console.log('[Steps] fetchToday error:', err);
            return null;
        }
    };

    const fetchRecentSteps = async (days: number): Promise<void> => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        const entries: DailySteps = {};

        if (backend.kind === 'ios') {
            const { kit } = backend;
            return new Promise<void>((resolve) => {
                kit.getDailyStepCountSamples(
                    { startDate: startDate.toISOString(), endDate: now.toISOString() },
                    (err, results) => {
                        if (!err && results) {
                            results.forEach(day => {
                                const key = formatLocalDateKey(new Date(day.startDate));
                                entries[key] = Math.max(entries[key] || 0, day.value || 0);
                            });
                            Object.entries(entries).forEach(([key, value]) => onStepsUpdate?.(value, key));
                            onStepsHistory?.(entries);
                        }
                        resolve();
                    }
                );
            });
        }

        try {
            const byDate = await backend.hc.readDailySteps(startDate, now);
            Object.entries(byDate).forEach(([dateKey, totalSteps]) => {
                entries[dateKey] = totalSteps;
                onStepsUpdate?.(totalSteps, dateKey);
            });
            onStepsHistory?.(entries);
        } catch (err) {
            console.log('[Steps] fetchRecent error:', err);
            onStepsError?.('steps_unavailable');
        }
    };

    const updateTodaySteps = async () => {
        const todayKey = formatLocalDateKey(new Date());
        if (lastDayKeyRef.current && lastDayKeyRef.current !== todayKey) {
            lastDayKeyRef.current = todayKey;
            await fetchRecentSteps(ROLLOVER_LOOKBACK_DAYS);
        }
        const steps = await fetchTodaySteps();
        if (steps === null) return;
        if (onStepsUpdate) onStepsUpdate(steps, todayKey);
    };

    const initialize = async (userInitiated = false) => {
        if (initializingRef.current || initialized) return;
        initializingRef.current = true;
        onStepsLoading?.(true);
        try {
            if (backend.kind === 'ios') {
                await initializeHealthKit(backend.kit);
            } else {
                const access = await backend.hc.ensureStepsAccess({ request: userInitiated });
                if (access !== 'ready') {
                    onStepsError?.(ACCESS_ERRORS[access]);
                    onConnectedChange?.(false);
                    if (userInitiated) backend.hc.openAccessHelp(access);
                    throw new Error(`Health Connect ${access}`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchRecentSteps(STEPS_LOOKBACK_DAYS);
            lastDayKeyRef.current = formatLocalDateKey(new Date());
            await updateTodaySteps();
            setInitialized(true);
            onConnectedChange?.(true);
        } catch (err) {
            console.log('[Steps] initialize failed:', err instanceof Error ? err.message : err);
            onConnectedChange?.(false);
        } finally {
            initializingRef.current = false;
            onStepsLoading?.(false);
        }
    };

    useImperativeHandle(ref, () => ({ retry: () => { initialize(true); } }));

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (!initialized) return;
        const interval = setInterval(updateTodaySteps, 60000);
        return () => clearInterval(interval);
    }, [initialized]);

    return null;
});

export default StepDisplay;

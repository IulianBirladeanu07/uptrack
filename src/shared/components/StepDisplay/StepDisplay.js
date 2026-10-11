import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Platform } from 'react-native';

let AppleHealthKit, HealthConnectSteps;

if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
} else {
    HealthConnectSteps = require('../../services/healthConnectSteps');
}

const ACCESS_ERRORS = {
    unavailable: 'health_connect_unavailable',
    update_required: 'health_connect_update_required',
    permission_denied: 'permission_denied',
};

const STEPS_LOOKBACK_DAYS = 30;
const ROLLOVER_LOOKBACK_DAYS = 3;

const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const StepDisplay = forwardRef(({ onStepsUpdate, onStepsHistory, onStepsError, onStepsLoading, onConnectedChange }, ref) => {
    const [initialized, setInitialized] = useState(false);
    const initializingRef = useRef(false);
    const lastDayKeyRef = useRef(null);

    const initializeHealthKit = () => {
        return new Promise((resolve, reject) => {
            const permissions = {
                permissions: {
                    read: [AppleHealthKit.Constants.Permissions.Steps],
                },
            };
            AppleHealthKit.initHealthKit(permissions, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    };

    const fetchTodaySteps = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        if (Platform.OS === 'ios') {
            return new Promise((resolve) => {
                AppleHealthKit.getStepCount(
                    { startDate: today.toISOString() },
                    (err, results) => resolve(err ? null : (results.value || 0))
                );
            });
        }

        try {
            const byDate = await HealthConnectSteps.readDailySteps(today, now);
            return byDate[formatDate(today)] ?? null;
        } catch (err) {
            console.log('[Steps] fetchToday error:', err);
            return null;
        }
    };

    const fetchRecentSteps = async (days) => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        const entries = {};

        if (Platform.OS === 'ios') {
            return new Promise((resolve) => {
                AppleHealthKit.getDailyStepCountSamples(
                    { startDate: startDate.toISOString(), endDate: now.toISOString() },
                    (err, results) => {
                        if (!err && results) {
                            results.forEach(day => {
                                const key = formatDate(new Date(day.startDate));
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
            const byDate = await HealthConnectSteps.readDailySteps(startDate, now);
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
        const todayKey = formatDate(new Date());
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
            if (Platform.OS === 'ios') {
                await initializeHealthKit();
            } else {
                const access = await HealthConnectSteps.ensureStepsAccess();
                if (access !== 'ready') {
                    onStepsError?.(ACCESS_ERRORS[access]);
                    onConnectedChange?.(false);
                    if (userInitiated) HealthConnectSteps.openAccessHelp(access);
                    throw new Error(`Health Connect ${access}`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchRecentSteps(STEPS_LOOKBACK_DAYS);
            lastDayKeyRef.current = formatDate(new Date());
            await updateTodaySteps();
            setInitialized(true);
            onConnectedChange?.(true);
        } catch (err) {
            console.log('[Steps] initialize failed:', err?.message || err);
            onConnectedChange?.(false);
        } finally {
            initializingRef.current = false;
            onStepsLoading?.(false);
        }
    };

    useImperativeHandle(ref, () => ({ retry: () => initialize(true) }));

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
import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

let AppleHealthKit, GoogleFit, Scopes;

if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
} else {
    GoogleFit = require('react-native-google-fit').default;
    Scopes = require('react-native-google-fit').Scopes;
}

const PREFERRED_SOURCES = [
    'com.google.android.gms:estimated_steps',
    'com.google.android.gms:merge_step_deltas',
    'derived:com.google.step_count.delta',
];

const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getLocalISOString = (date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
};

const getStepsForDate = (result, dateKey) => {
    for (const sourceName of PREFERRED_SOURCES) {
        const source = result.find(d => d.source === sourceName);
        const entry = source?.steps?.find(s => s.date === dateKey);
        if (entry) return entry.value || 0;
    }
    let best = null;
    result.forEach(source => {
        const entry = source.steps?.find(s => s.date === dateKey);
        if (entry && (best === null || (entry.value || 0) > best)) best = entry.value || 0;
    });
    return best;
};

const mergeStepsAcrossSources = (result) => {
    const byDate = new Map();
    if (!result?.length) return byDate;
    const dateKeys = new Set();
    result.forEach(source => (source.steps || []).forEach(s => dateKeys.add(s.date)));
    dateKeys.forEach(dateKey => {
        const value = getStepsForDate(result, dateKey);
        if (value !== null) byDate.set(dateKey, value);
    });
    return byDate;
};

const GoogleFitStepDisplay = forwardRef(({ onStepsUpdate, onStepsError, onStepsLoading, onConnectedChange }, ref) => {
    const [initialized, setInitialized] = useState(false);
    const initializingRef = useRef(false);

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

    const requestAndroidPermission = async () => {
        if (Platform.OS !== 'android') return true;
        try {
            if (Platform.Version >= 29) {
                const checkResult = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
                );
                if (checkResult) return true;
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
                    {
                        title: 'Step Counter Permission',
                        message: 'This app needs access to your physical activity to count steps.',
                        buttonPositive: 'Allow',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        } catch (err) {
            console.log('[Steps] permission error:', err);
            return false;
        }
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
            const result = await GoogleFit.getDailyStepCountSamples({
                startDate: getLocalISOString(today),
                endDate: getLocalISOString(now),
            });
            const todayKey = formatDate(today);
            return getStepsForDate(result, todayKey);
        } catch (err) {
            console.log('[Steps] fetchToday error:', err);
            return null;
        }
    };

    const fetchLast7DaysSteps = async () => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        if (Platform.OS === 'ios') {
            return new Promise((resolve) => {
                AppleHealthKit.getDailyStepCountSamples(
                    { startDate: startDate.toISOString(), endDate: now.toISOString() },
                    (err, results) => {
                        if (!err && results && onStepsUpdate) {
                            results.forEach(day => {
                                onStepsUpdate(day.value || 0, formatDate(new Date(day.startDate)));
                            });
                        }
                        resolve();
                    }
                );
            });
        }

        try {
            const stepsData = await GoogleFit.getDailyStepCountSamples({
                startDate: getLocalISOString(startDate),
                endDate: getLocalISOString(now),
            });
            if (onStepsUpdate) {
                const byDate = mergeStepsAcrossSources(stepsData);
                byDate.forEach((totalSteps, dateKey) => onStepsUpdate(totalSteps, dateKey));
            }
        } catch (err) {
            console.log('[Steps] fetchLast7Days error:', err);
            onStepsError?.('steps_unavailable');
        }
    };

    const updateTodaySteps = async () => {
        const steps = await fetchTodaySteps();
        if (steps === null) return;
        const todayKey = formatDate(new Date());
        if (onStepsUpdate) onStepsUpdate(steps, todayKey);
    };

    const initialize = async () => {
        if (initializingRef.current || initialized) return;
        initializingRef.current = true;
        onStepsLoading?.(true);
        try {
            if (Platform.OS === 'ios') {
                await initializeHealthKit();
            } else {
                const permissionGranted = await requestAndroidPermission();
                if (!permissionGranted) {
                    onStepsError?.('permission_denied');
                    onConnectedChange?.(false);
                    throw new Error('Permission denied');
                }

                const options = {
                    scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_BODY_READ],
                };
                const authResult = await GoogleFit.authorize(options);
                if (!authResult.success) {
                    onStepsError?.('auth_failed');
                    onConnectedChange?.(false);
                    throw new Error('Authorization failed');
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchLast7DaysSteps();
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

    useImperativeHandle(ref, () => ({ retry: initialize }));

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

export default GoogleFitStepDisplay;
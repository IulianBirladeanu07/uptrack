import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let AppleHealthKit, GoogleFit, Scopes;

if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
} else {
    GoogleFit = require('react-native-google-fit').default;
    Scopes = require('react-native-google-fit').Scopes;
}

const GOOGLE_FIT_AUTH_KEY = 'google_fit_authorized';

const GoogleFitStepDisplay = ({ onStepsUpdate, onStepsError, onStepsLoading }) => {
    const [initialized, setInitialized] = useState(false);
    const initializingRef = useRef(false);

    const formatDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

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

    const initializeHealthKit = () => {
        return new Promise((resolve, reject) => {
            const permissions = {
                permissions: {
                    read: [AppleHealthKit.Constants.Permissions.Steps],
                },
            };
            AppleHealthKit.initHealthKit(permissions, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    };

    const requestAndroidPermission = async () => {
        if (Platform.OS === 'android') {
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
        }
        return true;
    };

    const fetchTodaySteps = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const now = new Date();

        if (Platform.OS === 'ios') {
            return new Promise((resolve) => {
                AppleHealthKit.getStepCount(
                    { startDate: today.toISOString() },
                    (err, results) => {
                        if (err) resolve(0);
                        else resolve(results.value || 0);
                    }
                );
            });
        } else {
            try {
                const result = await GoogleFit.getDailyStepCountSamples({
                    startDate: getLocalISOString(today),
                    endDate: getLocalISOString(now),
                });

                if (!result?.length) return 0;

                const preferredSources = [
                    'com.google.android.gms:estimated_steps',
                    'com.google.android.gms:merge_step_deltas',
                    'derived:com.google.step_count.delta'
                ];

                for (const sourceName of preferredSources) {
                    const source = result.find(d => d.source === sourceName);
                    if (source?.steps?.length > 0) {
                        return source.steps.reduce((sum, s) => sum + s.value, 0);
                    }
                }

                const fallback = result.find(d => d.steps?.length > 0);
                return fallback?.steps.reduce((sum, s) => sum + s.value, 0) || 0;
            } catch (err) {
                console.log('[Steps] fetchToday error:', err);
                return 0;
            }
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
                    {
                        startDate: startDate.toISOString(),
                        endDate: now.toISOString(),
                    },
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
        } else {
            try {
                const stepsData = await GoogleFit.getDailyStepCountSamples({
                    startDate: getLocalISOString(startDate),
                    endDate: getLocalISOString(now),
                });

                if (stepsData && onStepsUpdate) {
                    const source = stepsData.find(d => d.source === 'com.google.android.gms:estimated_steps') || stepsData[0];
                    if (source?.steps) {
                        source.steps.forEach(step => {
                            onStepsUpdate(step.value || 0, formatDate(new Date(step.date)));
                        });
                    }
                }
            } catch (err) {
                console.log('[Steps] fetchLast7Days error:', err);
                onStepsError?.('steps_unavailable');
            }
        }
    };

    const updateTodaySteps = async () => {
        const steps = await fetchTodaySteps();
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
                console.log('[Steps] permission granted:', permissionGranted);
                if (!permissionGranted) {
                    onStepsError?.('permission_denied');
                    throw new Error('Permission denied');
                }

                const options = {
                    scopes: [
                        Scopes.FITNESS_ACTIVITY_READ,
                        Scopes.FITNESS_BODY_READ,
                    ],
                };
                const authResult = await GoogleFit.authorize(options);
                console.log('[Steps] auth result:', JSON.stringify(authResult));
                if (!authResult.success) {
                    onStepsError?.('auth_failed');
                    throw new Error('Authorization failed');
                }
                await AsyncStorage.setItem(GOOGLE_FIT_AUTH_KEY, 'true');
            }
            console.log('[Steps] starting fetch');
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchLast7DaysSteps();
            await updateTodaySteps();
            setInitialized(true);
            console.log('[Steps] initialize complete');
        } catch (err) {
            console.log('[Steps] initialize failed:', err?.message || err);
        } finally {
            initializingRef.current = false;
            onStepsLoading?.(false);
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (!initialized) return;
        const interval = setInterval(updateTodaySteps, 60000);
        return () => clearInterval(interval);
    }, [initialized]);

    return null;
};

export default GoogleFitStepDisplay;
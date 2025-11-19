import React, { useState, useEffect, useRef } from 'react';
import { Text, Platform, PermissionsAndroid, View, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import platform-specific health libraries
let AppleHealthKit, GoogleFit, Scopes;

if (Platform.OS === 'ios') {
  AppleHealthKit = require('react-native-health').default;
} else {
  GoogleFit = require('react-native-google-fit').default;
  Scopes = require('react-native-google-fit').Scopes;
}

const GoogleFitStepDisplay = ({ metricValueStyle, metricLabelStyle, stepGoal = 10000 }) => {
  const [steps, setSteps] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'reconnecting', 'offline'
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState(null);
  const lastFetchRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reconnectAnim = useRef(new Animated.Value(0)).current;
  
  const CACHE_KEY = 'UNIVERSAL_STEPS_CACHE';
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Pulse animation for loading state
  useEffect(() => {
    if (loading || connectionStatus === 'reconnecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading, connectionStatus]);

  // Reconnect animation
  useEffect(() => {
    if (connectionStatus === 'reconnecting') {
      const reconnect = Animated.loop(
        Animated.timing(reconnectAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      reconnect.start();
      return () => {
        reconnect.stop();
        reconnectAnim.setValue(0);
      };
    }
  }, [connectionStatus]);

  // Get the start of day
  const getStartOfDay = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Load cached steps
  const loadCachedSteps = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { steps: cachedSteps, timestamp, date } = JSON.parse(cachedData);
        const now = Date.now();
        const currentDate = formatDate(new Date());
        
        if (now - timestamp < CACHE_EXPIRY && date === currentDate) {
          console.log('Using cached step data');
          setSteps(cachedSteps);
          lastFetchRef.current = timestamp;
          setLastSuccessfulFetch(new Date(timestamp));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error loading cached steps:', err);
      return false;
    }
  };

  // Save steps to cache
  const saveStepsToCache = async (stepsValue) => {
    try {
      const cacheData = {
        steps: stepsValue,
        timestamp: Date.now(),
        date: formatDate(new Date())
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setLastSuccessfulFetch(new Date());
    } catch (err) {
      console.error('Error saving steps to cache:', err);
    }
  };

  // Handle connection errors gracefully
  const handleConnectionError = (error, source = 'unknown') => {
    console.error(`Connection error from ${source}:`, error);
    
    // Don't show error to user, just update connection status
    if (retryCount < MAX_RETRIES) {
      setConnectionStatus('reconnecting');
      setRetryCount(prev => prev + 1);
      
      // Retry after delay
      setTimeout(() => {
        initialize();
      }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
    } else {
      setConnectionStatus('offline');
      setLoading(false);
      // Keep showing last known steps or 0
    }
  };

  // iOS HealthKit implementation
  const initializeHealthKit = async () => {
    try {
      console.log('Initializing HealthKit...');
      
      const permissions = {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.Steps],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          handleConnectionError(error, 'HealthKit');
          return;
        }

        console.log('HealthKit initialized successfully');
        setConnectionStatus('connected');
        setTimeout(() => {
          fetchiOSSteps();
        }, 500);
      });
    } catch (err) {
      handleConnectionError(err, 'HealthKit init');
    }
  };

  // Fetch steps from iOS HealthKit
  const fetchiOSSteps = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && await loadCachedSteps()) {
        setLoading(false);
        setConnectionStatus('connected');
        return;
      }

      const startDate = getStartOfDay();
      const endDate = new Date();

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          handleConnectionError(error, 'iOS steps fetch');
          return;
        }

        const totalSteps = results.value || 0;
        setSteps(totalSteps);
        saveStepsToCache(totalSteps);
        lastFetchRef.current = Date.now();
        setConnectionStatus('connected');
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
      });
    } catch (err) {
      handleConnectionError(err, 'iOS steps fetch');
    }
  };

  // Android permission request
  const requestAndroidPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 29) {
          const checkResult = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
          );
          
          if (checkResult) {
            return true;
          }

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            {
              title: 'Step Counter Permission',
              message: 'This app needs access to your physical activity to count steps and track your daily progress.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
              buttonNeutral: 'Ask Me Later',
            }
          );

          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        
        return true;
      } catch (err) {
        console.error('Permission request failed:', err);
        return false;
      }
    }
    return true;
  };

  // Initialize Google Fit for Android
  const initializeGoogleFit = async () => {
    try {
      console.log('Initializing Google Fit...');
      
      const permissionGranted = await requestAndroidPermission();
      if (!permissionGranted) {
        setConnectionStatus('offline');
        setLoading(false);
        return;
      }

      const options = { 
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_BODY_READ,
          Scopes.FITNESS_LOCATION_READ
        ] 
      };

      GoogleFit.authorize(options)
        .then(authResult => {
          if (authResult.success) {
            console.log('Google Fit authorization successful');
            setConnectionStatus('connected');
            setTimeout(() => {
              fetchAndroidSteps();
            }, 1000);
          } else {
            handleConnectionError(new Error('Authorization failed'), 'Google Fit auth');
          }
        })
        .catch(error => {
          handleConnectionError(error, 'Google Fit auth');
        });
    } catch (err) {
      handleConnectionError(err, 'Google Fit init');
    }
  };

  // Fetch steps from Android Google Fit
  const fetchAndroidSteps = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && await loadCachedSteps()) {
        setLoading(false);
        setConnectionStatus('connected');
        return;
      }

      const startDate = getStartOfDay();
      const endDate = new Date();

      const stepsData = await GoogleFit.getDailyStepCountSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      console.log('Google Fit Step Data:', stepsData);

      let totalSteps = 0;
      let foundSteps = false;

      if (stepsData && stepsData.length > 0) {
        const preferredSources = [
          'com.google.android.gms:estimated_steps',
          'com.google.android.gms:merge_step_deltas',
          'derived:com.google.step_count.delta'
        ];

        for (const source of preferredSources) {
          const sourceData = stepsData.find(data => data.source === source);
          if (sourceData && sourceData.steps && sourceData.steps.length > 0) {
            totalSteps = sourceData.steps.reduce((sum, step) => sum + step.value, 0);
            foundSteps = true;
            console.log(`Found steps from ${source}:`, totalSteps);
            break;
          }
        }

        if (!foundSteps && stepsData.length > 0) {
          for (const data of stepsData) {
            if (data.steps && data.steps.length > 0) {
              totalSteps = data.steps.reduce((sum, step) => sum + step.value, 0);
              foundSteps = true;
              console.log(`Found steps from fallback source ${data.source}:`, totalSteps);
              break;
            }
          }
        }
      }

      setSteps(totalSteps);
      saveStepsToCache(totalSteps);
      lastFetchRef.current = Date.now();
      setConnectionStatus('connected');
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      handleConnectionError(err, 'Android steps fetch');
    }
  };

  // Platform-specific initialization
  const initialize = async () => {
    try {
      console.log(`Initializing step counter (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Load cached data first to show something immediately
      await loadCachedSteps();
      
      if (Platform.OS === 'ios') {
        await initializeHealthKit();
      } else {
        await initializeGoogleFit();
      }
    } catch (err) {
      handleConnectionError(err, 'initialization');
    }
  };

  // Manual retry function
  const handleManualRetry = () => {
    setRetryCount(0);
    setConnectionStatus('connecting');
    setLoading(true);
    initialize();
  };

  // Refresh step data
  const refreshStepData = () => {
    const now = Date.now();
    if (!lastFetchRef.current || now - lastFetchRef.current >= CACHE_EXPIRY) {
      if (connectionStatus === 'connected') {
        if (Platform.OS === 'ios') {
          fetchiOSSteps(true);
        } else {
          fetchAndroidSteps(true);
        }
      }
    }
  };

  // Calculate milliseconds until midnight
  const getMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  useEffect(() => {
    initialize();
    
    // Set up midnight reset timer
    const midnightTimer = setTimeout(() => {
      AsyncStorage.removeItem(CACHE_KEY).then(() => {
        if (Platform.OS === 'ios') {
          fetchiOSSteps(true);
        } else {
          fetchAndroidSteps(true);
        }
      });
    }, getMsUntilMidnight());
    
    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, []);

  // Periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(refreshStepData, CACHE_EXPIRY);
    return () => clearInterval(refreshInterval);
  }, [connectionStatus]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={metricValueStyle}>
        {steps} steps
      </Text>
      <Text style={metricLabelStyle}>
        {stepGoal}
      </Text>
    </View>
  );
};

export default GoogleFitStepDisplay;
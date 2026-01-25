import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

let AppleHealthKit, GoogleFit, Scopes;

if (Platform.OS === 'ios') {
  AppleHealthKit = require('react-native-health').default;
} else {
  GoogleFit = require('react-native-google-fit').default;
  Scopes = require('react-native-google-fit').Scopes;
}

const GoogleFitStepDisplay = ({ onStepsUpdate }) => {
  const [initialized, setInitialized] = useState(false);
  const initializingRef = useRef(false);

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  const initializeGoogleFit = async () => {
    const permissionGranted = await requestAndroidPermission();
    if (!permissionGranted) {
      throw new Error('Permission denied');
    }

    const options = { 
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_LOCATION_READ
      ] 
    };

    const authResult = await GoogleFit.authorize(options);
    if (!authResult.success) {
      throw new Error('Authorization failed');
    }
  };

  const fetchTodaySteps = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        AppleHealthKit.getStepCount(
          {
            startDate: today.toISOString(),
            endDate: now.toISOString(),
          },
          (err, results) => {
            if (err) {
              console.error('iOS step fetch error:', err);
              resolve(0);
              return;
            }
            resolve(results.value || 0);
          }
        );
      });
    } else {
      try {
        const result = await GoogleFit.getDailyStepCountSamples({
          startDate: today.toISOString(),
          endDate: now.toISOString(),
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
        console.error('Android step fetch error:', err);
        return 0;
      }
    }
  };

  const fetchLast6DaysSteps = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const startDate = new Date(yesterday);
    startDate.setDate(yesterday.getDate() - 5);
    startDate.setHours(0, 0, 0, 0);

    console.log('Fetching historical steps from:', formatDate(startDate), 'to:', formatDate(yesterday));

    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        AppleHealthKit.getDailyStepCountSamples(
          {
            startDate: startDate.toISOString(),
            endDate: yesterday.toISOString(),
          },
          (err, results) => {
            if (err) {
              console.error('Error fetching historical iOS steps:', err);
              resolve();
              return;
            }

            if (results && results.length > 0 && onStepsUpdate) {
              console.log('Historical steps by day:');
              results.forEach(day => {
                const dateKey = formatDate(new Date(day.startDate));
                const daySteps = day.value || 0;
                console.log(`  ${dateKey}: ${daySteps} steps`);
                onStepsUpdate(daySteps, dateKey);
              });
            }
            resolve();
          }
        );
      });
    } else {
      try {
        const stepsData = await GoogleFit.getDailyStepCountSamples({
          startDate: startDate.toISOString(),
          endDate: yesterday.toISOString(),
        });

        if (stepsData && stepsData.length > 0 && onStepsUpdate) {
          const preferredSources = [
            'com.google.android.gms:estimated_steps',
            'com.google.android.gms:merge_step_deltas',
            'derived:com.google.step_count.delta'
          ];

          let sourceData = null;
          for (const source of preferredSources) {
            sourceData = stepsData.find(data => data.source === source);
            if (sourceData && sourceData.steps && sourceData.steps.length > 0) {
              console.log('Using source:', source);
              break;
            }
          }

          if (!sourceData && stepsData.length > 0) {
            for (const data of stepsData) {
              if (data.steps && data.steps.length > 0) {
                sourceData = data;
                console.log('Using fallback source:', data.source);
                break;
              }
            }
          }

          if (sourceData && sourceData.steps) {
            console.log('Historical steps by day:');
            sourceData.steps.forEach(step => {
              const dateKey = formatDate(new Date(step.date));
              const daySteps = step.value || 0;
              console.log(`  ${dateKey}: ${daySteps} steps`);
              onStepsUpdate(daySteps, dateKey);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching historical Android steps:', err);
      }
    }
  };

  const updateTodaySteps = async () => {
    if (!initialized && !initializingRef.current) return;
    
    const steps = await fetchTodaySteps();
    const todayKey = formatDate(new Date());
    console.log(`Today (${todayKey}): ${steps} steps`);
    
    if (onStepsUpdate) {
      onStepsUpdate(steps, todayKey);
    }
  };

  const initialize = async () => {
    if (initializingRef.current || initialized) {
      return;
    }

    initializingRef.current = true;

    try {
      if (Platform.OS === 'ios') {
        await initializeHealthKit();
      } else {
        await initializeGoogleFit();
      }
      
      await fetchLast6DaysSteps();
      await updateTodaySteps();
      
      setInitialized(true);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      initializingRef.current = false;
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
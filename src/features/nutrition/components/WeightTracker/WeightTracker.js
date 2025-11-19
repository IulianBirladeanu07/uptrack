import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, Vibration, Keyboard, StatusBar, ActivityIndicator, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { StyleSheet } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

import {
  validateWeight,
  loadUserWeightData,
  handleSaveLogic,
} from '../../helpers/weightTrackerUtils';

import { InputView } from './InputView';
import { SummaryView } from './SummaryView';

const WeightTracker = () => {
  const date = new Date();

  // State management
  const [weight, setWeight] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeView, setActiveView] = useState('summary');
  const [weeklyData, setWeeklyData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weeklyAverage, setWeeklyAverage] = useState(null);
  const [lastWeekAverage, setLastWeekAverage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(date instanceof Date && !isNaN(date) ? date : new Date());

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Memoized data loading
  const memoizedLoadUserWeightData = useCallback(async () => {
    if (userId) {
      setLoading(true);
      await loadUserWeightData(
        userId,
        selectedDate,
        setCurrentWeight,
        setWeight,
        setWeeklyData,
        setWeeklyAverage,
        setLastWeekAverage,
        setTrendData
      );
      setLoading(false);
    }
  }, [userId, selectedDate]);

  // Effects
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    memoizedLoadUserWeightData();
  }, [memoizedLoadUserWeightData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Utility functions
  const handleWeightChange = (value) => {
    setWeight(value);
    setIsValid(validateWeight(value));
  };

  const adjustWeight = (increment) => {
    const currentVal = parseFloat(weight) || (currentWeight || 0);
    const newWeight = Math.max(0, Math.min(1000, currentVal + increment)).toFixed(1);
    handleWeightChange(newWeight);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  };

  const showSuccessNotification = () => {
    setShowSuccess(true);
    Vibration.vibrate([50, 100, 50]);
    
    Animated.sequence([
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.delay(2000),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
    });
  };

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    if (!validateWeight(weight)) {
      Vibration.vibrate(200);
      return;
    }

    setSaving(true);
    Vibration.vibrate(50);

    if (userId) {
      try {
        await handleSaveLogic(
          userId,
          weightValue,
          selectedDate,
          setCurrentWeight,
          setWeeklyAverage,
          memoizedLoadUserWeightData
        );
        showSuccessNotification();
        setTimeout(() => setActiveView('summary'), 600);
      } catch (error) {
        console.error('Error saving weight: ', error);
        Vibration.vibrate([100, 50, 100]);
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(false);
      console.warn('User ID not available. Cannot save weight.');
    }
  };

  const getWeightChange = () => {
    if (weeklyAverage === null || lastWeekAverage === null) return null;
    return weeklyAverage - lastWeekAverage;
  };

  // Loading State Component
  const renderLoadingState = () => (
    <View style={[styles.container, styles.loadingContainer]}>
      <StatusBar backgroundColor="#02111B" barStyle="light-content" />
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    </View>
  );

  // Success Notification Component
  const renderSuccessNotification = () => (
    <Animated.View
      style={[
        styles.successNotification,
        {
          transform: [
            {
              translateY: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: successAnim,
        },
      ]}
    >
      <MaterialCommunityIcons name="check-circle" size={normalize(20)} color="#32D74B" />
      <Text style={styles.successText}>Weight saved successfully!</Text>
    </Animated.View>
  );

  // Common props for child components
  const commonProps = {
    weight,
    setWeight: handleWeightChange,
    adjustWeight,
    isValid,
    saving,
    handleSave,
    currentWeight,
    weeklyData,
    weeklyAverage,
    lastWeekAverage,
    trendData,
    getWeightChange,
    setActiveView,
    selectedDate,
    setSelectedDate,
    userId,
  };

  if (loading) {
    return renderLoadingState();
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#02111B" barStyle="light-content" />

      {showSuccess && renderSuccessNotification()}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {activeView === 'summary' && <SummaryView {...commonProps} />}
        {activeView === 'input' && <InputView {...commonProps} />}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02111B',
    paddingTop: Platform.OS === 'ios' ? normalize(44) : normalize(24),
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: normalize(16),
    fontSize: normalize(15),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  successNotification: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? normalize(54) : normalize(34),
    left: normalize(16),
    right: normalize(16),
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    borderColor: '#32D74B',
    borderWidth: 1,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    zIndex: 1000,
  },
  successText: {
    color: '#32D74B',
    fontSize: normalize(14),
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default WeightTracker;
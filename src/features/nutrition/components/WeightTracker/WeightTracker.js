import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, Vibration, StatusBar, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import { normalize } from '../../../../shared/hooks/useResponsive';

import { validateWeight, loadUserWeightData, handleSaveLogic } from '../../helpers/weightTrackerUtils';
import WeightInputView from './WeightInputView';
import WeightSummaryView from './WeightSummaryView';

const WeightTracker = () => {
  const [weight, setWeight] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('summary');
  const [weeklyData, setWeeklyData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weeklyAverage, setWeeklyAverage] = useState(null);
  const [lastWeekAverage, setLastWeekAverage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadData = useCallback(async () => {
    if (!userId) return;
    
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
  }, [userId, selectedDate]);

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
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

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
  }, []);

  const handleWeightChange = (value) => {
    setWeight(value);
    setIsValid(validateWeight(value));
  };

  const adjustWeight = (increment) => {
    const currentVal = parseFloat(weight) || (currentWeight || 0);
    const newWeight = Math.max(0, Math.min(1000, currentVal + increment)).toFixed(1);
    handleWeightChange(newWeight);
    
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
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
          loadData
        );
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
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]} edges={['bottom']}>
        <StatusBar backgroundColor="#02111B" barStyle="light-content" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar backgroundColor="#02111B" barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {activeView === 'summary' && <WeightSummaryView {...commonProps} />}
        {activeView === 'input' && <WeightInputView {...commonProps} />}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02111B',
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
  content: {
    flex: 1,
  },
});

export default WeightTracker;
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';

const safeRound = (value) => {
  return Math.round((value || 0) * 100) / 100;
};

const WeightDisplay = React.memo(({ weightData, onPress }) => {
  const display = useMemo(() => {
    const { currentWeight, weeklyAverage, weeklyTrend, weighInCount } = weightData;
    
    if (currentWeight) {
      const roundedWeight = safeRound(currentWeight);
      const roundedTrend = weeklyTrend !== null ? safeRound(weeklyTrend) : null;
      const roundedAverage = weeklyAverage ? safeRound(weeklyAverage) : null;
      
      const subText = roundedTrend !== null 
        ? `${roundedTrend > 0 ? '+' : ''}${roundedTrend} kg vs last week`
        : roundedAverage 
          ? `Avg: ${roundedAverage} kg (${weighInCount} weigh-ins)`
          : 'Today\'s weight';
      
      return { main: `${roundedWeight} kg`, sub: subText };
    }
    
    if (weeklyAverage) {
      const roundedAverage = safeRound(weeklyAverage);
      const roundedTrend = weeklyTrend !== null ? safeRound(weeklyTrend) : null;
      
      const subText = roundedTrend !== null 
        ? `${roundedTrend > 0 ? '+' : ''}${roundedTrend} kg vs last week`
        : `Weekly avg (${weighInCount} weigh-ins)`;
      
      return { main: `${roundedAverage} kg`, sub: subText };
    }
    
    return { main: 'Tap to weigh', sub: 'Track your progress' };
  }, [weightData.currentWeight, weightData.weeklyAverage, weightData.weeklyTrend, weightData.weighInCount]);

  const trendColor = weightData.weeklyTrend > 0 ? "#10B981" : 
                     weightData.weeklyTrend < 0 ? "#EF4444" : "#9CA3AF";

  return (
    <TouchableOpacity 
      style={styles.leftMetricContainer}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Weight tracker"
      accessibilityHint="Tap to view and log weight"
      testID="weight-display"
    >
      <View style={styles.metricIconContainer}>
        <MaterialCommunityIcons 
          name="scale-bathroom" 
          size={20} 
          color={weightData.currentWeight ? "#FFA726" : "#9CA3AF"} 
        />
      </View>
      <Text style={[
        styles.metricValue,
        { color: weightData.currentWeight ? "#FFFFFF" : "#9CA3AF" }
      ]}>
        {display.main}
      </Text>
      <Text style={[styles.metricLabel, { color: trendColor }]}>
        {display.sub}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Deep comparison for weightData
  const prevData = prevProps.weightData;
  const nextData = nextProps.weightData;
  
  return (
    prevData.currentWeight === nextData.currentWeight &&
    prevData.weeklyAverage === nextData.weeklyAverage &&
    prevData.weeklyTrend === nextData.weeklyTrend &&
    prevData.weighInCount === nextData.weighInCount &&
    prevProps.onPress === nextProps.onPress
  );
});

WeightDisplay.displayName = 'WeightDisplay';

export default WeightDisplay;
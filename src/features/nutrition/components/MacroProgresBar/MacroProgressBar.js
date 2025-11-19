import React from 'react';
import { View, Text } from 'react-native';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';

const getMacroEstimate = (value, macroType) => {
  const estimates = {
    carbs: Math.max(Math.round(value * 1.5), 150),
    protein: Math.max(Math.round(value * 1.3), 80),
    fat: Math.max(Math.round(value * 1.4), 70),
  };
  return estimates[macroType.toLowerCase()] || Math.max(Math.round(value * 1.5), 100);
};

const MacroProgressBar = React.memo(({ 
  value, 
  maxValue, 
  label, 
  color, 
  hasTargets, 
  testID 
}) => {
  hasTargets = true;
  const safeValue = Math.round(value || 0);
  const safeMaxValue = Math.round(maxValue || 0);
  const displayMax = hasTargets ? safeMaxValue : getMacroEstimate(safeValue, label);
  const fillPercentage = Math.min(Math.round((safeValue / displayMax) * 100), 100);
  const progressColor = hasTargets ? color : '#64748B';
  const opacity = hasTargets ? 1 : 0.7;

  return (
    <View style={styles.macroItem} testID={testID}>
      <Text style={styles.macroName} accessibilityLabel={`${label} macro`}>
        {label}
      </Text>
      <View 
        style={styles.macroProgressContainer}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: displayMax, now: Math.round(value) }}
      >
        <View 
          style={[
            styles.macroProgressFill, 
            { 
              width: `${fillPercentage}%`,
              backgroundColor: progressColor,
              opacity
            }
          ]} 
        />
      </View>
      <Text style={styles.macroValues} accessibilityLabel={
        hasTargets 
          ? `${safeValue} out of ${safeMaxValue} grams`
          : `${safeValue} grams consumed`
      }>
        {hasTargets 
          ? `${safeValue} / ${safeMaxValue}g`
          : `${safeValue}g`
        }
      </Text>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.maxValue === nextProps.maxValue &&
    prevProps.hasTargets === nextProps.hasTargets &&
    prevProps.label === nextProps.label &&
    prevProps.color === nextProps.color
  );
});

export default MacroProgressBar;
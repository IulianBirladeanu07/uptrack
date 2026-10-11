import React from 'react';
import { View, Text } from 'react-native';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';
import { getMacroBarState } from '../../helpers/macroBar';

const MacroProgressBar = React.memo(({
  value,
  maxValue,
  label,
  color,
  hasTargets,
  testID
}) => {
  const { safeValue, safeMaxValue, hasTarget, displayMax, fillPercentage } = getMacroBarState(value, maxValue, hasTargets, label);
  const progressColor = hasTarget ? color : '#64748B';
  const opacity = hasTarget ? 1 : 0.7;

  return (
    <View style={styles.macroItem} testID={testID}>
      <Text style={styles.macroName} accessibilityLabel={`${label} macro`}>
        {label}
      </Text>
      <View 
        style={styles.macroProgressContainer}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: displayMax, now: safeValue }}
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
        hasTarget
          ? `${safeValue} out of ${safeMaxValue} grams`
          : `${safeValue} grams consumed`
      }>
        {hasTarget
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
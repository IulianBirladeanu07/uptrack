import React, { useMemo } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CircularProgress from '../../../../shared/components/CircularProgress/CircularProgress';
import GoogleFitStepDisplay from '../../../../shared/components/GoogleFit/GoogleFit';
import WeightDisplay from '../WeightDisplay/WeightDisplay';
import MacroProgressBar from '../MacroProgresBar/MacroProgressBar';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';

const STEP_GOAL = 10000;

const MemoizedCircularProgress = React.memo(({ 
  calories,
  targetCalories,
  hasTargets,
  learningData
}) => {
  return (
    <CircularProgress 
      value={Math.round(calories || 0)} 
      maxValue={hasTargets ? Math.round(targetCalories || 0) : 0} 
      size={100}
      strokeWidth={10} 
      color="#FFA726" 
      duration={1500} 
      measure="KCAL"
      hasTargets={hasTargets}
      daysLogged={Math.round(learningData?.daysLogged || 0)}
      weeklyAvgCalories={Math.round(learningData?.weeklyAvgCalories || 0)}
    />
  );
}, (prevProps, nextProps) => {
  return (
    Math.round(prevProps.calories || 0) === Math.round(nextProps.calories || 0) &&
    Math.round(prevProps.targetCalories || 0) === Math.round(nextProps.targetCalories || 0) &&
    prevProps.hasTargets === nextProps.hasTargets &&
    Math.round(prevProps.learningData?.daysLogged || 0) === Math.round(nextProps.learningData?.daysLogged || 0) &&
    Math.round(prevProps.learningData?.weeklyAvgCalories || 0) === Math.round(nextProps.learningData?.weeklyAvgCalories || 0)
  );
});

const MemoizedGoogleFitStepDisplay = React.memo(() => {
  return (
    <GoogleFitStepDisplay 
      metricValueStyle={styles.metricValue}
      metricLabelStyle={styles.metricLabel}
      stepGoal={STEP_GOAL}
    />
  );
});

function NutritionStats({ 
  weightData, 
  onWeightPress, 
  dailyNutrition, 
  userMacros, 
  hasTargets, 
  learningData 
}) {
  const macroValues = useMemo(() => ({
    carbs: dailyNutrition.carbs || 0,
    protein: dailyNutrition.protein || 0,
    fat: dailyNutrition.fat || 0,
    targetCarbs: userMacros.targetCarbs || 0,
    targetProtein: userMacros.targetProtein || 0,
    targetFats: userMacros.targetFats || 0,
  }), [dailyNutrition.carbs, dailyNutrition.protein, dailyNutrition.fat, 
       userMacros.targetCarbs, userMacros.targetProtein, userMacros.targetFats]);

  return (
    <View style={styles.statsContainer}>
      <View style={styles.metricsRow}>
        {/* Weight Display */}
        <WeightDisplay 
          weightData={weightData} 
          onPress={onWeightPress} 
        />
        
        {/* Calories Display */}
        <View style={styles.circularProgressContainer}>
          <MemoizedCircularProgress
            calories={dailyNutrition.calories}
            targetCalories={userMacros.targetCalories}
            hasTargets={hasTargets}
            learningData={learningData}
          />
        </View>
        
        {/* Steps Display */}
        <View style={styles.rightMetricContainer}>
          <View style={styles.stepIconContainer}>
            <MaterialCommunityIcons name="run-fast" size={20} color="#FF5722" />
          </View>
          <MemoizedGoogleFitStepDisplay />
        </View>
      </View>

      <View style={styles.separator} />

      {/* Macro Section */}
      <View style={styles.macroSection}>
        <View style={styles.macroContainer}>
          <MacroProgressBar
            value={macroValues.carbs}
            maxValue={macroValues.targetCarbs}
            label="Carbs"
            color="#4caf50"
            hasTargets={hasTargets}
            testID="carbs-progress"
          />
          <MacroProgressBar
            value={macroValues.protein}
            maxValue={macroValues.targetProtein}
            label="Protein"
            color="#9c27b0"
            hasTargets={hasTargets}
            testID="protein-progress"
          />
          <MacroProgressBar
            value={macroValues.fat}
            maxValue={macroValues.targetFats}
            label="Fat"
            color="#2196f3"
            hasTargets={hasTargets}
            testID="fat-progress"
          />
        </View>
      </View>
    </View>
  );
}

export default NutritionStats;
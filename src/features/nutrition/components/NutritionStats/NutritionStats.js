import { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import CircularProgress from '../../../../shared/components/CircularProgress/CircularProgress';
import GoogleFitStepDisplay from '../../../../shared/components/GoogleFitStepDisplay/GoogleFitStepDisplay';
import MacroProgressBar from '../MacroProgresBar/MacroProgressBar';
import WeightService from '../../services/weightService';
import { useFoodContext } from '../../context/FoodContext';
import { colors } from '../../../../shared/theme';
import styles from '../../screens/NutritionScreen/NutritionScreenStyles';

function NutritionStats({ onWeightPress, dailyNutrition, userMacros, hasTargets, learningData, selectedDate }) {
  const [weightData, setWeightData] = useState({
    currentWeight: null,
    weeklyAverage: null,
    weeklyTrend: null,
    weighInCount: 0,
  });
  const [weightLoading, setWeightLoading] = useState(true);

  const { updateDailySteps, dailySteps, initialLoadComplete } = useFoodContext();

  useEffect(() => {
    const fetchWeight = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setWeightLoading(false);
          return;
        }

        const data = await WeightService.getWeightDisplayData(user.uid, selectedDate);
        setWeightData(data);
      } catch (error) {
        console.error('Weight fetch error:', error);
      } finally {
        setWeightLoading(false);
      }
    };

    if (initialLoadComplete) {
      fetchWeight();
    }
  }, [selectedDate, initialLoadComplete]);

  const macroValues = useMemo(() => ({
    carbs: dailyNutrition.carbs || 0,
    protein: dailyNutrition.protein || 0,
    fat: dailyNutrition.fat || 0,
    targetCarbs: userMacros.targetCarbs || 0,
    targetProtein: userMacros.targetProtein || 0,
    targetFats: userMacros.targetFats || 0,
  }), [dailyNutrition.carbs, dailyNutrition.protein, dailyNutrition.fat, 
       userMacros.targetCarbs, userMacros.targetProtein, userMacros.targetFats]);

  if (!initialLoadComplete) {
    return (
      <View style={[styles.statsContainer, { justifyContent: 'center', alignItems: 'center', minHeight: 200 }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
      <GoogleFitStepDisplay onStepsUpdate={updateDailySteps} />
      
      <View style={styles.metricsRow}>
        <TouchableOpacity 
          style={styles.leftMetricContainer}
          onPress={onWeightPress}
          activeOpacity={0.7}
        >
          <View style={styles.metricIconContainer}>
            <MaterialCommunityIcons name="scale-bathroom" size={20} color={colors.accent.primary} />
          </View>
          {weightLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.accent.primary} style={{ marginVertical: 4 }} />
              <Text style={styles.metricLabel}>Loading...</Text>
            </>
          ) : (
            <>
              <Text style={styles.metricValue}>
                {weightData.currentWeight 
                  ? `${weightData.currentWeight.toFixed(1)} kg` 
                  : 'Tap to weigh'}
              </Text>
              <Text style={styles.metricLabel}>
                {weightData.currentWeight ? `Today's weight` : 'Tap to weigh'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.circularProgressContainer}>
          <CircularProgress 
            value={Math.round(dailyNutrition.calories || 0)} 
            maxValue={hasTargets ? Math.round(userMacros.targetCalories || 0) : 0} 
            size={100}
            strokeWidth={10} 
            color="#FFA726" 
            duration={1500} 
            measure="KCAL"
            hasTargets={hasTargets}
            daysLogged={Math.round(learningData?.daysLogged || 0)}
            weeklyAvgCalories={Math.round(learningData?.weeklyAvgCalories || 0)}
          />
        </View>
        
        <View style={styles.rightMetricContainer}>
          <View style={[
            styles.stepIconContainer,
            {
              backgroundColor: dailySteps >= 10000 
                ? colors.faded.success
                : colors.faded.stepsRed,
              borderColor: dailySteps >= 10000 
                ? colors.border.success
                : colors.border.stepsRed,
            }
          ]}>
            <MaterialCommunityIcons name="run-fast" size={20} color={colors.accent.stepsRed} />
          </View>
          <Text style={styles.metricValue}>
            {dailySteps > 0 ? dailySteps.toLocaleString() : '--'}
          </Text>
          <Text style={styles.metricLabel}>
            {dailySteps >= 10000 ? 'Goal reached!' : '10,000 goal'}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

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
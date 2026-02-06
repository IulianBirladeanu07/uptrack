import { memo, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const FoodSelectionHeader = ({
  date,
  dailyGoal = 2000,
  selectedFoods = [],
  onCaloriePress,
  currentCalories = 0,
  targetCalories = 2000,
}) => {
  const { calculatedCurrentCalories, foodCount, calorieProgress, isOverGoal } = useMemo(() => {
    const selectedFoodsCalories = Math.round(
      selectedFoods.reduce((total, food) => total + (Number(food.calories) || 0), 0)
    );
    
    const totalCurrentCalories = Math.round((currentCalories || 0) + selectedFoodsCalories);
    const calculatedFoodCount = selectedFoods.length;
    const effectiveTargetCalories = targetCalories || dailyGoal;
    const calculatedCalorieProgress = Math.min((totalCurrentCalories / effectiveTargetCalories) * 100, 100);
    const calculatedIsOverGoal = totalCurrentCalories > effectiveTargetCalories;

    return {
      calculatedCurrentCalories: totalCurrentCalories,
      foodCount: calculatedFoodCount,
      calorieProgress: calculatedCalorieProgress,
      isOverGoal: calculatedIsOverGoal,
    };
  }, [selectedFoods, currentCalories, targetCalories, dailyGoal]);

  const formattedDate = useMemo(() => {
    return date || new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, [date]);

  const effectiveTargetCalories = useMemo(() => {
    return targetCalories || dailyGoal;
  }, [targetCalories, dailyGoal]);

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: calorieProgress,
      duration: 750,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [calorieProgress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Food Selection</Text>
            {foodCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {foodCount} item{foodCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      <Pressable onPress={onCaloriePress} style={styles.calorieCard}>
        <View style={styles.calorieHeader}>
          <Text style={styles.calorieLabel}>Daily Progress</Text>
          <View style={styles.calorieValueContainer}>
            <Flame 
              size={spacing.iconSm} 
              color={colors.accent.primary} 
              strokeWidth={2.5}
            />
            <Text style={styles.calorieValue}>
              {calculatedCurrentCalories.toLocaleString()} / {effectiveTargetCalories.toLocaleString()} kcal
            </Text>
          </View>
        </View>
        
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressWidth,
                  backgroundColor: colors.accent.primary,
                },
              ]} 
            />
          </View>
          <Text style={styles.progressPercent}>
            {Math.round(calorieProgress)}%
          </Text>
        </View>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize[28],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.faded.success,
    borderRadius: radius[3],
    minWidth: spacing[6],
    height: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    marginTop: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.success,
  },
  badgeText: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    color: colors.accent.successAlt,
    letterSpacing: 0.2,
  },
  calorieCard: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderRadius: radius[4],
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    paddingVertical: spacing[5],
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  calorieLabel: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  calorieValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  calorieValue: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    letterSpacing: 0.2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  progressTrack: {
    flex: 1,
    height: spacing[2],
    backgroundColor: colors.background.tertiary,
    borderRadius: radius[1],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius[1],
    minWidth: spacing[1],
  },
  progressPercent: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    minWidth: 38,
    textAlign: 'right',
  },
});

export default memo(FoodSelectionHeader);
import { memo, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  danger: '#FF453A',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

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
    <View style={headerStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={headerStyles.content}>
        <View style={headerStyles.topRow}>
          <View style={headerStyles.titleContainer}>
            <View style={headerStyles.titleRow}>
              <Text style={headerStyles.title}>Food Selection</Text>
              {foodCount > 0 && (
                <View style={headerStyles.compactBadge}>
                  <Text style={headerStyles.compactBadgeText}>
                    {foodCount} item{foodCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
            <Text style={headerStyles.date}>{formattedDate}</Text>
          </View>
        </View>

        <Pressable onPress={onCaloriePress} style={headerStyles.calorieSection}>
          <View style={headerStyles.calorieHeader}>
            <Text style={headerStyles.calorieLabel}>Daily Progress</Text>
            <View style={headerStyles.calorieTextContainer}>
              <Flame 
                size={normalize(16)} 
                color={colors.primary} 
                strokeWidth={2.5}
              />
              <Text style={[
                headerStyles.calorieText,
                isOverGoal && headerStyles.calorieTextOver
              ]}>
                {calculatedCurrentCalories.toLocaleString()} / {effectiveTargetCalories.toLocaleString()} kcal
              </Text>
            </View>
          </View>
          
          <View style={headerStyles.progressContainer}>
            <View style={headerStyles.progressTrack}>
              <Animated.View 
                style={[
                  headerStyles.progressFill,
                  { 
                    width: progressWidth,
                    backgroundColor: colors.primary,
                  },
                ]} 
              />
            </View>
            <Text style={headerStyles.progressPercent}>
              {Math.round(calorieProgress)}%
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {},
  content: {},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: normalize(20),
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(2),
  },
  title: {
    fontSize: normalize(28),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: normalize(15),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: normalize(12),
    minWidth: normalize(24),
    height: normalize(22),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(8),
    marginTop: normalize(4),
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  compactBadgeText: {
    fontSize: normalize(11),
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.2,
  },
  calorieSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(8),
    borderWidth: 1,
    paddingVertical: normalize(20),
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  calorieLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  calorieTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  calorieText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  calorieTextOver: {
    // color: colors.danger,s
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  progressTrack: {
    flex: 1,
    height: normalize(8),
    backgroundColor: colors.surfaceLight,
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: normalize(4),
    minWidth: normalize(4),
  },
  progressPercent: {
    fontSize: normalize(13),
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: normalize(38),
    textAlign: 'right',
  },
});

export default memo(FoodSelectionHeader);
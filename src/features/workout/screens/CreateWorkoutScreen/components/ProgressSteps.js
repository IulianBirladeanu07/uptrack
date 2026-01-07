import { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const COLORS = {
  primary: colors.primary,
  cardDark: colors.surfaceLight,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textTertiary,
  border: colors.border,
  progressBarTrack: 'rgba(255, 255, 255, 0.1)',
};

const ProgressStepItem = memo(({ step, index, currentStep, totalSteps }) => {
  const isCompleted = index < currentStep;
  const isActive = index === currentStep;
  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  const scale = useSharedValue(isCompleted ? 1.1 : isActive ? 1.2 : 1);

  useEffect(() => {
    scale.value = withSpring(isCompleted ? 1.1 : isActive ? 1.2 : 1, {
      damping: 15,
      stiffness: 200,
      mass: 0.4,
    });
  }, [currentStep, isActive, isCompleted, scale]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[
        styles.progressStep,
        isFirst && styles.firstStep,
        isLast && styles.lastStep,
      ]}
    >
      <View style={styles.indicatorWrapper}>
        <Animated.View
          style={[
            styles.stepIndicator,
            isCompleted && styles.completedStepIndicator,
            isActive && styles.activeStepIndicator,
            animatedIndicatorStyle,
          ]}
        >
          <Ionicons
            name={isCompleted ? 'checkmark' : step.icon}
            size={normalize(18)}
            color={isCompleted || isActive ? colors.textPrimary : COLORS.textSecondary}
          />
        </Animated.View>
      </View>

      <Text
        style={[
          styles.stepLabel,
          isCompleted && styles.completedStepLabel,
          isActive && styles.activeStepLabel,
        ]}
      >
        {step.title}
      </Text>

      {isActive && (
        <View
          style={{
            marginTop: normalize(2),
            height: normalize(2),
            width: normalize(24),
            backgroundColor: COLORS.primary,
            borderRadius: normalize(1),
            alignSelf: 'center',
          }}
        />
      )}
    </View>
  );
});

export const ProgressSteps = ({ currentStep, steps }) => {
  const totalSteps = steps.length;
  const targetProgressWidth = currentStep === 0 
    ? 15
    : (currentStep / (totalSteps - 1)) * 100;

  const progressWidth = useSharedValue(targetProgressWidth);

  useEffect(() => {
    progressWidth.value = withSpring(targetProgressWidth, {
      damping: 12,
      stiffness: 100,
      mass: 0.6,
    });
  }, [currentStep, targetProgressWidth, progressWidth]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressLineContainer}>
        <View style={styles.progressLine} />      
        <Animated.View style={[styles.progressLineActive, animatedProgressStyle]} />
      </View>

      {steps.map((step, index) => (
        <ProgressStepItem
          key={`${step.id || index}-${step.title}`}
          step={step}
          index={index}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: normalize(8),
    paddingVertical: normalize(10),
    marginHorizontal: normalize(24),
    position: 'relative',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
    position: 'relative',
  },
  firstStep: {
    alignItems: 'center',
  },
  lastStep: {
    alignItems: 'center',
  },
  indicatorWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: normalize(36),
    height: normalize(36),
    marginBottom: normalize(6),
  },
  stepIndicator: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    zIndex: 3,
  },
  activeStepIndicator: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  completedStepIndicator: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  stepLabel: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: normalize(16),
    maxWidth: normalize(80),
  },
  activeStepLabel: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: normalize(13),
  },
  completedStepLabel: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: normalize(12),
  },
  progressLineContainer: {
    position: 'absolute',
    left: normalize(0),
    right: normalize(0),
    top: normalize(28),
    height: normalize(2),
    zIndex: 1,
  },
  progressLine: {
    flex: 1,
    height: normalize(2),
    backgroundColor: COLORS.progressBarTrack,
    borderRadius: normalize(1),
  },
  progressLineActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: normalize(2),
    backgroundColor: COLORS.primary,
    borderRadius: normalize(1),
  },
});

export default ProgressSteps;
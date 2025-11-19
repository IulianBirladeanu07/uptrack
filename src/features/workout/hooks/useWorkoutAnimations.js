import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';

export const useWorkoutAnimations = () => {
  const neuralNodes = useRef(
    Array(5).fill().map(() => ({
      opacity: new Animated.Value(Math.random() * 0.5 + 0.3),
      scale: new Animated.Value(1),
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
  ).current;

  const scanlineProgress = useRef(new Animated.Value(0)).current;
  const timerRingRotation = useRef(new Animated.Value(0)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;

  const startNeuralAnimations = useCallback(() => {
    neuralNodes.forEach((node, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(node.opacity, { toValue: 0.7, duration: 1200 + index * 200, useNativeDriver: true }),
          Animated.timing(node.scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(node.opacity, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
          Animated.timing(node.scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      ).start();
    });
  }, [neuralNodes]);

  const startScanlineAnimation = useCallback(() => {
    Animated.loop(
      Animated.timing(scanlineProgress, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, [scanlineProgress]);

  const startTimerAnimation = useCallback(() => {
    Animated.loop(
      Animated.timing(timerRingRotation, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
  }, [timerRingRotation]);

  const startAddButtonAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(addButtonScale, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        Animated.timing(addButtonScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [addButtonScale]);

  const handleButtonPressIn = useCallback((scaleRef) => {
    Animated.spring(scaleRef, { toValue: 0.95, useNativeDriver: true }).start();
  }, []);

  const handleButtonPressOut = useCallback((scaleRef) => {
    Animated.spring(scaleRef, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    startNeuralAnimations();
    startScanlineAnimation();
    startTimerAnimation();
    startAddButtonAnimation();

    return () => {
      neuralNodes.forEach(node => {
        node.opacity.stopAnimation();
        node.scale.stopAnimation();
      });
      scanlineProgress.stopAnimation();
      timerRingRotation.stopAnimation();
      addButtonScale.stopAnimation();
    };
  }, [startNeuralAnimations, startScanlineAnimation, startTimerAnimation, startAddButtonAnimation]);

  return {
    neuralNodes,
    scanlineProgress,
    timerRingRotation,
    addButtonScale,
    handleButtonPressIn,
    handleButtonPressOut,
  };
};
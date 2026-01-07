import { useCallback, useEffect, useRef } from 'react';
import { Vibration, Platform, Animated as RNAnimated, Easing } from 'react-native';
import { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  useDerivedValue,
  useAnimatedReaction,
  cancelAnimation
} from 'react-native-reanimated';

const DELETE_BUTTON_WIDTH = 65;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH * 0.7;
const SWIPE_CONFIRM_THRESHOLD = DELETE_BUTTON_WIDTH * 1.5;
const HAPTIC_THRESHOLDS = [DELETE_BUTTON_WIDTH * 0.5, DELETE_BUTTON_WIDTH * 1.2];
const DELETE_ANIMATION_DURATION = 300;

const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 200,
  overshootClamping: false,
};

const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const useSwipeAnimations = (onDelete, index, isDeleting, setIsDeleting, setSwipeConfirmActive) => {
  const translateX = useSharedValue(0);
  const deleteProgress = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const itemHeight = useSharedValue('auto');
  
  const hapticTriggered1 = useSharedValue(false);
  const hapticTriggered2 = useSharedValue(false);
  
  const swipePercentage = useDerivedValue(() => {
    return Math.min(100, (-translateX.value / SWIPE_CONFIRM_THRESHOLD) * 100);
  });
  
  const resetHapticTriggers = useCallback(() => {
    hapticTriggered1.value = false;
    hapticTriggered2.value = false;
  }, [hapticTriggered1, hapticTriggered2]);

  useEffect(() => {
    if (swipePercentage.value >= 75) {
      setSwipeConfirmActive(true);
    } else {
      setSwipeConfirmActive(false);
    }
  }, [swipePercentage.value, setSwipeConfirmActive]);
  
  useAnimatedReaction(
    () => swipePercentage.value,
    (currentValue, previousValue) => {
      'worklet';
      if (previousValue === undefined) return;
      
      if (currentValue >= 50 && previousValue < 50) {
        if (!hapticTriggered1.value) {
          hapticTriggered1.value = true;
          if (Platform.OS === 'ios') {
            Vibration.vibrate(15);
          }
        }
      }
      
      if (currentValue >= 85 && previousValue < 85) {
        if (!hapticTriggered2.value) {
          hapticTriggered2.value = true;
          if (Platform.OS === 'ios') {
            Vibration.vibrate(25);
          }
        }
      }
    }
  );

  useEffect(() => {
    return () => {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(rotation);
      cancelAnimation(opacity);
      cancelAnimation(itemHeight);
      cancelAnimation(deleteProgress);
      cancelAnimation(hapticTriggered1);
      cancelAnimation(hapticTriggered2);
    };
  }, [translateX, scale, rotation, opacity, itemHeight, deleteProgress, hapticTriggered1, hapticTriggered2]);

  const finishDelete = useCallback(() => {
    if (onDelete) {
      onDelete(index);
    }
    setIsDeleting(false);
    setSwipeConfirmActive(false);
    
    setTimeout(() => {
      translateX.value = 0;
      scale.value = 1;
      opacity.value = 1;
      itemHeight.value = 'auto';
      deleteProgress.value = 0;
    }, 50);
  }, [
    onDelete, 
    index, 
    translateX, 
    scale, 
    opacity, 
    itemHeight, 
    deleteProgress, 
    setIsDeleting, 
    setSwipeConfirmActive
  ]);

  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    rotation.value = withSequence(
      withTiming(-2, { duration: 70 }),
      withTiming(2, { duration: 70 }),
      withTiming(0, { duration: 70 })
    );
    
    scale.value = withTiming(0.9, { duration: DELETE_ANIMATION_DURATION / 2 });
    opacity.value = withTiming(0, { 
      duration: DELETE_ANIMATION_DURATION,
      easing: Easing.out(Easing.quad)
    });
    
    itemHeight.value = withTiming(0, { 
      duration: DELETE_ANIMATION_DURATION / 2,
      easing: Easing.out(Easing.cubic)
    }, (finished) => {
      if (finished) {
        finishDelete();
      }
    });
    
    Vibration.vibrate(40);
    
  }, [isDeleting, scale, opacity, itemHeight, rotation, setIsDeleting, finishDelete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
    height: itemHeight.value,
    overflow: 'hidden',
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    opacity: deleteOpacity.value,
    transform: [
      { scale: interpolate(deleteOpacity.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) },
      { translateX: interpolate(deleteOpacity.value, [0, 1], [20, 0], Extrapolation.CLAMP) }
    ],
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    width: `${deleteProgress.value}%`,
    backgroundColor: 'white',
    opacity: swipePercentage.value >= 75 ? 0.8 : 0.5,
  }));
  
  const confirmDeleteStyle = useAnimatedStyle(() => {
    const isConfirmActive = swipePercentage.value >= 75;
    return {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      left: 0,
      opacity: isConfirmActive ? 
        interpolate(deleteProgress.value, [75, 95], [0.7, 1], Extrapolation.CLAMP) : 0,
      transform: [
        { scale: isConfirmActive ? 
            interpolate(deleteProgress.value, [75, 100], [0.95, 1], Extrapolation.CLAMP) : 0.9 }
      ],
    };
  });

  return {
    translateX,
    deleteProgress,
    deleteOpacity,
    swipePercentage,
    hapticTriggered1,
    hapticTriggered2,
    animatedStyle,
    deleteButtonStyle,
    progressStyle,
    confirmDeleteStyle,
    handleDelete,
    resetHapticTriggers,
  };
};

export const useDetailAnimations = (initialExpanded) => {
  const iconAnim = useRef(new RNAnimated.Value(initialExpanded ? 1.2 : 1)).current;
  const detailsHeight = useRef(new RNAnimated.Value(initialExpanded ? 1 : 0)).current;

  const animateToggle = useCallback((isExpanded) => {
    RNAnimated.timing(iconAnim, {
      toValue: isExpanded ? 1.2 : 1,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    RNAnimated.timing(detailsHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    
    if (Platform.OS === 'ios') {
      Vibration.vibrate(5);
    }
  }, [iconAnim, detailsHeight]);

  const animatedIconStyle = {
    transform: [
      { scale: iconAnim },
    ],
  };
  
  const animatedDetailsStyle = {
    opacity: detailsHeight,
    height: detailsHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200],
    }),
  };

  return {
    animateToggle,
    animatedIconStyle,
    animatedDetailsStyle,
  };
};

export {
  DELETE_BUTTON_WIDTH,
  SWIPE_THRESHOLD,
  SWIPE_CONFIRM_THRESHOLD,
  SPRING_CONFIG,
  TIMING_CONFIG,
};
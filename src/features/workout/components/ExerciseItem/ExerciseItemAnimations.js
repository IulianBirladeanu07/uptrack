import { useCallback, useEffect } from 'react';
import { Vibration, Platform, Animated as RNAnimated, Easing } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  useDerivedValue,
  useAnimatedReaction,
  cancelAnimation
} from 'react-native-reanimated';

// Constants for swipe-to-delete
const DELETE_BUTTON_WIDTH = 65; // Wider for easier targeting
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH * 0.7; // When to snap to delete button
const SWIPE_CONFIRM_THRESHOLD = DELETE_BUTTON_WIDTH * 1.5; // When to show confirmation UI
const HAPTIC_THRESHOLDS = [DELETE_BUTTON_WIDTH * 0.5, DELETE_BUTTON_WIDTH * 1.2]; // Haptic feedback points
const DELETE_ANIMATION_DURATION = 300;

// Better spring configs for more natural feel
const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 200,
  overshootClamping: false,
};

// Animation timing configurations
const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

/**
 * Manages swipe animations and gestures for the exercise item
 */
export const useSwipeAnimations = (onDelete, index, isDeleting, setIsDeleting, setSwipeConfirmActive) => {
  // Reanimated shared values for swipe animation
  const translateX = useSharedValue(0);
  const deleteProgress = useSharedValue(0); // Track progress as percentage
  const deleteOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const itemHeight = useSharedValue('auto');
  
  // For haptic feedback tracking
  const hapticTriggered1 = useSharedValue(false);
  const hapticTriggered2 = useSharedValue(false);
  
  // Track swipe percentage for UI elements
  const swipePercentage = useDerivedValue(() => {
    return Math.min(100, (-translateX.value / SWIPE_CONFIRM_THRESHOLD) * 100);
  });
  
  // Reset haptic triggers using shared values directly in the worklet
  const resetHapticTriggers = useCallback(() => {
    // This function is now called from JS thread only
    hapticTriggered1.value = false;
    hapticTriggered2.value = false;
  }, [hapticTriggered1, hapticTriggered2]);

  // Function to handle vibration - must be wrapped with runOnJS
  const triggerVibration = useCallback((duration) => {
    Vibration.vibrate(duration);
  }, []);
  
  // Function to update swipe confirm state - must be wrapped with runOnJS
  const updateSwipeConfirmActive = useCallback((active) => {
    setSwipeConfirmActive(active);
  }, [setSwipeConfirmActive]);
  
  // React to swipe percentage changes for haptic feedback
  useAnimatedReaction(
    () => swipePercentage.value,
    (currentValue, previousValue) => {
      'worklet';
      if (previousValue === undefined) return;
      
      // Access and modify shared values in the worklet
      if (currentValue >= 50 && previousValue < 50) {
        if (!hapticTriggered1.value) {
          hapticTriggered1.value = true; // Set directly in the worklet
          runOnJS(triggerVibration)(15); // Short vibration
        }
      }
      
      if (currentValue >= 85 && previousValue < 85) {
        if (!hapticTriggered2.value) {
          hapticTriggered2.value = true; // Set directly in the worklet
          runOnJS(triggerVibration)(25); // Stronger vibration
        }
      }
      
      // Toggle confirmation UI
      if (currentValue >= 75 && previousValue < 75) {
        runOnJS(updateSwipeConfirmActive)(true);
      } else if (currentValue < 75 && previousValue >= 75) {
        runOnJS(updateSwipeConfirmActive)(false);
      }
    }
  );

  // Clean up animations when component unmounts
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

  // Handler for delete with animation sequence
  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    // Subtle shake animation before delete
    rotation.value = withSequence(
      withTiming(-2, { duration: 70 }),
      withTiming(2, { duration: 70 }),
      withTiming(0, { duration: 70 })
    );
    
    // Animate scale down and fade out simultaneously
    scale.value = withTiming(0.9, { duration: DELETE_ANIMATION_DURATION / 2 });
    opacity.value = withTiming(0, { 
      duration: DELETE_ANIMATION_DURATION,
      easing: Easing.out(Easing.quad)
    });
    
    // After fadeout is complete, collapse the height
    itemHeight.value = withTiming(0, { 
      duration: DELETE_ANIMATION_DURATION / 2,
      easing: Easing.out(Easing.cubic)
    }, () => {
      runOnJS(finishDelete)();
    });
    
    // Provide deletion haptic feedback (stronger)
    Vibration.vibrate(40);
    
  }, [isDeleting, scale, opacity, itemHeight, rotation, setIsDeleting]);

  const finishDelete = useCallback(() => {
    if (onDelete) {
      onDelete(index);
    }
    setIsDeleting(false);
    setSwipeConfirmActive(false);
    
    // Reset animation values in case component is reused
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

  // Animation styles
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

  // Base delete button style (always visible during swipe)
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
  
  // Progress indicator for delete confirmation
  const progressStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    width: `${deleteProgress.value}%`,
    backgroundColor: 'white',
    opacity: swipePercentage.value >= 75 ? 0.8 : 0.5,
  }));
  
  // Delete confirmation overlay (appears at threshold)
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

/**
 * Handles the detail panel expansion/collapse animations
 */
export const useDetailAnimations = (initialExpanded) => {
  // RN Animated refs for detail panel animations
  const iconAnim = RNAnimated.useRef(new RNAnimated.Value(initialExpanded ? 1.2 : 1)).current;
  const detailsHeight = RNAnimated.useRef(new RNAnimated.Value(initialExpanded ? 1 : 0)).current;

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
    
    // Optional subtle haptic feedback when expanding/collapsing
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

// Export constants for use in the main component
export {
  DELETE_BUTTON_WIDTH,
  SWIPE_THRESHOLD,
  SWIPE_CONFIRM_THRESHOLD,
  SPRING_CONFIG,
  TIMING_CONFIG,
};
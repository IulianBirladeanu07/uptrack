import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SWIPE } from '../theme';

const useSwipeToDelete = (onDelete) => {
  const translateX = useSharedValue(0);
  const deleteProgress = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this food item?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            translateX.value = withSpring(0, SWIPE.SPRING_CONFIG);
            deleteProgress.value = withSpring(0, SWIPE.SPRING_CONFIG);
          }
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.()
        }
      ]
    );
  }, [onDelete, translateX, deleteProgress]);

  const gesture = Gesture.Pan()
    .activeOffsetX([-SWIPE.ACTIVE_OFFSET, SWIPE.ACTIVE_OFFSET])
    .failOffsetY([-SWIPE.ACTIVE_OFFSET, SWIPE.ACTIVE_OFFSET])
    .onUpdate((event) => {
      const x = Math.max(SWIPE.DELETE_THRESHOLD, Math.min(0, event.translationX));
      const newProgress = Math.abs(x / SWIPE.DELETE_THRESHOLD);

      translateX.value = x;
      deleteProgress.value = newProgress;

      if (!hasTriggeredHaptic.value && newProgress >= 1) {
        hasTriggeredHaptic.value = true;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE.DELETE_THRESHOLD) {
        runOnJS(confirmDelete)();
      } else {
        translateX.value = withSpring(0, SWIPE.SPRING_CONFIG);
        deleteProgress.value = withSpring(0, SWIPE.SPRING_CONFIG);
      }
      hasTriggeredHaptic.value = false;
    });

  const containerStyle = useAnimatedStyle(() => {
    const progress = deleteProgress.value;
    return {
      transform: [
        { translateX: translateX.value },
        { scale: 1 - (progress * SWIPE.CONTAINER_SCALE_REDUCTION) }
      ],
    };
  });

  const trashStyle = useAnimatedStyle(() => {
    const progress = deleteProgress.value;
    return {
      opacity: progress,
      transform: [
        { scale: 1 + (progress * SWIPE.TRASH_ICON_SCALE) },
        { rotate: `${progress * SWIPE.TRASH_ICON_ROTATION}deg` }
      ],
    };
  });

  return { gesture, containerStyle, trashStyle };
};

export default useSwipeToDelete;
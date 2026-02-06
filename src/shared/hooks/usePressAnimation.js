import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SWIPE, PRESS } from '../theme';

const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const animatePress = useCallback(() => {
    scale.value = withTiming(PRESS.SCALE, { duration: PRESS.DURATION }, () => {
      scale.value = withSpring(1, SWIPE.SPRING_CONFIG);
    });
  }, [scale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatePress, pressStyle };
};

export default usePressAnimation;
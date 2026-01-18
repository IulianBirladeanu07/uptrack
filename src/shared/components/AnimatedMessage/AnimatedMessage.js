import React, { useEffect } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { normalize } from '../../hooks/useResponsive';

const { height } = Dimensions.get('window');

const AnimatedMessage = ({ message }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(1, { duration: 300 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, {
        duration: 350,
        easing: Easing.in(Easing.exp),
      });
      opacity.value = withTiming(0, { duration: 250 });
    }, 2300);

    return () => clearTimeout(timer);
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }), []);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.5,
    alignSelf: 'center',
    backgroundColor: 'rgba(21, 27, 35, 0.96)',
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(14),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 9999,
    minWidth: '70%',
    maxWidth: '88%',
    transform: [{ translateY: -normalize(30) }],
  },
  text: {
    color: '#F9FAFB',
    fontSize: normalize(15),
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: normalize(21),
  },
});

export default AnimatedMessage;
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import { normalize } from '../../hooks/useResponsive';

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

const HANDLE_SIZE = normalize(24);
const TRACK_HEIGHT = normalize(6);

Animated.addWhitelistedNativeProps({ text: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const Slider = ({
  minimumValue = 0,
  maximumValue = 120,
  step = 1,
  value,
  onSlidingComplete,
  minimumTrackTintColor = colors.primary,
  maximumTrackTintColor = colors.borderLight,
  thumbTintColor = colors.primary,
  style,
}) => {
  const offset = useSharedValue(0);
  const displayValue = useSharedValue(value || minimumValue);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const effectiveWidth = containerWidth - HANDLE_SIZE;

  const mapOffsetToValue = (offsetVal) => {
    'worklet';
    if (effectiveWidth <= 0) return minimumValue;
    const range = maximumValue - minimumValue;
    const normalized = (offsetVal / effectiveWidth) * range;
    const stepped = Math.round(normalized / step) * step;
    return Math.min(Math.max(minimumValue + stepped, minimumValue), maximumValue);
  };

  const mapValueToOffset = (val) => {
    'worklet';
    if (effectiveWidth <= 0) return 0;
    const range = maximumValue - minimumValue;
    return ((val - minimumValue) / range) * effectiveWidth;
  };

  useEffect(() => {
    offset.value = mapValueToOffset(value);
    displayValue.value = value;
  }, [value, effectiveWidth]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onChange((event) => {
      offset.value = Math.max(
        0,
        Math.min(offset.value + event.changeX, effectiveWidth)
      );
      displayValue.value = mapOffsetToValue(offset.value);
    })
    .onEnd(() => {
      const finalValue = mapOffsetToValue(offset.value);
      displayValue.value = finalValue;
      if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(finalValue);
      }
    });

  const tap = Gesture.Tap()
    .onStart((event) => {
      const tapX = event.x - HANDLE_SIZE / 2;
      offset.value = Math.max(0, Math.min(tapX, effectiveWidth));
      displayValue.value = mapOffsetToValue(offset.value);
      const finalValue = mapOffsetToValue(offset.value);
      if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(finalValue);
      }
    });

  const composed = Gesture.Race(tap, pan);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    width: offset.value + HANDLE_SIZE,
    backgroundColor: minimumTrackTintColor,
  }));

  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(displayValue.value)} min`,
    defaultValue: `${Math.round(displayValue.value)} min`,
  }));

  return (
    <GestureHandlerRootView style={[styles.container, style]} onLayout={handleLayout}>
      <GestureDetector gesture={composed}>
        <View style={[styles.sliderTrackWrapper, { width: containerWidth }]}>
          <View
            style={[styles.sliderTrack, { backgroundColor: maximumTrackTintColor }]}
          >
            <Animated.View style={[styles.minimumTrack, trackStyle]} />
            <Animated.View style={[styles.sliderHandleContainer, sliderStyle]}>
              <View
                style={[
                  styles.sliderHandleBackground,
                  { backgroundColor: maximumTrackTintColor },
                ]}
              />
              <View
                style={[styles.sliderHandle, { backgroundColor: thumbTintColor }]}
              />
            </Animated.View>
          </View>
          <View style={styles.durationBadge}>
            <AnimatedTextInput
              animatedProps={animatedProps}
              style={[styles.durationText, { color: colors.primary }]}
              editable={false}
            />
          </View>
        </View>
      </GestureDetector>

      <View style={[styles.durationIndicators, { width: containerWidth }]}>
        <Animated.Text style={styles.durationIndicator}>
          {minimumValue} min
        </Animated.Text>
        <Animated.Text style={styles.durationIndicator}>
          {(minimumValue + maximumValue) / 2} min
        </Animated.Text>
        <Animated.Text style={styles.durationIndicator}>
          {maximumValue} min
        </Animated.Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  sliderTrackWrapper: {
    width: '100%',
    height: normalize(40),
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: normalize(3),
    position: 'absolute',
    top: '50%',
    marginTop: -(TRACK_HEIGHT / 2),
    left: 0,
  },
  minimumTrack: {
    height: TRACK_HEIGHT,
    borderRadius: normalize(3),
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  sliderHandleContainer: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    position: 'absolute',
    top: '50%',
    marginTop: -(HANDLE_SIZE / 2),
    zIndex: 2,
  },
  sliderHandleBackground: {
    width: HANDLE_SIZE,
    height: TRACK_HEIGHT,
    borderRadius: normalize(3),
    position: 'absolute',
    top: (HANDLE_SIZE - TRACK_HEIGHT) / 2,
    left: 0,
    zIndex: 3,
  },
  sliderHandle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  durationBadge: {
    position: 'absolute',
    bottom: normalize(30),
    right: 0,
    alignSelf: 'center',

  },
  durationText: {
    fontSize: normalize(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  durationIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(4),
    paddingHorizontal: HANDLE_SIZE / 2,
  },
  durationIndicator: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default Slider;
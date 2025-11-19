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
import { COLORS } from '../../../features/workout/screens/CreateWorkoutScreen/CreateWorkoutScreenStyle';
import { normalize } from '../../hooks/useResponsive';

const HANDLE_SIZE = normalize(20);
const TRACK_HEIGHT = normalize(8);

Animated.addWhitelistedNativeProps({ text: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const Slider = ({
  minimumValue = 0,
  maximumValue = 120,
  step = 1,
  value,
  onSlidingComplete,
  minimumTrackTintColor = COLORS.primary,
  maximumTrackTintColor = COLORS.divider,
  thumbTintColor = '#286b8fff',
  style,
}) => {
  const offset = useSharedValue(0);
  const displayValue = useSharedValue(value || minimumValue);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Adjust effective width to account for handle size
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
    .minDistance(2)
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

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    width: offset.value + HANDLE_SIZE, // Track extends to handle's right edge
    backgroundColor: minimumTrackTintColor,
  }));

  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(displayValue.value)} min`,
    defaultValue: `${Math.round(displayValue.value)} min`,
  }));

  return (
    <GestureHandlerRootView style={[styles.container, style]} onLayout={handleLayout}>
      <View style={[styles.sliderTrackWrapper, { width: containerWidth }]}>
        <View
          style={[styles.sliderTrack, { backgroundColor: maximumTrackTintColor }]}
        >
          <Animated.View style={[styles.minimumTrack, trackStyle]} />
          <GestureDetector 
            gesture={pan}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
            <Animated.View style={[styles.sliderHandleContainer, sliderStyle]}>
              {/* Background layer to mask minimumTrack */}
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
          </GestureDetector>
        </View>
        <View style={styles.durationBadge}>
          <AnimatedTextInput
            animatedProps={animatedProps}
            style={[styles.durationText, { color: COLORS.primary }]}
            editable={false}
          />
        </View>
      </View>

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
    gap: normalize(8),
    width: '100%',
    marginTop: normalize(4)
  },
  sliderTrackWrapper: {
    width: '100%',
    height: TRACK_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: normalize(4),
    position: 'absolute',
    top: 0,
    left: 0,
  },
  minimumTrack: {
    height: TRACK_HEIGHT,
    borderRadius: normalize(4),
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  sliderHandleContainer: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    position: 'absolute',
    top: -(HANDLE_SIZE - TRACK_HEIGHT) / 2,
    zIndex: 2,
  },
  sliderHandleBackground: {
    width: HANDLE_SIZE,
    height: TRACK_HEIGHT,
    borderRadius: normalize(4),
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
  },
  durationBadge: {
    position: 'absolute',
    top: normalize(-38),
    right: 0,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
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
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default Slider;
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CustomPieChart = ({ 
  data, 
  size = 200, 
  strokeWidth = 24, 
  innerRadius = 0.4,
  animationDuration = 1200,
  style 
}) => {
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    
    animatedValues.forEach(val => val.setValue(0));

    const animations = animatedValues.map((animValue, index) => 
      Animated.timing(animValue, {
        toValue: 1,
        duration: animationDuration,
        delay: index * 150,
        useNativeDriver: false,
      })
    );

    Animated.sequence([
      Animated.delay(300),
      Animated.stagger(100, animations)
    ]).start();
  }, [data, animationDuration]);

  let cumulativePercentage = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const strokeDasharray = circumference * (percentage / 100);
    const strokeDashoffset = circumference * (1 - cumulativePercentage / 100);
    
    const segment = {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      animatedValue: animatedValues[index]
    };
    
    cumulativePercentage += percentage;
    return segment;
  });

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <G>
          {}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {}
          {segments.map((segment, index) => (
            <AnimatedCircle
              key={segment.key || `segment-${index}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={segment.animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, strokeWidth]
              })}
              fill="transparent"
              strokeDasharray={`${segment.strokeDasharray} ${circumference}`}
              strokeDashoffset={segment.animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [circumference, circumference - segment.strokeDasharray]
              })}
              strokeLinecap="round"
              opacity={segment.animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.9]
              })}
              transform={`rotate(${segments.slice(0, index).reduce((sum, s) => sum + (s.percentage / 100) * 360, 0)} ${center} ${center})`}
            />
          ))}
          
          {}
          {innerRadius > 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius * innerRadius}
              fill="rgba(2, 17, 27, 0.8)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={1}
            />
          )}
        </G>
      </Svg>
    </View>
  );
};

export default CustomPieChart;
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Animated, AppState } from 'react-native';

const WorkoutTimer = forwardRef(({ timerRingRotation, styles }, ref) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const backgroundTime = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const animationRef = useRef(null);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  useImperativeHandle(ref, () => ({
    getTotalTime: () => elapsedTime + backgroundTime.current,
    stopTimer: () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    },
  }));

  useEffect(() => {
    const startTimer = () => {
      const tick = (now) => {
        const delta = (now - lastActiveTime.current) / 1000;
        if (delta >= 1) {
          setElapsedTime(prev => prev + Math.floor(delta));
          lastActiveTime.current = now - (delta % 1) * 1000;
        }
        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);
    };

    startTimer();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        lastActiveTime.current = Date.now();
      } else if (nextAppState === 'active') {
        backgroundTime.current += (Date.now() - lastActiveTime.current) / 1000;
        lastActiveTime.current = Date.now();
        startTimer();
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.timerContainer}>
      <Animated.View
        style={[
          styles.timerProgress,
          {
            transform: [{
              rotate: timerRingRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          },
        ]}
      />
      <View style={styles.timerInner}>
        <Text style={styles.timerText}>{formatTime(elapsedTime + backgroundTime.current)}</Text>
      </View>
    </View>
  );
});

export default WorkoutTimer;
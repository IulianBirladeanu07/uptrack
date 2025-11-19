import React, { useState, useEffect } from 'react';
import { Text, Animated } from 'react-native';

const AnimatedMessage = ({ message }) => {
  const [fadeAnim] = useState(new Animated.Value(0)); 

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  }, [message]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        position: 'absolute',
        bottom: '10%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 5,
      }}
    >
      <Text style={{ color: 'white' }}>{message}</Text>
    </Animated.View>
  );
};

export default AnimatedMessage;
import React, { useState, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { normalize } from '../../hooks/useResponsive';

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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(12),
    zIndex: 9999,
    elevation: 9999,
  },
  text: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '600',
  },
});
export default AnimatedMessage;
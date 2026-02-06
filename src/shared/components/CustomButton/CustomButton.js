
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import { normalize } from '../../hooks/useResponsive';
const CustomButton = ({ icon, label, onPress, isActive }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const startAnimation = () => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const endAnimation = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.activeButton,
        { transform: [{ scale: scaleValue }] },
      ]}
      onPress={onPress}
      onPressIn={startAnimation}
      onPressOut={endAnimation}
    >
      {icon}
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: normalize(10),
    padding: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: normalize(5),
  },  
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: normalize(5),
    fontSize: normalize(14),
  },
  activeButton: {
  },
});

export default CustomButton;

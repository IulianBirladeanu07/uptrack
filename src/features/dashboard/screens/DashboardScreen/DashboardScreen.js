import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../../../../shared/hooks/useResponsive';
import styles from './DashboardScreenStyles';

const screens = [
  { name: 'Dashboard', icon: 'view-dashboard', iconType: 'MaterialCommunityIcons' },
  { name: 'Workout', icon: 'dumbbell', iconType: 'MaterialCommunityIcons' },
  { name: 'Nutrition', icon: 'restaurant', iconType: 'MaterialIcons' },
  { name: 'Progress', icon: 'insert-chart', iconType: 'MaterialIcons' },
];

const NavItem = ({ screen, isActive, onPress, index }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(glowAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    if (isActive) {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
    }
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      tension: 400,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  };

  const renderIcon = () => {
    const iconProps = {
      size: normalize(24),
      color: isActive ? '#FF9500' : '#9ca3af'
    };

    switch (screen.iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={screen.icon} {...iconProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={screen.icon} {...iconProps} />;
      default:
        return <Ionicons name={screen.icon} {...iconProps} />;
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <TouchableOpacity 
      style={styles.navItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View 
        style={[
          styles.navItemContent,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {isActive && (
          <Animated.View 
            style={[
              styles.activeBackground,
              { opacity: glowOpacity }
            ]} 
          />
        )}
        
        <Animated.View 
          style={[
            styles.iconWrapper,
            { transform: [{ scale: iconScale }] }
          ]}
        >
          {renderIcon()}
        </Animated.View>
        
        <Text 
          style={[
            styles.navLabel,
            isActive && styles.navLabelActive
          ]}
          numberOfLines={1}
        >
          {screen.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const handlePress = (screenName) => {
    if (route.name !== screenName) {
      navigation.navigate(screenName);
    }
  };

  const isButtonActive = (screenName) => route.name === screenName;

  return (
    <View style={styles.container}>
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + normalize(10) }]}>
        {screens.map((screen, index) => (
          <NavItem
            key={screen.name}
            screen={screen}
            index={index}
            isActive={isButtonActive(screen.name)}
            onPress={() => handlePress(screen.name)}
          />
        ))}
      </View>
    </View>
  );
};

export default DashboardScreen;
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';

// Updated color palette matching weight tracker
const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  danger: '#FF453A',
  purple: '#9333EA',
  yellow: '#FF9F0A',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const menuItems = [
  {
    icon: 'food-variant',
    label: 'Add New Food',
    sublabel: 'without barcode',
    type: 'foodWithoutBarcode',
    color: colors.success,
    emoji: '🥗'
  },
  {
    icon: 'barcode-scan',
    label: 'Add New Food',
    sublabel: 'with barcode',
    type: 'foodWithBarcode',
    color: colors.purple,
    emoji: '📊'
  },
  {
    icon: 'silverware-fork-knife',
    label: 'Add New Meals',
    sublabel: 'Create a meal combination',
    type: 'meals',
    color: colors.primary,
    emoji: '🍽️'
  },
  {
    icon: 'calculator-variant',
    label: 'Add Calories',
    sublabel: 'Quick calorie entry',
    type: 'calories',
    color: colors.yellow,
    emoji: '🔢'
  }
];

const FabMenu = React.memo(({ isSearching = false, navigation, meal }) => {
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  
  // Single animated value for all animations
  const animationValue = useRef(new Animated.Value(0)).current;

  // Memoize animated styles to prevent recalculation
  const animatedStyles = useMemo(() => ({
    backdrop: {
      opacity: animationValue,
    },
    menuContainer: {
      transform: [{
        translateY: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
          extrapolate: 'clamp',
        })
      }],
      opacity: animationValue,
    },
    fabRotation: {
      transform: [{
        rotate: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        })
      }],
    },
    menuItems: menuItems.map((_, index) => ({
      opacity: animationValue.interpolate({
        inputRange: [0, 0.3 + (index * 0.15), 1],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
      }),
      transform: [{
        translateY: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
          extrapolate: 'clamp',
        })
      }, {
        scale: animationValue.interpolate({
          inputRange: [0, 0.3 + (index * 0.15), 1],
          outputRange: [0.8, 0.8, 1],
          extrapolate: 'clamp',
        })
      }]
    }))
  }), [animationValue]);

  // Memoize animation function
  const animate = useCallback((toExpanded) => {
    Animated.timing(animationValue, {
      toValue: toExpanded ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  const toggleMenu = useCallback(() => {
    if (isSearching) return;
    const newExpanded = !isFabExpanded;
    setIsFabExpanded(newExpanded);
    animate(newExpanded);
  }, [isSearching, isFabExpanded, animate]);

  const handleItemPress = useCallback((type) => {
    navigation.navigate('CustomFood', { type, meal });
    setIsFabExpanded(false);
    animate(false);
  }, [navigation, meal, animate]);

  // Memoize menu items to prevent re-renders
  const memoizedMenuItems = useMemo(() => 
    menuItems.map((item, index) => {
      const iconStyle = [
        styles.menuIcon, 
        { 
          backgroundColor: `${item.color}15`,
          borderColor: `${item.color}30`
        }
      ];

      return (
        <Animated.View
          key={item.type}
          style={[
            styles.menuItemWrapper,
            animatedStyles.menuItems[index]
          ]}
        >
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => handleItemPress(item.type)}
            activeOpacity={0.7}
          >
            <View style={iconStyle}>
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSublabel}>{item.sublabel}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }),
    [animatedStyles.menuItems, handleItemPress]
  );

  if (isSearching) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          animatedStyles.backdrop,
          {
            pointerEvents: isFabExpanded ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      </Animated.View>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.9}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View
          style={[
            styles.fabIconContainer,
            animatedStyles.fabRotation,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={normalize(22)} color={colors.textPrimary} />
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom Sheet Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          animatedStyles.menuContainer,
        ]}
        pointerEvents={isFabExpanded ? 'auto' : 'none'}
      >
        {/* Menu Handle */}
        <View style={styles.menuHandle} />

        {/* Menu Header */}
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderTitle}>Quick Actions</Text>
          <Text style={styles.menuHeaderSubtitle}>Choose an option to continue</Text>
        </View>

        {/* Menu Items */}
        {memoizedMenuItems}
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 19, 0.95)',
    zIndex: 999,
  },
  fab: {
    position: 'absolute',
    top: normalize(50),
    right: normalize(25),
    width: normalize(40),
    height: normalize(40),
    backgroundColor: colors.primary,
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 1001,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(30),
    paddingTop: normalize(12),
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  menuHandle: {
    width: normalize(40),
    height: normalize(4),
    backgroundColor: colors.textTertiary,
    borderRadius: normalize(2),
    alignSelf: 'center',
    marginBottom: normalize(20),
    opacity: 0.5,
  },
  menuHeader: {
    marginBottom: normalize(16),
    paddingHorizontal: normalize(4),
  },
  menuHeaderTitle: {
    fontSize: normalize(20),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: normalize(4),
    letterSpacing: -0.3,
  },
  menuHeaderSubtitle: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  menuItemWrapper: {
    marginBottom: normalize(8),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  menuEmoji: {
    fontSize: normalize(22),
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: normalize(3),
    letterSpacing: 0.2,
  },
  menuSublabel: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
});

export default FabMenu;
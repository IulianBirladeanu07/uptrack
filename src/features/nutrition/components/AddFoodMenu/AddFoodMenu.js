import React, { useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const menuItems = [
  {
    icon: 'food-apple',
    label: 'New Food',
    sublabel: 'create food entry',
    type: 'foodWithoutBarcode',
    color: colors.accent.success,
    bgColor: colors.faded.successAlt,
    borderColor: colors.border.successAlt,
  },
  {
    icon: 'barcode',
    label: 'Barcoded Food',
    sublabel: 'add to database',
    type: 'foodWithBarcode',
    color: colors.accent.purple,
    bgColor: colors.faded.purple,
    borderColor: colors.border.default,
  },
  {
    icon: 'silverware-fork-knife',
    label: 'New Meal',
    sublabel: 'meal combination',
    type: 'meals',
    color: colors.accent.cyan,
    bgColor: colors.faded.cyan,
    borderColor: colors.border.cyan,
  },
  {
    icon: 'calculator-variant',
    label: 'Quick Calories',
    sublabel: 'calorie-only entry',
    type: 'calories',
    color: colors.accent.primary,
    bgColor: colors.faded.primary,
    borderColor: colors.border.primary,
  }
];

const AddFoodMenu = React.memo(({ isExpanded, onClose, navigation, meal }) => {
  const insets = useSafeAreaInsets();
  const animationValue = useRef(new Animated.Value(0)).current;

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

  const animate = useCallback((toExpanded) => {
    Animated.timing(animationValue, {
      toValue: toExpanded ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  }, [animationValue]);

  React.useEffect(() => {
    animate(isExpanded);
  }, [isExpanded, animate]);

  const handleItemPress = useCallback((type) => {
    onClose();
    setTimeout(() => {
      navigation.navigate('CustomFood', { type, meal });
    }, 250);
  }, [navigation, meal, onClose]);

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const memoizedMenuItems = useMemo(() => 
    menuItems.map((item, index) => (
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
          <View style={[
            styles.menuIcon, 
            { 
              backgroundColor: item.bgColor,
              borderColor: item.borderColor,
            }
          ]}>
            <MaterialCommunityIcons 
              name={item.icon} 
              size={spacing.iconLg} 
              color={item.color} 
            />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSublabel}>{item.sublabel}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )),
    [animatedStyles.menuItems, handleItemPress]
  );

  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!shouldRender) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          animatedStyles.backdrop,
          {
            pointerEvents: isExpanded ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.menuContainer,
          { paddingBottom: spacing[7] + insets.bottom },
          animatedStyles.menuContainer,
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={styles.menuHandle} />

        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderTitle}>Create Food</Text>
          <Text style={styles.menuHeaderSubtitle}>Add new entries to your database</Text>
        </View>

        {memoizedMenuItems}
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius[4],
    borderTopRightRadius: radius[4],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -spacing[1],
    },
    shadowOpacity: 0.3,
    shadowRadius: spacing[4],
    elevation: 16,
  },
  menuHandle: {
    width: spacing[10],
    height: spacing[1],
    backgroundColor: colors.text.quaternary,
    borderRadius: radius[1],
    alignSelf: 'center',
    marginBottom: spacing[4],
    opacity: 0.5,
  },
  menuHeader: {
    marginBottom: spacing[3],
  },
  menuHeaderTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
    letterSpacing: -0.3,
  },
  menuHeaderSubtitle: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  menuItemWrapper: {
    marginBottom: spacing[2],
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.faded.surfaceLight,
    borderRadius: radius[3],
    padding: spacing[3],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  menuIcon: {
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[2],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  menuSublabel: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
});

export default AddFoodMenu;
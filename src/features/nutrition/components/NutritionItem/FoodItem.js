import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../shared/hooks/useResponsive';

const CONSTANTS = {
  DELETE_BUTTON_WIDTH: normalize(50),
  SPRING_CONFIG: { damping: 20, stiffness: 300 },
  TIMING_CONFIG: { duration: 150 },
  MAX_NAME_LENGTH: 35,
  TRUNCATE_THRESHOLD: 0.6,
};

const formatFoodName = (productName) => {
  const rawName = productName || 'No Name';
  let foodName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  foodName = foodName.replace(/[\-\,\.;:!?]+(\s*)$/, '').trim();

  if (foodName.length > CONSTANTS.MAX_NAME_LENGTH) {
    const truncated = foodName.substring(0, CONSTANTS.MAX_NAME_LENGTH);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > CONSTANTS.MAX_NAME_LENGTH * CONSTANTS.TRUNCATE_THRESHOLD) {
      foodName = truncated.substring(0, lastSpaceIndex);
    } else {
      foodName = truncated;
    }
    foodName = foodName.replace(/[\-\,\.;:!?]+(\s*)$/, '').trim();
  }

  return foodName;
};

const getMacros = (item) => {
  const macros = [];
  if (item.carbohydrates > 0) {
    macros.push({ value: Math.round(item.carbohydrates), label: 'C', style: styles.macroCarbs });
  }
  if (item.protein > 0) {
    macros.push({ value: Math.round(item.protein), label: 'P', style: styles.macroProtein });
  }
  if (item.fats > 0) {
    macros.push({ value: Math.round(item.fats), label: 'F', style: styles.macroFat });
  }
  return macros;
};

const FoodImage = memo(({ uri, icon, isScrolling, style }) => (
  <View style={style}>
    {uri ? (
      <Image
        source={{ uri }}
        style={styles.imageContent}
        resizeMode="cover"
        fadeDuration={isScrolling ? 0 : 100}
        cache="force-cache"
      />
    ) : (
      <Text style={styles.imagePlaceholder}>{icon || 'No Image'}</Text>
    )}
  </View>
));

const QuantityLabel = memo(({ quantity, unit }) => {
  if (!quantity || !unit) return null;
  return (
    <View style={styles.quantityLabel}>
      <Text style={styles.quantityLabelText}>
        {quantity} {unit}
      </Text>
    </View>
  );
});

const MacroLabels = memo(({ macros }) => (
  <>
    {macros.map((macro, index) => (
      <Text key={index} style={[styles.macroLabel, macro.style]}>
        {macro.value}{macro.label}
      </Text>
    ))}
  </>
));

const PlusButton = memo(({ isChecked, onPress, showButton }) => {
  if (!showButton) return null;
  return (
    <View
      style={[
        styles.plusButton,
        isChecked ? styles.plusButtonSelected : styles.plusButtonAdd,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        hitSlop={styles.hitSlop}
        delayPressIn={0}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isChecked ? 'checkmark' : 'add'}
          size={normalize(18)}
          color={isChecked ? '#10b981' : '#ff8535'}
        />
      </TouchableOpacity>
    </View>
  );
});

const DeleteButton = memo(({ onPress, animatedStyle }) => (
  <Animated.View style={[styles.deleteButton, animatedStyle]}>
    <TouchableOpacity
      onPress={onPress}
      style={styles.deleteTouch}
      hitSlop={styles.hitSlop}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
    </TouchableOpacity>
  </Animated.View>
));

const CaloriesDisplay = memo(({ calories, customStyles }) => (
  <View style={styles.caloriesDisplay}>
    <Text style={customStyles.caloriesValue}>{calories}</Text>
    <Text style={styles.caloriesLabel}>kcal</Text>
  </View>
));

const FoodInfo = memo(
  ({ foodName, calories, quantity, unit, macros, isChecked, showPlusButton, onPlusPress, customStyles }) => (
    <View style={styles.foodInfo}>
      <Text style={customStyles.name} numberOfLines={1}>
        {foodName}
      </Text>
      <View style={styles.bottomRow}>
        <View style={styles.foodDetails}>
          <QuantityLabel quantity={quantity} unit={unit} />
          <MacroLabels macros={macros} />
        </View>
      </View>
      <View style={styles.caloriesContainer}>
        <CaloriesDisplay calories={calories} customStyles={customStyles} />
        <PlusButton isChecked={isChecked} onPress={onPlusPress} showButton={showPlusButton} />
      </View>
    </View>
  )
);

const useSwipeAnimation = (shouldAnimate) => {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const gesture = shouldAnimate
    ? Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-8, 8])
        .minPointers(1)
        .maxPointers(1)
        .onUpdate((event) => {
          const dragX = Math.min(0, event.translationX);
          translateX.value = dragX > -CONSTANTS.DELETE_BUTTON_WIDTH ? dragX : -CONSTANTS.DELETE_BUTTON_WIDTH;
          deleteOpacity.value = interpolate(
            -dragX,
            [0, CONSTANTS.DELETE_BUTTON_WIDTH],
            [0, 1],
            Extrapolation.CLAMP
          );
        })
        .onEnd((event) => {
          const shouldSnap = event.translationX < -CONSTANTS.DELETE_BUTTON_WIDTH * 0.5;
          if (shouldSnap) {
            translateX.value = withSpring(-CONSTANTS.DELETE_BUTTON_WIDTH, CONSTANTS.SPRING_CONFIG);
            deleteOpacity.value = withSpring(1, CONSTANTS.SPRING_CONFIG);
          } else {
            translateX.value = withSpring(0, CONSTANTS.SPRING_CONFIG);
            deleteOpacity.value = withSpring(0, CONSTANTS.SPRING_CONFIG);
          }
        })
    : null;

  return { translateX, deleteOpacity, gesture };
};

const usePressAnimation = () => {
  const scale = useSharedValue(1);
  const animatePress = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 100 }, () => {
      scale.value = withSpring(1, CONSTANTS.SPRING_CONFIG);
    });
  }, [scale]);

  return { scale, animatePress };
};

const useStyles = (customStyleProps) => {
  return useMemo(
    () => ({
      container: customStyleProps.foodContainer || customStyleProps.foodContainerStyle || styles.container,
      item: customStyleProps.foodItemContainer || styles.foodItem,
      name: customStyleProps.foodName || styles.foodName,
      caloriesValue: customStyleProps.foodCaloriesValue || styles.foodCaloriesValue,
      image: customStyleProps.foodImage || styles.foodImage,
    }),
    [customStyleProps]
  );
};

const FoodItem = memo(
  ({
    item,
    onPress,
    onSwipeableOpen,
    isFoodDeletable = false,
    onPlusPress,
    showPlusButton = false,
    isScrolling = false,
    foodContainer,
    foodName: foodNameStyle,
    foodCaloriesValue: foodCaloriesValueStyle,
    foodImage: foodImageStyle,
    foodItemContainer: foodItemContainerStyle,
    foodContainerStyle,
  }) => {
    const [isChecked, setIsChecked] = useState(false);
    
    const itemData = useMemo(
      () => ({
        calories: Math.round(item.calories || 0),
        foodName: formatFoodName(item.productName),
        macros: getMacros(item),
      }),
      [item.calories, item.productName, item.protein, item.carbohydrates, item.fats]
    );

    const customStyles = useStyles({
      foodContainer,
      foodContainerStyle,
      foodItemContainer: foodItemContainerStyle,
      foodName: foodNameStyle,
      foodCaloriesValue: foodCaloriesValueStyle,
      foodImage: foodImageStyle,
    });

    const shouldAnimate = isFoodDeletable && !isScrolling;
    const { translateX, deleteOpacity, gesture } = useSwipeAnimation(shouldAnimate);
    const { scale, animatePress } = usePressAnimation();

    const handlePlusPress = useCallback(() => {
      setIsChecked((prev) => !prev);
      onPlusPress?.(item);
    }, [item, onPlusPress]);

    const handlePress = useCallback(() => {
      animatePress();
      onPress?.(item);
    }, [item, onPress, animatePress]);

    const handleDelete = useCallback(() => {
      onSwipeableOpen?.(item);
    }, [item, onSwipeableOpen]);

    const containerStyle = useAnimatedStyle(() => ({
      transform: shouldAnimate
        ? [{ translateX: translateX.value }, { scale: scale.value }]
        : [{ scale: scale.value }],
    }), [shouldAnimate]);

    const deleteButtonStyle = useAnimatedStyle(() => ({
      width: CONSTANTS.DELETE_BUTTON_WIDTH,
      opacity: deleteOpacity.value,
    }), []);

    const Content = (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.touchable}
        activeOpacity={0.9}
        delayPressIn={0}
        delayLongPress={300}
        delayPressOut={0}
        disabled={false}
        shouldActivateOnStart={false}
        pressRetentionOffset={{ top: 10, left: 10, bottom: 10, right: 10 }}
      >
        <View style={customStyles.item}>
          <FoodImage uri={item.image} icon={itemData.icon} style={customStyles.image} isScrolling={isScrolling} />
          <FoodInfo
            foodName={itemData.foodName}
            calories={itemData.calories}
            quantity={item.quantity}
            unit={item.unit}
            macros={itemData.macros}
            isChecked={isChecked}
            showPlusButton={showPlusButton}
            onPlusPress={handlePlusPress}
            customStyles={customStyles}
          />
        </View>
      </TouchableOpacity>
    );

  if (!isFoodDeletable) {
    return (
      <View style={[
        customStyles.container,
        isChecked && styles.containerSelected
      ]}>
        {Content}
      </View>
    );
  }

  return (
    <View style={[
      customStyles.container,
      isChecked && styles.containerSelected
    ]}>
      <DeleteButton onPress={handleDelete} animatedStyle={deleteButtonStyle} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={containerStyle}>{Content}</Animated.View>
      </GestureDetector>
    </View>
  );
  },
);

const styles = StyleSheet.create({
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  
  container: {
    position: 'relative',
    backgroundColor: '#151B23',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: normalize(12),
    marginBottom: normalize(10),
    borderWidth: 1,
    paddingHorizontal: normalize(7),
    paddingVertical: normalize(7),
  },
  
  containerSelected: {
    borderColor: 'rgba(255, 133, 53, 0.6)',
    borderWidth: normalize(1.5),
    backgroundColor: 'rgba(22, 25, 28, 10)',
  },
  
  touchable: {
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(4),
    overflow: 'visible',
    minHeight: normalize(48),
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  
  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: normalize(8),
    position: 'relative',
  },
  
  foodImage: {
    width: normalize(40),
    height: normalize(40),
    padding: normalize(5),
    borderRadius: normalize(10),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  
  imageContent: {
    width: '100%',
    height: '100%',
  },
  
  imagePlaceholder: {
    fontSize: normalize(16),
    color: '#ffffff',
    textAlign: 'center',
  },
  
  foodInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: normalize(40),
  },
  
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(5),
    flexWrap: 'wrap',
    flex: 1,
  },
  
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(5),
    position: 'absolute',
    right: 0,
    top: '10%',
  },
  
  caloriesDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: normalize(45),
  },
  
  foodName: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: normalize(16),
  },
  
  foodCaloriesValue: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#FFA726',
    textAlign: 'center',
    lineHeight: normalize(20),
  },
  
  caloriesLabel: {
    fontSize: normalize(10),
    fontWeight: '500',
    color: '#BDBDBD',
    textAlign: 'center',
    lineHeight: normalize(12),
    marginTop: normalize(1),
  },
  
  plusButton: {
    alignSelf: 'center',
    padding: normalize(8),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  
  plusButtonAdd: {
    backgroundColor: 'rgba(255, 133, 53, 0.06)',
    borderWidth: normalize(1),
    borderColor: 'rgba(255, 133, 53, 0.15)',
    shadowColor: '#FF8535',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  plusButtonSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: normalize(1),
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#10b981',
  },
  
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: normalize(14),
    borderBottomRightRadius: normalize(14),
    zIndex: 2,
  },
  
  deleteTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(8),
  },
  
  quantityLabel: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalize(5),
  },
  
  quantityLabelText: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#b0bec5',
    lineHeight: normalize(12),
  },
  
  macroLabel: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(3),
    borderRadius: normalize(5),
    fontSize: normalize(10),
    fontWeight: '600',
    lineHeight: normalize(13),
  },
  
  macroProtein: {
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    color: '#ba68c8',
  },
  
  macroCarbs: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    color: '#81c784',
  },
  
  macroFat: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    color: '#2196f3',
  },
});

export default memo(FoodItem);
import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';
import useSwipeToDelete from '../../../../shared/hooks/useSwipeToDelete';
import usePressAnimation from '../../../../shared/hooks/usePressAnimation';
import formatFoodName from '../../../../shared/utils/formatFoodName';

const getMacros = (item, macroLabelStyle) => {
  const baseStyle = macroLabelStyle || styles.macroLabel;
  const macros = [];
  if (item.carbohydrates > 0) {
    macros.push({ value: Math.round(item.carbohydrates), label: 'C', style: [baseStyle, styles.macroCarbs] });
  }
  if (item.protein > 0) {
    macros.push({ value: Math.round(item.protein), label: 'P', style: [baseStyle, styles.macroProtein] });
  }
  if (item.fats > 0) {
    macros.push({ value: Math.round(item.fats), label: 'F', style: [baseStyle, styles.macroFat] });
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

const QuantityLabel = memo(({ quantity, unit, labelStyle, textStyle }) => {
  if (!quantity || !unit) return null;
  return (
    <View style={labelStyle || styles.quantityLabel}>
      <Text style={textStyle || styles.quantityLabelText}>
        {quantity} {unit}
      </Text>
    </View>
  );
});

const MacroLabels = memo(({ macros }) => (
  <>
    {macros.map((macro, index) => (
      <Text key={index} style={macro.style}>
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
          size={spacing[4]}
          color={isChecked ? colors.accent.success : colors.accent.primaryAlt}
        />
      </TouchableOpacity>
    </View>
  );
});

const CaloriesDisplay = memo(({ calories, caloriesValueStyle }) => (
  <View style={styles.caloriesDisplay}>
    <Text style={caloriesValueStyle}>{calories}</Text>
    <Text style={styles.caloriesLabel}>kcal</Text>
  </View>
));

const FoodInfo = memo(
  ({ 
    foodName, 
    calories, 
    quantity, 
    unit, 
    macros, 
    isChecked, 
    showPlusButton, 
    onPlusPress, 
    nameStyle, 
    caloriesValueStyle, 
    compact,
    quantityLabelStyle,
    quantityLabelTextStyle,
  }) => (
    <View style={[styles.foodInfo, compact && styles.foodInfoCompact]}>
      <Text style={nameStyle} numberOfLines={1}>
        {foodName}
      </Text>
      <View style={styles.bottomRow}>
        <View style={styles.foodDetails}>
          <QuantityLabel 
            quantity={quantity} 
            unit={unit} 
            labelStyle={quantityLabelStyle}
            textStyle={quantityLabelTextStyle}
          />
          <MacroLabels macros={macros} />
        </View>
      </View>
      <View style={styles.caloriesContainer}>
        <CaloriesDisplay calories={calories} caloriesValueStyle={caloriesValueStyle} />
        <PlusButton isChecked={isChecked} onPress={onPlusPress} showButton={showPlusButton} />
      </View>
    </View>
  )
);

const FoodItem = memo(
  ({
    item,
    onPress,
    onSwipeableOpen,
    isFoodDeletable = false,
    onPlusPress,
    showPlusButton = false,
    isScrolling = false,
    compact = false,
    foodContainer,
    foodName: foodNameStyle,
    foodCaloriesValue: foodCaloriesValueStyle,
    foodImage: foodImageStyle,
    foodItemContainer: foodItemContainerStyle,
    foodContainerStyle,
    quantityLabel: quantityLabelStyle,
    quantityLabelText: quantityLabelTextStyle,
    macroLabel: macroLabelStyle,
  }) => {
    const [isChecked, setIsChecked] = useState(false);

    const itemData = useMemo(
      () => ({
        calories: Math.round(item.calories || 0),
        foodName: formatFoodName(item.productName),
        macros: getMacros(item, macroLabelStyle),
      }),
      [item.calories, item.productName, item.protein, item.carbohydrates, item.fats, macroLabelStyle]
    );

    const resolvedStyles = useMemo(
      () => ({
        container: foodContainer || foodContainerStyle || (compact ? styles.containerCompact : styles.container),
        item: foodItemContainerStyle || styles.foodItem,
        name: foodNameStyle || styles.foodName,
        caloriesValue: foodCaloriesValueStyle || styles.foodCaloriesValue,
        image: foodImageStyle || (compact ? styles.foodImageCompact : styles.foodImage),
      }),
      [foodContainer, foodContainerStyle, foodItemContainerStyle, foodNameStyle, foodCaloriesValueStyle, foodImageStyle, compact]
    );

    const handleDelete = useCallback(() => {
      onSwipeableOpen?.(item);
    }, [item, onSwipeableOpen]);

    const { gesture, containerStyle, trashStyle } = useSwipeToDelete(handleDelete);
    const { animatePress, pressStyle } = usePressAnimation();

    const handlePlusPress = useCallback(() => {
      setIsChecked((prev) => !prev);
      onPlusPress?.(item);
    }, [item, onPlusPress]);

    const handlePress = useCallback(() => {
      animatePress();
      onPress?.(item);
    }, [item, onPress, animatePress]);

    const Content = (
      <TouchableOpacity
        onPress={handlePress}
        style={compact ? styles.touchableCompact : styles.touchable}
        activeOpacity={0.9}
        delayPressIn={0}
      >
        <View style={resolvedStyles.item}>
          <FoodImage uri={item.image} icon={item.icon} style={resolvedStyles.image} isScrolling={isScrolling} />
          <FoodInfo
            foodName={itemData.foodName}
            calories={itemData.calories}
            quantity={item.quantity}
            unit={item.unit}
            macros={itemData.macros}
            isChecked={isChecked}
            showPlusButton={showPlusButton}
            onPlusPress={handlePlusPress}
            nameStyle={resolvedStyles.name}
            caloriesValueStyle={resolvedStyles.caloriesValue}
            compact={compact}
            quantityLabelStyle={quantityLabelStyle}
            quantityLabelTextStyle={quantityLabelTextStyle}
          />
        </View>
      </TouchableOpacity>
    );

    if (!isFoodDeletable) {
      return (
        <Animated.View style={[resolvedStyles.container, isChecked && styles.containerSelected, pressStyle]}>
          {Content}
        </Animated.View>
      );
    }

    return (
      <View style={[resolvedStyles.container, isChecked && styles.containerSelected]}>
        <View style={styles.deleteButtonContainer}>
          <Animated.View style={[styles.deleteIconWrapper, trashStyle]}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={spacing[5]}
              color={colors.accent.errorDark}
            />
          </Animated.View>
        </View>
        <GestureDetector gesture={gesture}>
          <Animated.View style={containerStyle}>{Content}</Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = createStyles(() => ({
  hitSlop: { top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] },

  container: {
    position: 'relative',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderRadius: radius[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    paddingHorizontal: spacing[2] - 2,
    paddingVertical: spacing[2] - 2,
  },

  containerCompact: {
    position: 'relative',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    borderRadius: radius[3],
    marginBottom: spacing[1],
    borderWidth: 1,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },

  containerSelected: {
    borderColor: colors.border.primarySelected,
    borderWidth: 1.5,
    backgroundColor: colors.background.selectedCard,
  },

  touchable: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[1],
    overflow: 'visible',
    minHeight: spacing[12],
    backgroundColor: 'transparent',
  },

  touchableCompact: {
    paddingHorizontal: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
  },

  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    position: 'relative',
  },

  foodImage: {
    width: spacing[9],
    height: spacing[9],
    padding: spacing[1],
    borderRadius: radius[3],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.faded.surfaceLight,
  },

  foodImageCompact: {
    width: spacing[7],
    height: spacing[7],
    padding: spacing[1],
    borderRadius: radius[2],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.faded.surfaceLight,
  },

  imageContent: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    textAlign: 'center',
  },

  foodInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: spacing[9],
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flexWrap: 'wrap',
    flex: 1,
  },

  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    position: 'absolute',
    right: 0,
    top: '10%',
  },

  caloriesDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: spacing[10],
  },

  foodName: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 15,
  },

  foodCaloriesValue: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.extrabold,
    color: colors.accent.primaryLight,
    textAlign: 'center',
    lineHeight: 18,
  },

  caloriesLabel: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
  },

  plusButton: {
    alignSelf: 'center',
    padding: spacing[2],
    borderRadius: radius[5],
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  plusButtonAdd: {
    backgroundColor: colors.faded.primaryExtraLight,
    borderWidth: 1,
    borderColor: colors.border.primaryAlt,
    shadowColor: colors.accent.primaryAlt,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  plusButtonSelected: {
    backgroundColor: colors.faded.successAlt,
    borderWidth: 1,
    borderColor: colors.border.successAlt,
    shadowColor: colors.accent.success,
  },

  deleteButtonContainer: {
    position: 'absolute',
    right: spacing[4],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  deleteIconWrapper: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[3],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.faded.errorAlt,
  },

  quantityLabel: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    backgroundColor: colors.faded.surfaceMedium,
    borderRadius: radius[1],
  },

  quantityLabelText: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
    lineHeight: 10,
  },

  macroLabel: {
    paddingHorizontal: spacing[1],
    paddingVertical: 3,
    borderRadius: radius[1],
    fontSize: fontSize[10],
    fontWeight: fontWeight.semibold,
    lineHeight: 10,
  },

  macroProtein: {
    backgroundColor: colors.faded.purpleAlt,
    color: colors.accent.purpleLight,
  },

  macroCarbs: {
    backgroundColor: colors.faded.green,
    color: colors.accent.greenLight,
  },

  macroFat: {
    backgroundColor: colors.faded.cyanAlt,
    color: colors.accent.cyanLight,
  },
}));

export default memo(FoodItem);
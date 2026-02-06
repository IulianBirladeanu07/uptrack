import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import FoodItem from './FoodItem';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const formatMealTitle = (date, mealType) => {
  const mealTypeNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    snacks: 'Snacks', 
    'mid-morning': 'Mid-Morning',
    'afternoon': 'Afternoon Snack',
    'evening': 'Evening Snack'
  };

  const mealName = mealTypeNames[mealType.toLowerCase()] || mealType;
  const today = new Date();
  const mealDate = new Date(date);

  const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isDateToday = resetTime(mealDate).getTime() === resetTime(today).getTime();

  if (isDateToday) {
    return `Today's ${mealName}`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (resetTime(mealDate).getTime() === resetTime(yesterday).getTime()) {
    return `Yesterday's ${mealName}`;
  }

  const daysDiff = Math.floor((today - mealDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) {
    const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}'s ${mealName}`;
  }

  if (mealDate.getFullYear() === today.getFullYear()) {
    const monthDay = mealDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    return `${monthDay} ${mealName}`;
  }

  const fullDate = mealDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  return `${fullDate} ${mealName}`;
};

const MemoizedFoodItem = memo(({ food, onPress, onPlusPress, isChecked, showPlusButton, isFoodDeletable }) => (
  <FoodItem
    item={{
      ...food,
      calories: parseFloat(food.calories || 0).toFixed(0)
    }}
    onPress={onPress}
    onPlusPress={onPlusPress}
    isChecked={isChecked}
    showPlusButton={showPlusButton}
    isFoodDeletable={isFoodDeletable}
    foodContainer={styles.foodItemContainer}
  />
), (prevProps, nextProps) => {
  return (
    prevProps.food.id === nextProps.food.id &&
    prevProps.food.calories === nextProps.food.calories &&
    prevProps.isChecked === nextProps.isChecked &&
    prevProps.showPlusButton === nextProps.showPlusButton &&
    prevProps.isFoodDeletable === nextProps.isFoodDeletable
  );
});

const MealItem = memo(({
  item,
  onPress,
  onPlusPress,
  showPlusButton = true,
  isFoodDeletable = false,
  meal,
}) => {
  const navigation = useNavigation();
  const containerScale = useSharedValue(1);

  if (!item?.foods || !Array.isArray(item.foods)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Meal data is missing or invalid!</Text>
      </View>
    );
  }

  const shouldDisplay = useMemo(() => {
    if (!meal) return true;

    const currentMealType = meal.toLowerCase().trim();
    const itemMealType = item.mealType.toLowerCase().trim();

    if (currentMealType === 'snacks' || currentMealType === 'snack') {
      return itemMealType === 'snacks' || itemMealType === 'snack';
    }

    return itemMealType === currentMealType;
  }, [meal, item.mealType]);

  if (!shouldDisplay) {
    return null;
  }

  const totalCalories = item.foods.reduce((total, food) => total + (parseFloat(food.calories) || 0), 0);
  const foodsCount = item.foods.length;
  const mealTitle = formatMealTitle(item.date, item.mealType);

  const [checkedFoods, setCheckedFoods] = useState({});
  const [isMealAdded, setIsMealAdded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const INITIAL_ITEMS_COUNT = 3;
  const hasMoreItems = foodsCount > INITIAL_ITEMS_COUNT;
  const displayedFoods = isExpanded ? item.foods : item.foods.slice(0, INITIAL_ITEMS_COUNT);

  const handlePlusPressInternal = useCallback((food) => {
    setCheckedFoods(prev => ({
      ...prev,
      [food.id]: !prev[food.id],
    }));
    onPlusPress?.(food);
  }, [onPlusPress]);

  const handleNavigateToFoodDetail = useCallback((food) => {
    containerScale.value = withTiming(0.98, { duration: 100 }, () => {
      containerScale.value = withTiming(1, { duration: 100 });
    });
    onPress?.(food);
  }, [onPress, containerScale]);

  const handleToggleMeal = useCallback(() => {
    const toggleToAdd = !isMealAdded;

    const newCheckedState = {};
    item.foods.forEach(food => {
      newCheckedState[food.id] = toggleToAdd;
    });

    setCheckedFoods(newCheckedState);
    setIsMealAdded(toggleToAdd);

    if (onPlusPress) {
      item.foods.forEach(food => onPlusPress(food, toggleToAdd));
    }
  }, [isMealAdded, item.foods, onPlusPress]);

  const handleMealPress = useCallback(() => {
    navigation.navigate('FoodDetail', { meal: item });
  }, [navigation, item]);

  const handleToggleExpansion = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }), [containerScale]);

  return (
    <Animated.View style={[styles.mealItem, containerAnimatedStyle]}>
      <View style={styles.header}>
        <View
          style={styles.headerMain}
        >
          <View style={styles.headerContent}>
            <View style={styles.mealIconContainer}>
              <View style={styles.mealIcon}>
                <Text style={styles.mealIconText}>🍽️</Text>
              </View>
            </View>

            <View style={styles.headerLeft}>
              <Text style={styles.mealTitle}>
                {mealTitle}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.itemCount}>{foodsCount} items</Text>
                </View>
                <Text style={styles.statsDevider}>•</Text>
                <View style={styles.statItem}>
                  <Text style={styles.totalCalories}>{totalCalories.toFixed(0)} kcal</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            style={[
              styles.addMealButton,
              isMealAdded && styles.addMealButtonToggled,
            ]}
            onPress={handleToggleMeal}
          >
            <Text style={[
              styles.addMealButtonText,
              { color: isMealAdded ? '#000000' : colors.accent.primary }
            ]}>
              {isMealAdded ? '✓ Added' : '+ Add All'}
            </Text>
          </Pressable>
        </View>
      </View>

      {displayedFoods.length > 0 ? (
        <View style={styles.foodItemsContainer}>
          {displayedFoods.map((food, index) => (
            <View key={food.id || `food-${index}`} style={styles.foodItemWrapper}>
              <MemoizedFoodItem
                food={food}
                onPress={() => handleNavigateToFoodDetail(food)}
                onPlusPress={() => handlePlusPressInternal(food)}
                isChecked={checkedFoods[food.id] || false}
                showPlusButton={!isMealAdded && showPlusButton}
                isFoodDeletable={isFoodDeletable}
                foodContainer={styles.foodItemContainer}
              />
            </View>
          ))}

          <Pressable
            style={styles.viewAllButton}
            onPress={hasMoreItems ? handleToggleExpansion : undefined}
          >
            {hasMoreItems ? (
              <>
                <Text style={styles.viewAllButtonText}>
                  {isExpanded
                    ? 'Show less'
                    : `View all ${foodsCount} items`
                  }
                </Text>
                <Text style={[
                  styles.viewAllChevron,
                  isExpanded && styles.viewAllChevronRotated
                ]}>
                  ›
                </Text>
              </>
            ) : (
              <Text style={styles.addMoreText}>
                Add more foods to this meal to see them here!
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No foods added yet</Text>
        </View>
      )}
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;

  if (!prevItem && !nextItem) return true;
  if (!prevItem || !nextItem) return false;

  if (prevItem === nextItem) return true;

  return (
    prevItem.id === nextItem.id &&
    prevItem.date === nextItem.date &&
    prevItem.mealType === nextItem.mealType &&
    prevItem.foods?.length === nextItem.foods?.length &&
    prevProps.showPlusButton === nextProps.showPlusButton &&
    prevProps.isFoodDeletable === nextProps.isFoodDeletable &&
    prevProps.meal === nextProps.meal
  );
});

const styles = createStyles(() => ({
  mealItem: {
    marginVertical: spacing[3],
    borderRadius: radius[4],
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: spacing[3],
  },
  mealIconContainer: {
    marginRight: spacing[4],
    paddingTop: 2,
  },
  mealIcon: {
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[4],
    backgroundColor: colors.faded.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: fontSize[20],
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  mealTitle: {
    fontSize: fontSize[18],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCalories: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    letterSpacing: 0.2,
  },
  statsDevider: {
    color: colors.text.tertiary,
    marginHorizontal: 6,
    fontSize: fontSize[10],
  },
  itemCount: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
  addMealButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  addMealButtonToggled: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addMealButtonText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  foodItemsContainer: {
    backgroundColor: 'rgba(10, 14, 19, 0.3)',
  },
  foodItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  foodItemContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: 'rgba(10, 14, 19, 0.4)',
  },
  viewAllButtonText: {
    color: colors.accent.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    marginRight: spacing[1],
  },
  viewAllChevron: {
    color: colors.accent.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    transform: [{ rotate: '0deg' }],
  },
  viewAllChevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
  addMoreText: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingVertical: spacing[1],
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: 'rgba(10, 14, 19, 0.3)',
  },
  emptyStateText: {
    color: colors.text.tertiary,
    fontSize: fontSize[16],
    marginBottom: spacing[3],
    fontWeight: fontWeight.medium,
  },
  errorContainer: {
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: radius[3],
    backgroundColor: '#FF453A',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
  },
}));

export default MealItem;
import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import FoodItem from './FoodItem';
import { normalize } from '../../../../shared/hooks/useResponsive';

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
  
  // For dates within the last week, show day name
  if (daysDiff <= 7) {
    const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}'s ${mealName}`;
  }

  // For dates within the current year, show "Month Day" format
  if (mealDate.getFullYear() === today.getFullYear()) {
    const monthDay = mealDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    return `${monthDay} ${mealName}`;
  }

  // For dates in previous years, include the year
  const fullDate = mealDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  return `${fullDate} ${mealName}`;
};

// Alternative version with more concise recent dates
const formatMealTitleAlternative = (date, mealType) => {
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
  
  // For dates within the last week, show day name
  if (daysDiff <= 7) {
    const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}'s ${mealName}`;
  }

  // For dates within the last month, show relative format
  if (daysDiff <= 30) {
    const weeksDiff = Math.floor(daysDiff / 7);
    if (weeksDiff === 1) {
      return `Last week's ${mealName}`;
    } else if (weeksDiff > 1) {
      return `${weeksDiff} weeks ago - ${mealName}`;
    }
  }

  // For dates within the current year, show "Month Day" format
  if (mealDate.getFullYear() === today.getFullYear()) {
    const monthDay = mealDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    return `${monthDay} ${mealName}`;
  }

  // For dates in previous years, include the year
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
              { color: isMealAdded ? '#000000' : '#F59E0B' }
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

const styles = StyleSheet.create({
  mealItem: {
    marginVertical: normalize(12),
    borderRadius: normalize(16),
    backgroundColor: '#151B23',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(12),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: normalize(12),
  },
  mealIconContainer: {
    marginRight: normalize(14),
    paddingTop: normalize(2),
  },
  mealIcon: {
    width: normalize(46),
    height: normalize(46),
    borderRadius: normalize(14),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: normalize(20),
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: normalize(2),
  },
  mealTitle: {
    fontSize: normalize(17),
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: normalize(4),
    letterSpacing: 0.3,
    lineHeight: normalize(22),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(1),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCalories: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#FF9500',
    letterSpacing: 0.2,
  },
  statsDevider: {
    color: '#6B7280',
    marginHorizontal: normalize(6),
    fontSize: normalize(10),
  },
  itemCount: {
    fontSize: normalize(14),
    color: '#9CA3AF',
    fontWeight: '600',
  },
  addMealButton: {
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(18),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  addMealButtonToggled: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addMealButtonText: {
    fontSize: normalize(14),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  foodItemsContainer: {
    backgroundColor: 'rgba(10, 14, 19, 0.3)',
  },
  foodItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  foodItemContainer: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 14, 19, 0.4)',
  },
  viewAllButtonText: {
    color: '#FF9500',
    fontSize: normalize(14),
    fontWeight: '600',
    marginRight: normalize(6),
  },
  viewAllChevron: {
    color: '#FF9500',
    fontSize: normalize(16),
    fontWeight: '700',
    transform: [{ rotate: '0deg' }],
  },
  viewAllChevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
  addMoreText: {
    color: '#9CA3AF',
    fontSize: normalize(14),
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: normalize(4),
  },
  emptyState: {
    alignItems: 'center',
    padding: normalize(24),
    backgroundColor: 'rgba(10, 14, 19, 0.3)',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: normalize(16),
    marginBottom: normalize(12),
    fontWeight: '500',
  },
  errorContainer: {
    margin: normalize(16),
    padding: normalize(16),
    borderRadius: normalize(12),
    backgroundColor: '#FF453A',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: normalize(16),
    fontWeight: '600',
  },
});

MealItem.displayName = 'MealItem';

export default MealItem;
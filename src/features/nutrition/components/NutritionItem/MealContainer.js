import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Coffee, Utensils, Moon, Cookie } from 'lucide-react-native';
import FoodItem from './FoodItem';
import { normalize } from '../../../../shared/hooks/useResponsive';

// Updated color palette matching weight tracker
const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const MealContainer = ({
  foods,
  foodName,
  foodCalories,
  foodNutrient,
  foodContainer,
  onSwipeableOpen,
  onPress,
  mealContainer,
  isFoodDeletable,
  selectedMeal,
  setSelectedMeal,
}) => {
  const getMealIcon = (meal) => {
    const iconColor = selectedMeal === meal ? colors.primary : colors.textTertiary;
    const iconSize = normalize(16);
    
    switch (meal) {
      case 'breakfast':
        return <Coffee size={iconSize} color={iconColor} />;
      case 'lunch':
        return <Utensils size={iconSize} color={iconColor} />;
      case 'dinner':
        return <Moon size={iconSize} color={iconColor} />;
      case 'snacks':
        return <Cookie size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  const getMealCalories = (meal) => {
    return foods
      .filter(food => food.mealType === meal)
      .reduce((total, food) => total + (food.calories || 0), 0);
  };

  const getMealLabel = (meal) => {
    switch (meal) {
      case 'breakfast':
        return 'Breakfast';
      case 'lunch':
        return 'Lunch';
      case 'dinner':
        return 'Dinner';
      case 'snacks':
        return 'Snacks';
      default:
        return meal;
    }
  };

  const filteredFoods = foods.filter(food => food.mealType === selectedMeal);

  return (
    <View style={[mealContainer, styles.container]}>
      <View style={styles.header}>
        <View style={styles.mealButtonsContainer}>
          {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
            const mealCalories = getMealCalories(meal);
            return (
              <TouchableOpacity 
                key={meal} 
                onPress={() => setSelectedMeal(meal)} 
                style={[
                  styles.mealButton,
                  selectedMeal === meal && styles.selectedMealButton
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.mealButtonContent}>
                  {getMealIcon(meal)}
                  <Text style={[
                    styles.mealButtonText,
                    selectedMeal === meal && styles.selectedMealText
                  ]}>
                    {getMealLabel(meal)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.listContainer}>
        {filteredFoods.length > 0 ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            nestedScrollEnabled={true}
          >
            {filteredFoods.map((item, index) => (
              <View key={`${item.productName}_${index}`} style={styles.foodItemWrapper}>
                <FoodItem
                  item={item}
                  meal={selectedMeal}
                  onSwipeableOpen={onSwipeableOpen}
                  onPress={() => onPress(item, selectedMeal)}
                  foodName={foodName}
                  foodContainer={foodContainer}
                  foodCalories={foodCalories}
                  foodNutrient={foodNutrient}
                  isFoodDeletable={isFoodDeletable}
                />
                {index < filteredFoods.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
            <View style={styles.scrollBottomPadding} />
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              {getMealIcon(selectedMeal)}
            </View>
            <Text style={styles.noFoodsText}>
              No foods added for {getMealLabel(selectedMeal).toLowerCase()}
            </Text>
            <Text style={styles.emptySubText}>
              Tap + to add your first meal
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: normalize(20),
    padding: normalize(20),
    marginVertical: normalize(10),
    minHeight: normalize(335),
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  mealButton: {
    paddingVertical: normalize(10),
    borderRadius: normalize(14),
    paddingHorizontal: normalize(12),
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: normalize(85),
    maxWidth: normalize(110),
    backgroundColor: 'transparent',
  },
  selectedMealButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  mealButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(5),
  },
  mealButtonText: {
    fontSize: normalize(11),
    color: colors.textTertiary,
    fontWeight: '600',
    // letterSpacing: 0.2,
  },
  selectedMealText: {
    fontWeight: '700',
    color: colors.primary,
  },
  listContainer: {
    flex: 1,
    marginTop: normalize(16),
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(4),
    minHeight: normalize(200),
    backgroundColor: 'transparent',
  },
  foodItemWrapper: {
    overflow: 'visible',
    marginVertical: normalize(1),
    backgroundColor: 'transparent',
    paddingHorizontal: normalize(2),
  },
  scrollBottomPadding: {
    height: normalize(20),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(50),
  },
  emptyIconContainer: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  noFoodsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: normalize(15),
    fontWeight: '600',
    marginBottom: normalize(6),
    letterSpacing: 0.2,
  },
  emptySubText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: normalize(13),
    fontWeight: '500',
  },
  divider: {
    height: normalize(1),
    marginVertical: normalize(4),
    backgroundColor: colors.borderLight,
  },
});

export default MealContainer;
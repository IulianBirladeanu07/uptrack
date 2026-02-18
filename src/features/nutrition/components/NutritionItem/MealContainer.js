import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Coffee, Utensils, Moon, Cookie } from 'lucide-react-native';
import FoodItem from './FoodItem';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const MealContainer = ({
  foods,
  onSwipeableOpen,
  onPress,
  mealContainer,
  isFoodDeletable,
  selectedMeal,
  setSelectedMeal,
}) => {
  const getMealIcon = (meal) => {
    const iconColor = selectedMeal === meal ? colors.accent.primary : colors.text.quaternary;
    const iconSize = spacing[4];

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

  return (
    <View style={[mealContainer, styles.container]}>
      <View style={styles.header}>
        <View style={styles.mealButtonsContainer}>
          {MEALS.map(meal => (
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
                  {MEAL_LABELS[meal]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listContainer}>
        {foods.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            nestedScrollEnabled={true}
          >
            {foods.map((item, index) => (
              <View key={item.id ?? `${item.productName}_${index}`} style={styles.foodItemWrapper}>
                <FoodItem
                  item={item}
                  onSwipeableOpen={onSwipeableOpen}
                  onPress={() => onPress(item, selectedMeal)}
                  isFoodDeletable={isFoodDeletable}
                  compact={true}
                  foodContainer={styles.foodContainer}
                  foodName={styles.foodName}
                  foodCaloriesValue={styles.foodCaloriesValue}
                  foodImage={styles.foodImage}
                  foodItemContainer={styles.foodItemContainer}
                  quantityLabel={styles.quantityLabel}
                  quantityLabelText={styles.quantityLabelText}
                  macroLabel={styles.macroLabel}
                />
                {index < foods.length - 1 && (
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
              No foods added for {MEAL_LABELS[selectedMeal]?.toLowerCase()}
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

const styles = createStyles(() => ({
  container: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[5],
    padding: spacing[5],
    marginVertical: spacing[2],
    minHeight: spacing[80],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  mealButton: {
    paddingVertical: spacing[1],
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.light,
    flex: 1,
    minWidth: spacing[22],
    maxWidth: spacing[30],
    backgroundColor: 'transparent',
  },
  selectedMealButton: {
    backgroundColor: colors.faded.primary,
    borderColor: colors.border.primary,
  },
  mealButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  mealButtonText: {
    fontSize: fontSize[10],
    color: colors.text.quaternary,
    fontWeight: fontWeight.semibold,
  },
  selectedMealText: {
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
  },
  listContainer: {
    flex: 1,
    marginTop: spacing[4],
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
    minHeight: spacing[50],
    backgroundColor: 'transparent',
  },
  foodItemWrapper: {
    overflow: 'visible',
    marginVertical: 0,
    backgroundColor: 'transparent',
  },
  scrollBottomPadding: {
    height: spacing[5],
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: spacing[16],
    height: spacing[16],
    borderRadius: radius[8],
    backgroundColor: colors.faded.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  noFoodsText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[1],
    letterSpacing: 0.2,
  },
  emptySubText: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: spacing[1],
    backgroundColor: colors.border.light,
  },
  foodContainer: {
    marginBottom: spacing[1],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  foodItemContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing[2],
    position: 'relative',
  },
  foodName: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 14,
    marginBottom: spacing[1],
  },
  foodCaloriesValue: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.extrabold,
    color: colors.accent.primaryLight,
    lineHeight: 16,
  },
  foodImage: {
    width: spacing[9],
    height: spacing[9],
    borderRadius: radius[2],
    padding: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.faded.surfaceLight,
  },
  quantityLabel: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    backgroundColor: colors.faded.surfaceMedium,
    borderRadius: radius[1],
  },
  quantityLabelText: {
    fontSize: fontSize[8],
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
  },
  macroLabel: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radius[1],
    fontSize: fontSize[8],
    fontWeight: fontWeight.black,
    lineHeight: 10,
  },
}));

export default MealContainer;
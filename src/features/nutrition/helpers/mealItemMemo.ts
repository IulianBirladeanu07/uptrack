type FoodLike = {
  id?: string | number | null | undefined;
  productName?: unknown;
  image?: unknown;
  icon?: unknown;
  mealType?: unknown;
  quantity?: unknown;
  unit?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  carbohydrates?: unknown;
  fats?: unknown;
  fat?: unknown;
} | null | undefined;

type MealItemLike = {
  id?: string | number | null | undefined;
  date?: unknown;
  mealType?: unknown;
  foods?: FoodLike[] | null | undefined;
} | null | undefined;

export const sameFood = (a: FoodLike, b: FoodLike): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.productName === b.productName &&
    a.image === b.image &&
    a.icon === b.icon &&
    a.mealType === b.mealType &&
    a.quantity === b.quantity &&
    a.unit === b.unit &&
    a.calories === b.calories &&
    a.protein === b.protein &&
    a.carbs === b.carbs &&
    a.carbohydrates === b.carbohydrates &&
    (a.fats ?? a.fat) === (b.fats ?? b.fat)
  );
};

export const sameFoodList = (
  a: FoodLike[] | null | undefined,
  b: FoodLike[] | null | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!sameFood(a[i], b[i])) return false;
  }
  return true;
};

export const mealItemPropsEqual = (
  prev: {
    item?: MealItemLike;
    onPress?: unknown;
    onPlusPress?: unknown;
    showPlusButton?: boolean | undefined;
    isFoodDeletable?: boolean | undefined;
    meal?: unknown;
  },
  next: {
    item?: MealItemLike;
    onPress?: unknown;
    onPlusPress?: unknown;
    showPlusButton?: boolean | undefined;
    isFoodDeletable?: boolean | undefined;
    meal?: unknown;
  },
): boolean => {
  const prevItem = prev.item;
  const nextItem = next.item;
  if (!prevItem && !nextItem) {
    return (
      prev.onPress === next.onPress &&
      prev.onPlusPress === next.onPlusPress &&
      prev.showPlusButton === next.showPlusButton &&
      prev.isFoodDeletable === next.isFoodDeletable &&
      prev.meal === next.meal
    );
  }
  if (!prevItem || !nextItem) return false;
  return (
    prevItem.id === nextItem.id &&
    prevItem.date === nextItem.date &&
    prevItem.mealType === nextItem.mealType &&
    sameFoodList(prevItem.foods, nextItem.foods) &&
    prev.onPress === next.onPress &&
    prev.onPlusPress === next.onPlusPress &&
    prev.showPlusButton === next.showPlusButton &&
    prev.isFoodDeletable === next.isFoodDeletable &&
    prev.meal === next.meal
  );
};

export const foodItemPropsEqual = (
  prev: {
    food?: FoodLike;
    onPress?: unknown;
    onPlusPress?: unknown;
    isChecked?: boolean | undefined;
    showPlusButton?: boolean | undefined;
    isFoodDeletable?: boolean | undefined;
  },
  next: {
    food?: FoodLike;
    onPress?: unknown;
    onPlusPress?: unknown;
    isChecked?: boolean | undefined;
    showPlusButton?: boolean | undefined;
    isFoodDeletable?: boolean | undefined;
  },
): boolean =>
  sameFood(prev.food, next.food) &&
  prev.onPress === next.onPress &&
  prev.onPlusPress === next.onPlusPress &&
  prev.isChecked === next.isChecked &&
  prev.showPlusButton === next.showPlusButton &&
  prev.isFoodDeletable === next.isFoodDeletable;

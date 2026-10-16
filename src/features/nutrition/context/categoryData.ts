import type { FoodCategories, FrequentFood, LoggedFood, MealType } from '../../../shared/types';
import type MealCache from './cache/MealCache';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const getFoodIdentity = (food: Partial<LoggedFood>): string => {
    if (food.id) return `id:${food.id}`;
    const key = [
        food.productName ?? '',
        food.quantity != null ? String(food.quantity) : '',
        food.calories != null ? String(food.calories) : '',
    ].filter(Boolean).join('|');
    return key || 'unknown-food';
};

export const buildCategoryData = (cache: MealCache): FoodCategories => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allDays = cache.getDateRange(thirtyDaysAgo, new Date());

    const recentMeals = allDays
        .flatMap(({ date, meals }) =>
            MEAL_TYPES
                .filter(mealType => (meals[mealType] || []).length > 0)
                .map(mealType => ({
                    id: `${date}_${mealType}`,
                    date,
                    mealType,
                    foods: meals[mealType],
                    totalCalories: meals[mealType].reduce((s, f) => s + (Number(f.calories) || 0), 0),
                }))
        )
        .reverse()
        .slice(0, 30);

    const foodUsageMap = new Map<string, FrequentFood>();
    allDays.forEach(({ date, meals }) => {
        MEAL_TYPES.forEach(mealType => {
            (meals[mealType] || []).forEach(food => {
                const key = getFoodIdentity(food);
                if (!foodUsageMap.has(key)) {
                    foodUsageMap.set(key, { ...food, mealType, usageCount: 0, lastUsed: date });
                }
                const entry = foodUsageMap.get(key)!;
                entry.usageCount += 1;
                const currentLastUsed = new Date(`${date}T00:00:00`).getTime();
                const previousLastUsed = new Date(`${entry.lastUsed || date}T00:00:00`).getTime();
                if (currentLastUsed > previousLastUsed) entry.lastUsed = date;
            });
        });
    });

    const frequentFoods = Array.from(foodUsageMap.values())
        .sort((a, b) => {
            if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
            return new Date(`${b.lastUsed}T00:00:00`).getTime() - new Date(`${a.lastUsed}T00:00:00`).getTime();
        })
        .slice(0, 50);

    return { recentMeals, frequentFoods, favoriteFoods: [] };
};

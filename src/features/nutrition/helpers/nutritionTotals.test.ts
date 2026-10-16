import { calculateDailyNutrition } from './nutritionTotals';

describe('calculateDailyNutrition', () => {
  test('adds food macros while tolerating null entries and missing nutrient values', () => {
    expect(calculateDailyNutrition([
      { calories: '250', protein: 8, carbohydrates: '40', fats: 5 },
      null,
      undefined,
      { calories: 100, protein: undefined, carbohydrates: null, fats: 2 },
    ])).toEqual({
      calories: 350,
      protein: 8,
      carbs: 40,
      fat: 7,
    });
  });
});

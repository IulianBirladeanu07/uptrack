jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));

import { Alert } from 'react-native';
import { handleFoodAddition } from './useFoodDetails';

const createArgs = (updateMealInDatabase: jest.Mock) => ({
  quantity: 100,
  unit: 'g',
  food: {
    productName: 'Oats',
    calories: 380,
    carbohydrates: 68,
    fats: 7,
    protein: 13,
    quantity: 100,
    unit: 'g',
  },
  foodId: 'food-1',
  meal: 'breakfast' as const,
  updateMealInDatabase,
  remainingCalories: 1000,
  selectedDate: new Date(2026, 9, 15),
  update: true,
  isFavorite: false,
});

describe('handleFoodAddition while editing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('only reports success after the meal update succeeds', async () => {
    const updateMealInDatabase = jest.fn().mockResolvedValue(undefined);

    await expect(handleFoodAddition(createArgs(updateMealInDatabase))).resolves.toMatchObject({
      success: true,
      navigation: { screen: 'Nutrition' },
    });

    expect(updateMealInDatabase).toHaveBeenCalledWith('breakfast', 'food-1', expect.objectContaining({
      productName: 'Oats',
      quantity: 100,
    }));
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('reports a failed update instead of navigating as if it saved', async () => {
    const error = new Error('offline');
    const updateMealInDatabase = jest.fn().mockRejectedValue(error);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handleFoodAddition(createArgs(updateMealInDatabase))).resolves.toEqual({ success: false });

    expect(consoleError).toHaveBeenCalledWith('Failed to update food item:', error);
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", 'Check your connection and try again.');
    consoleError.mockRestore();
  });
});

describe('handleFoodAddition while adding', () => {
  it('passes the selected local calendar date as a date key', async () => {
    const result = await handleFoodAddition({
      ...createArgs(jest.fn()),
      update: false,
    });

    expect(result).toMatchObject({
      success: true,
      navigation: {
        screen: 'FoodSelection',
        params: { selectedDate: '2026-10-15' },
      },
    });
  });
});

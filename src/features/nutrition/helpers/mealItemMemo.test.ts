const {
  sameFood,
  sameFoodList,
  mealItemPropsEqual,
  foodItemPropsEqual,
} = require('./mealItemMemo');

describe('sameFood', () => {
  it('treats identical references as equal', () => {
    const f = { id: '1', quantity: 100 };
    expect(sameFood(f, f)).toBe(true);
  });

  it('compares quantity unit and macros', () => {
    const a = { id: '1', quantity: 100, unit: 'g', calories: 200, protein: 10, carbs: 20, fats: 5 };
    const b = { ...a, quantity: 150 };
    expect(sameFood(a, a)).toBe(true);
    expect(sameFood(a, b)).toBe(false);
  });

  it('treats fats and fat as the same field', () => {
    expect(sameFood({ id: 1, fats: 3 }, { id: 1, fat: 3 })).toBe(true);
  });

  it.each([
    ['productName', 'Oats', 'Rice'],
    ['image', 'oats.png', 'rice.png'],
    ['icon', 'oats', 'rice'],
    ['carbohydrates', 20, 30],
  ])('detects changes to rendered food field %s', (field, previous, next) => {
    expect(sameFood(
      { id: '1', [field]: previous },
      { id: '1', [field]: next },
    )).toBe(false);
  });
});

describe('sameFoodList', () => {
  it('requires matching length and items', () => {
    const a = [{ id: '1', quantity: 1 }];
    const b = [{ id: '1', quantity: 1 }, { id: '2', quantity: 2 }];
    expect(sameFoodList(a, a)).toBe(true);
    expect(sameFoodList(a, b)).toBe(false);
  });
});

describe('mealItemPropsEqual', () => {
  const base = {
    item: { id: 'm1', date: '2026-01-01', mealType: 'lunch', foods: [{ id: 'f1', quantity: 1 }] },
    onPress: () => {},
    onPlusPress: () => {},
    showPlusButton: true,
    isFoodDeletable: false,
    meal: 'lunch',
  };

  it('returns false when food quantity changes even if item id matches', () => {
    const next = {
      ...base,
      item: {
        ...base.item,
        foods: [{ id: 'f1', quantity: 2 }],
      },
    };
    expect(mealItemPropsEqual(base, next)).toBe(false);
  });

  it('returns false when handlers change even if item is the same reference', () => {
    const next = { ...base, onPress: () => {} };
    expect(mealItemPropsEqual(base, next)).toBe(false);
  });

  it('returns true when everything matches', () => {
    expect(mealItemPropsEqual(base, { ...base })).toBe(true);
  });
});

describe('foodItemPropsEqual', () => {
  it('includes handlers and checked state', () => {
    const onPress = () => {};
    const prev = { food: { id: 1, calories: 10 }, onPress, isChecked: false, showPlusButton: true };
    expect(foodItemPropsEqual(prev, { ...prev })).toBe(true);
    expect(foodItemPropsEqual(prev, { ...prev, isChecked: true })).toBe(false);
    expect(foodItemPropsEqual(prev, { ...prev, onPress: () => {} })).toBe(false);
  });
});

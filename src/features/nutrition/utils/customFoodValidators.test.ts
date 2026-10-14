const { validateField, validateFoodData } = require('./customFoodValidators');

describe('validateField', () => {
  test('productName', () => {
    expect(validateField('productName', '')).toBe('Name is required');
    expect(validateField('productName', undefined)).toBe('Name is required');
    expect(validateField('productName', 5)).toBe('Name is required');
    expect(validateField('productName', 'a')).toBe('Name must be at least 2 characters');
    expect(validateField('productName', 'x'.repeat(101))).toBe('Name must be less than 100 characters');
    expect(validateField('productName', 'Milk <b>')).toBe('Name contains invalid characters');
    expect(validateField('productName', "Mom's Milk (2%)")).toBeNull();
  });

  test('calories', () => {
    expect(validateField('calories', '')).toBe('Calories are required and must be a number');
    expect(validateField('calories', null)).toBe('Calories are required and must be a number');
    expect(validateField('calories', 'abc')).toBe('Calories are required and must be a number');
    expect(validateField('calories', 0)).toBe('Calories must be greater than 0');
    expect(validateField('calories', '-5')).toBe('Calories must be greater than 0');
    expect(validateField('calories', 10001)).toBe('Calories value seems too high');
    expect(validateField('calories', '250.5')).toBeNull();
  });

  test('barcode only matters for foodWithBarcode', () => {
    expect(validateField('barcode', '', 'foodWithBarcode')).toBe('Barcode is required');
    expect(validateField('barcode', '123', 'foodWithBarcode')).toBe('Please enter a valid barcode (8 to 14 digits)');
    expect(validateField('barcode', '12345678', 'foodWithBarcode')).toBeNull();
    expect(validateField('barcode', '', 'customFood')).toBeNull();
    expect(validateField('barcode', 'abc')).toBeNull();
  });

  test('amount', () => {
    expect(validateField('amount', '')).toBe('Serving amount is required and must be a number');
    expect(validateField('amount', 0)).toBe('Serving amount must be greater than 0');
    expect(validateField('amount', 10001)).toBe('Serving amount seems too high');
    expect(validateField('amount', '100')).toBeNull();
  });

  test('optional macros', () => {
    ['carbohydrates', 'protein', 'fats', 'fiber', 'sugar', 'saturatedFats'].forEach(f => {
      const label = f.charAt(0).toUpperCase() + f.slice(1);
      expect(validateField(f, '')).toBeNull();
      expect(validateField(f, null)).toBeNull();
      expect(validateField(f, undefined)).toBeNull();
      expect(validateField(f, 'abc')).toBe(`${label} must be a number`);
      expect(validateField(f, -1)).toBe(`${label} cannot be negative`);
      expect(validateField(f, 1001)).toBe(`${label} value seems too high`);
      expect(validateField(f, '12.5')).toBeNull();
    });
  });

  test('salt', () => {
    expect(validateField('salt', '')).toBeNull();
    expect(validateField('salt', 'abc')).toBe('Salt must be a number');
    expect(validateField('salt', -1)).toBe('Salt cannot be negative');
    expect(validateField('salt', 101)).toBe('Salt value seems too high (use grams, not milligrams)');
    expect(validateField('salt', 1.2)).toBeNull();
  });

  test('unit', () => {
    expect(validateField('unit', '')).toBe('Unit is required');
    expect(validateField('unit', 'cup')).toBe('Please select a valid unit');
    expect(validateField('unit', 5)).toBe('Please select a valid unit');
    ['g', 'ml', 'oz', 'serving'].forEach(u => expect(validateField('unit', u)).toBeNull());
  });

  test('unknown field', () => {
    expect(validateField('nothing', 'x')).toBeNull();
  });
});

describe('validateFoodData', () => {
  const base = { productName: 'Yogurt', calories: '90', amount: '100', unit: 'g' };

  test('accepts the required fields only', () => {
    expect(validateFoodData(base, 'customFood')).toEqual({ isValid: true, errors: {} });
  });

  test('accepts full numeric data', () => {
    const data = { ...base, carbohydrates: '10', protein: 5, fats: '3', fiber: '1', sugar: '2', saturatedFats: '1', salt: '0.1' };
    expect(validateFoodData(data, 'customFood').isValid).toBe(true);
  });

  test('reports every missing required field', () => {
    const { isValid, errors } = validateFoodData({}, 'foodWithBarcode');
    expect(isValid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['amount', 'barcode', 'calories', 'productName', 'unit']);
  });

  test('requires a barcode only for foodWithBarcode', () => {
    expect(validateFoodData(base, 'customFood').errors.barcode).toBeUndefined();
    expect(validateFoodData(base, 'foodWithBarcode').errors.barcode).toBe('Barcode is required');
    expect(validateFoodData({ ...base, barcode: '12345678' }, 'foodWithBarcode').isValid).toBe(true);
  });

  test('flags non numeric optional values', () => {
    const { errors } = validateFoodData({ ...base, protein: 'abc' }, 'customFood');
    expect(errors.protein).toBe('Protein must be a number');
  });

  test('flags macros that exceed the amount in grams only', () => {
    const over = { ...base, amount: '50', carbohydrates: '30', protein: '20', fats: '10' };
    expect(validateFoodData(over, 'customFood').errors.macroNutrients)
      .toBe('The sum of carbohydrates, protein, and fats exceeds the total amount');
    expect(validateFoodData({ ...over, unit: 'ml' }, 'customFood').errors.macroNutrients).toBeUndefined();
  });

  test('flags fiber, sugar and saturated fat above their parents', () => {
    const { errors } = validateFoodData({ ...base, carbohydrates: '10', fats: '5', fiber: '11', sugar: '12', saturatedFats: '6' }, 'customFood');
    expect(errors.fiber).toBe('Fiber cannot exceed total carbohydrates');
    expect(errors.sugar).toBe('Sugar cannot exceed total carbohydrates');
    expect(errors.saturatedFats).toBe('Saturated fat cannot exceed total fat');
  });

  test('ignores parent comparisons when the parent is missing', () => {
    const { errors } = validateFoodData({ ...base, fiber: '11', sugar: '12', saturatedFats: '6' }, 'customFood');
    expect(errors.fiber).toBeUndefined();
    expect(errors.sugar).toBeUndefined();
    expect(errors.saturatedFats).toBeUndefined();
  });

  test('treats explicit null and empty optional values as absent', () => {
    expect(validateFoodData({ ...base, carbohydrates: null, protein: '', fats: undefined }, 'customFood').isValid).toBe(true);
  });
});

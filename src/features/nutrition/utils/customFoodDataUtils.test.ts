
const { passesBarcodedProductsInsertPolicy, transformForBarcodeDB } = require('./customFoodDataUtils');

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { defaultFoodIconUri: 'icon' } } },
}));

describe('passesBarcodedProductsInsertPolicy', () => {
  const ok = {
    barcode_id: '12345678',
    product_name: 'Milk',
    calories: 50,
    protein: 3,
    carbohydrates: 5,
    fats: 2,
  };

  test('accepts a valid row', () => {
    expect(passesBarcodedProductsInsertPolicy(ok)).toBe(true);
  });

  test('rejects short or non-digit barcodes', () => {
    expect(passesBarcodedProductsInsertPolicy({ ...ok, barcode_id: '123' })).toBe(false);
    expect(passesBarcodedProductsInsertPolicy({ ...ok, barcode_id: 'abcdefgh' })).toBe(false);
  });

  test('rejects empty or overlong names', () => {
    expect(passesBarcodedProductsInsertPolicy({ ...ok, product_name: '' })).toBe(false);
    expect(passesBarcodedProductsInsertPolicy({ ...ok, product_name: 'x'.repeat(201) })).toBe(false);
  });

  test('rejects negative macros', () => {
    expect(passesBarcodedProductsInsertPolicy({ ...ok, calories: -1 })).toBe(false);
    expect(passesBarcodedProductsInsertPolicy({ ...ok, protein: -0.1 })).toBe(false);
  });

  test('transform output passes the policy for normal form data', () => {
    const item = transformForBarcodeDB({
      barcode: '5901234123457',
      productName: 'Yogurt',
      calories: 90,
      carbohydrates: 10,
      fats: 3,
      protein: 5,
      fiber: 0,
      sugar: 0,
      salt: 0,
      saturatedFats: 0,
      quantity: 100,
      unit: 'g',
    });
    expect(passesBarcodedProductsInsertPolicy(item)).toBe(true);
  });
});

import { act, renderHook } from '@testing-library/react-native';
import { Alert, Keyboard } from 'react-native';
import { supabase } from '../../../shared/services/supabaseClient';
import { useCustomFood } from './useCustomFood';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Keyboard: { dismiss: jest.fn() },
}));

jest.mock('../../../shared/services/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('expo-constants', () => ({ expoConfig: { extra: {} } }));

const setupBarcodeTable = (
  singleResult: { data: unknown; error: { code?: string } | null },
  insertResult = { error: null as Error | null },
) => {
  const single = jest.fn().mockResolvedValue(singleResult);
  const insert = jest.fn().mockResolvedValue(insertResult);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  (supabase.from as jest.Mock).mockReturnValue({ select, insert });
  return { single, insert };
};

const fillRequiredFields = (result: { current: ReturnType<typeof useCustomFood> }) => {
  act(() => {
    result.current.handleFieldChange('productName', 'Chicken');
    result.current.handleFieldChange('calories', '200');
  });
};

describe('useCustomFood', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes numeric input, tracks dirty fields, changes units, and resets', () => {
    const navigation = { navigate: jest.fn() } as never;
    const { result } = renderHook(() =>
      useCustomFood('custom', navigation, 500, '12345678', 'lunch', '2026-10-17'),
    );

    expect(result.current.foodData.barcode).toBe('12345678');
    act(() => {
      result.current.handleFieldChange('calories', '2a00.5 kcal');
      result.current.handleAmountChange('1,25g');
      result.current.handleFieldChange('productName', 'Oats');
      result.current.changeUnit('ml');
    });
    expect(result.current.foodData).toMatchObject({
      calories: '200.5', amount: '1.25', productName: 'Oats', unit: 'ml',
    });
    expect(result.current.isDirty).toMatchObject({
      calories: true, amount: true, productName: true, unit: true,
    });

    act(() => result.current.resetForm());
    expect(result.current.foodData).toMatchObject({
      productName: '', amount: '100', unit: 'g', barcode: '',
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toEqual({});
  });

  it('shows validation errors without dismissing the keyboard or writing data', async () => {
    const navigation = { navigate: jest.fn() } as never;
    const { result } = renderHook(() =>
      useCustomFood('custom', navigation, 500, '', 'lunch', '2026-10-17'),
    );

    await act(async () => result.current.handleSubmit());

    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', expect.any(String));
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('submits a valid custom food to FoodDetail with the computed remaining calories', async () => {
    const navigation = { navigate: jest.fn() } as never;
    const { result } = renderHook(() =>
      useCustomFood('custom', navigation, 500, '', 'lunch', '2026-10-17'),
    );
    fillRequiredFields(result);

    await act(async () => result.current.handleSubmit());

    expect(Keyboard.dismiss).toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith('FoodDetail', expect.objectContaining({
      food: expect.objectContaining({ productName: 'Chicken', calories: 200, quantity: 100 }),
      meal: 'lunch',
      selectedDate: '2026-10-17',
      remainingCalories: 300,
      update: false,
    }));
  });

  it('inserts a valid barcode food when it does not already exist', async () => {
    const navigation = { navigate: jest.fn() } as never;
    const { result } = renderHook(() =>
      useCustomFood('foodWithBarcode', navigation, 1000, '12345678', 'dinner', '2026-10-17'),
    );
    fillRequiredFields(result);
    const { single, insert } = setupBarcodeTable({
      data: null,
      error: { code: 'PGRST116' },
    });

    await act(async () => result.current.handleSubmit());

    expect(single).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({
      barcode_id: '12345678',
      product_name: 'Chicken',
      calories: 200,
      serving_size_value: 100,
    })]);
    expect(navigation.navigate).toHaveBeenCalledWith('FoodDetail', expect.objectContaining({
      meal: 'dinner', remainingCalories: 800,
    }));
  });

  it('stops duplicate barcodes and surfaces lookup or insert failures', async () => {
    const navigation = { navigate: jest.fn() } as never;
    const { result } = renderHook(() =>
      useCustomFood('foodWithBarcode', navigation, 1000, '12345678', 'dinner', '2026-10-17'),
    );
    fillRequiredFields(result);
    setupBarcodeTable({ data: { barcode_id: '12345678' }, error: null });
    await act(async () => result.current.handleSubmit());
    expect(Alert.alert).toHaveBeenCalledWith('Product Exists', expect.any(String));
    expect(navigation.navigate).not.toHaveBeenCalled();

    jest.clearAllMocks();
    setupBarcodeTable({ data: null, error: { code: '42501' } });
    await act(async () => result.current.handleSubmit());
    expect(Alert.alert).toHaveBeenCalledWith('Database Error', 'Failed to check if product exists.');

    jest.clearAllMocks();
    setupBarcodeTable(
      { data: null, error: { code: 'PGRST116' } },
      { error: new Error('insert failed') },
    );
    await act(async () => result.current.handleSubmit());
    expect(Alert.alert).toHaveBeenCalledWith('Database Error', 'Failed to save food data to the database.');
  });
});

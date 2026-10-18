import { act, renderHook } from '@testing-library/react-native';
import { Alert, Vibration } from 'react-native';
import { supabase } from '../../../shared/services/supabaseClient';
import { queryClient } from '../../../shared/query/queryClient';
import { useBarcodeScanner } from './useBarcodeScanner';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Vibration: { vibrate: jest.fn() },
  Animated: {
    Value: jest.fn().mockImplementation(value => ({ value })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
    timing: jest.fn(() => ({})),
  },
}));

jest.mock('../../../shared/services/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../utils/customFoodDataUtils', () => ({
  transformBarcodeDBToFoodDetail: jest.fn(product => ({ productName: product.product_name })),
}));

const setupLookup = (response: unknown) => {
  const maybeSingle = jest.fn().mockResolvedValue(response);
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const eq = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ eq });
  (supabase.from as jest.Mock).mockReturnValue({ select });
  return { maybeSingle };
};

describe('useBarcodeScanner', () => {
  const navigation = { navigate: jest.fn() } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('loads a matched product and navigates to its detail screen', async () => {
    setupLookup({
      data: { product_name: 'Oats', barcode_id: '12345678' },
      error: null,
    });
    const { result } = renderHook(() =>
      useBarcodeScanner(navigation, 'breakfast', '2026-10-17'),
    );

    await act(async () => result.current.handleBarcodeScanned({ data: '12345678' } as never));

    expect(supabase.from).toHaveBeenCalledWith('barcoded_products');
    expect(Vibration.vibrate).toHaveBeenCalledWith(100);
    expect(navigation.navigate).toHaveBeenCalledWith('FoodDetail', {
      food: { productName: 'Oats' },
      meal: 'breakfast',
      selectedDate: '2026-10-17',
    });
    expect(result.current.instructionsVisible).toBe(false);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.loadingProduct).toBe(false);
  });

  it('offers custom-food creation for missing products and resumes after dismiss', async () => {
    setupLookup({ data: null, error: null });
    const { result } = renderHook(() =>
      useBarcodeScanner(navigation, 'lunch', '2026-10-17'),
    );

    await act(async () => result.current.handleBarcodeScanned({ data: '98765432' } as never));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Product Not Found',
      expect.stringContaining('98765432'),
      expect.any(Array),
      expect.objectContaining({ cancelable: true, onDismiss: expect.any(Function) }),
    );
    const [, , buttons, options] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => buttons[0].onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('CustomFood', {
      barcode: '98765432',
      type: 'foodWithBarcode',
      meal: 'lunch',
      selectedDate: '2026-10-17',
    });
    act(() => options.onDismiss());
    expect(result.current.isScanning).toBe(true);
    expect(result.current.loadingProduct).toBe(false);
  });

  it('reports database errors and restores scanning state', async () => {
    setupLookup({ data: null, error: { message: 'database unavailable' } });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useBarcodeScanner(navigation, undefined, undefined));

    await act(async () => result.current.handleBarcodeScanned({ data: '12345678' } as never));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Scan Error',
      'Something went wrong while processing the barcode.',
    );
    expect(result.current.isScanning).toBe(true);
    expect(result.current.loadingProduct).toBe(false);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('ignores a duplicate scan while the first lookup is still pending', async () => {
    let resolveLookup!: (value: { data: null; error: null }) => void;
    const maybeSingle = jest.fn(() => new Promise<{ data: null; error: null }>(resolve => {
      resolveLookup = resolve;
    }));
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const eq = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });
    const { result } = renderHook(() => useBarcodeScanner(navigation, undefined, undefined));

    await act(async () => {
      const firstScan = result.current.handleBarcodeScanned({ data: '12345678' } as never);
      await result.current.handleBarcodeScanned({ data: '12345678' } as never);
      expect(maybeSingle).toHaveBeenCalledTimes(1);
      resolveLookup({ data: null, error: null });
      await firstScan;
    });

    act(() => result.current.resumeScanning());
    expect(result.current.isScanning).toBe(true);
  });
});

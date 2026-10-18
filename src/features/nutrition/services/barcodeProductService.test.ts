jest.mock('../../../shared/services/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../shared/services/supabaseClient';
import { queryClient } from '../../../shared/query/queryClient';
import {
  fetchBarcodeProduct,
  invalidateBarcodeProduct,
} from './barcodeProductService';

describe('barcode product query cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('reuses a barcode lookup across scanners and invalidates it after a write', async () => {
    const product = { barcode_id: '123', product_name: 'Oats' };
    const maybeSingle = jest.fn().mockResolvedValue({ data: product, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const eq = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ eq });
    jest.mocked(supabase.from).mockReturnValue({ select } as never);

    await expect(fetchBarcodeProduct('123')).resolves.toEqual(product);
    await expect(fetchBarcodeProduct('123')).resolves.toEqual(product);
    expect(supabase.from).toHaveBeenCalledTimes(1);

    await invalidateBarcodeProduct('123');
    await fetchBarcodeProduct('123');
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});

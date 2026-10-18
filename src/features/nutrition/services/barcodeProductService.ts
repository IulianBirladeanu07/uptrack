import { queryClient } from '../../../shared/query/queryClient';
import { supabase } from '../../../shared/services/supabaseClient';
import type { BarcodedProduct } from '../../../shared/types';

const BARCODE_PRODUCT_STALE_TIME = 60 * 60 * 1000;

export const barcodeProductQueryKey = (barcode: string) =>
  ['food-catalog', 'barcode', barcode] as const;

export const fetchBarcodeProduct = async (barcode: string): Promise<BarcodedProduct | null> =>
  queryClient.fetchQuery({
    queryKey: barcodeProductQueryKey(barcode),
    staleTime: BARCODE_PRODUCT_STALE_TIME,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barcoded_products')
        .select('*')
        .eq('barcode_id', barcode)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export const invalidateBarcodeProduct = async (barcode: string): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: barcodeProductQueryKey(barcode) });
};

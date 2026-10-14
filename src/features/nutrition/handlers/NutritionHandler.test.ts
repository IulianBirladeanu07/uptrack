jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('../../../shared/services/supabaseClient', () => {
  const builder = {};
  builder.select = jest.fn(() => builder);
  builder.or = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(() => Promise.resolve({ data: [], error: null }));
  return {
    supabase: {
      rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
      from: jest.fn(() => builder),
      builder,
    },
  };
});

import { supabase } from '../../../shared/services/supabaseClient';
import { fetchNonBarcodedProducts } from './NutritionHandler';

const orFilters = () => supabase.builder.or.mock.calls.map(c => c[0]);

describe('fetchNonBarcodedProducts text search', () => {
  test('quotes every term so commas and parentheses cannot break the PostgREST or() filter', async () => {
    await fetchNonBarcodedProducts([], null, 50, null, 'Milk (1.5%), whole');
    const [terms, loose] = orFilters();
    expect(terms).toBe(
      'product_name_en.ilike."%milk%",product_name_ro.ilike."%milk%",' +
      'product_name_en.ilike."%(1.5%),%",product_name_ro.ilike."%(1.5%),%",' +
      'product_name_en.ilike."%whole%",product_name_ro.ilike."%whole%"'
    );
    expect(loose).toBe('product_name_en.ilike."%M%",product_name_ro.ilike."%M%"');
  });

  test('escapes double quotes and backslashes inside a term', async () => {
    await fetchNonBarcodedProducts([], null, 50, null, 'a"b\\c');
    expect(orFilters()[0]).toBe('product_name_en.ilike."%a\\"b\\\\c%",product_name_ro.ilike."%a\\"b\\\\c%"');
  });

  test('similarity RPC results are returned without running the fallback filters', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
    await expect(fetchNonBarcodedProducts([], null, 50, null, 'oats')).resolves.toEqual([{ id: 1 }]);
    expect(orFilters()).toHaveLength(0);
  });
});

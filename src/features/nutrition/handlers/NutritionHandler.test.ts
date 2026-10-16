jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('../../../shared/services/supabaseClient', () => {
  const builder = {
    select: jest.fn(() => builder),
    or: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    gt: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lt: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    contains: jest.fn(() => builder),
    in: jest.fn(() => builder),
    then: jest.fn((resolve, reject) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject)
    ),
  };
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
const mockLimitResult = (result) => {
  supabase.builder.then.mockImplementationOnce((resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  );
};

describe('fetchNonBarcodedProducts text search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    supabase.builder.then.mockImplementation((resolve, reject) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  test('applies all supported filters, ordering, limit and cursor pagination', async () => {
    await fetchNonBarcodedProducts([
      ['category', '==', 'dairy'],
      ['category', '!=', 'other'],
      ['calories', '>', 10],
      ['calories', '>=', 20],
      ['calories', '<', 500],
      ['calories', '<=', 400],
      ['tags', 'array-contains', 'protein'],
      ['id', 'in', ['a', 'b']],
    ], 'product_name_en', 25, 'cursor-1');

    expect(supabase.builder.eq).toHaveBeenCalledWith('category', 'dairy');
    expect(supabase.builder.neq).toHaveBeenCalledWith('category', 'other');
    expect(supabase.builder.gt).toHaveBeenNthCalledWith(1, 'calories', 10);
    expect(supabase.builder.gte).toHaveBeenCalledWith('calories', 20);
    expect(supabase.builder.lt).toHaveBeenCalledWith('calories', 500);
    expect(supabase.builder.lte).toHaveBeenCalledWith('calories', 400);
    expect(supabase.builder.contains).toHaveBeenCalledWith('tags', ['protein']);
    expect(supabase.builder.in).toHaveBeenCalledWith('id', ['a', 'b']);
    expect(supabase.builder.order).toHaveBeenCalledWith('product_name_en', { ascending: true });
    expect(supabase.builder.limit).toHaveBeenCalledWith(25);
    expect(supabase.builder.gt).toHaveBeenLastCalledWith('id', 'cursor-1');
  });

  test('returns an empty list when Supabase returns no products', async () => {
    mockLimitResult({ data: null, error: null });

    await expect(fetchNonBarcodedProducts()).resolves.toEqual([]);
  });

  test('surfaces Supabase query errors', async () => {
    const error = new Error('Supabase error: offline');
    mockLimitResult({ data: null, error: { message: 'offline' } });

    await expect(fetchNonBarcodedProducts()).rejects.toThrow(error.message);
  });

  test('falls back to ranked ILIKE results when the similarity RPC has no matches', async () => {
    const exact = { id: 1, product_name_en: 'Oat', product_name_ro: '' };
    const prefix = { id: 2, product_name_en: 'Oat drink', product_name_ro: '' };
    supabase.rpc.mockResolvedValueOnce({ data: [], error: { message: 'RPC unavailable' } });
    mockLimitResult({ data: [prefix, exact], error: null });

    await expect(fetchNonBarcodedProducts([], null, 30, null, ' oat ')).resolves.toEqual([
      { ...exact, similarity_score: 1, match_type: 'exact' },
      { ...prefix, similarity_score: 0.9, match_type: 'exact' },
    ]);
    expect(supabase.rpc).toHaveBeenCalledWith('search_products_similarity', {
      search_term: 'oat',
      similarity_threshold: 0.1,
      limit_count: 30,
    });
  });

  test('uses a loose first-character search when ILIKE returns no products', async () => {
    mockLimitResult({ data: [], error: null });
    mockLimitResult({ data: [{ id: 3 }], error: null });

    await expect(fetchNonBarcodedProducts([], null, 10, null, 'Oats')).resolves.toEqual([{ id: 3 }]);
    expect(orFilters()).toEqual([
      'product_name_en.ilike."%oats%",product_name_ro.ilike."%oats%"',
      'product_name_en.ilike."%O%",product_name_ro.ilike."%O%"',
    ]);
    expect(supabase.builder.limit).toHaveBeenNthCalledWith(2, 20);
  });

  test('rejects when the fallback ILIKE query fails', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC unavailable' } });
    mockLimitResult({ data: null, error: { message: 'query unavailable' } });

    await expect(fetchNonBarcodedProducts([], null, 10, null, 'oats'))
      .rejects.toThrow('ILIKE search error: query unavailable');
  });
});

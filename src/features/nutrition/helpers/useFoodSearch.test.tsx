import { createElement, type ReactElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  clearFoodCatalogQueryCache,
  fetchNonBarcodedProducts,
  loadNonBarcodedProducts,
} from '../handlers/NutritionHandler';
import { useFoodSearch } from './useFoodSearch';

jest.mock('../handlers/NutritionHandler', () => ({
  clearFoodCatalogQueryCache: jest.fn(),
  fetchNonBarcodedProducts: jest.fn(),
  loadNonBarcodedProducts: jest.fn(),
  nonBarcodedProductsQueryKey: (filters: unknown[], order: unknown, limit: number, cursor: unknown, search: string | null) => [
    'food-catalog', 'products', { filters, order, limitCount: limit, lastVisibleDoc: cursor, searchQuery: search?.trim().toLowerCase() ?? null },
  ],
}));

const product = {
  id: 'food-1',
  product_name_en: 'Oats',
  product_name_ro: 'Ovaz',
  category: 'grains',
  calories: 380,
  protein: 13,
  carbohydrates: 68,
  fats: 7,
  fiber: 10,
  sugar: 1,
  salt: 0.1,
  saturated_fats: 1.2,
  serving_size_unit: 'g',
  serving_size_value: 100,
  similarity_score: 0.9,
  match_type: 'exact',
};

describe('useFoodSearch', () => {
  let client: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    wrapper = ({ children }) => createElement(QueryClientProvider, { client }, children);
    jest.mocked(loadNonBarcodedProducts).mockResolvedValue([product]);
    jest.mocked(fetchNonBarcodedProducts).mockResolvedValue([product]);
    jest.mocked(clearFoodCatalogQueryCache).mockImplementation(() => client.removeQueries({ queryKey: ['food-catalog', 'products'] }));
  });

  afterEach(() => client.clear());

  it('skips short queries and maps query results into food items', async () => {
    const { result } = renderHook(() => useFoodSearch(), { wrapper });
    await act(async () => result.current.handleSearch('  '));
    expect(loadNonBarcodedProducts).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);

    await act(async () => result.current.handleSearch('  Oats  '));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loadNonBarcodedProducts).toHaveBeenCalledWith([], null, 30, null, 'Oats');
    expect(result.current.searchResults[0]).toMatchObject({
      id: 'food-1',
      productName: 'Oats',
      productNameRo: 'Ovaz',
      category: 'grains',
      calories: 380,
      saturatedFats: 1.2,
      servingSize: { unit: 'g', value: 100 },
      relevanceScore: 0.9,
      matchType: 'exact',
    });
    expect(result.current.resultsCount).toBe(1);
  });

  it('reuses normalized query results and clears the shared catalog cache on reset', async () => {
    const { result } = renderHook(() => useFoodSearch(), { wrapper });
    await act(async () => result.current.handleSearch('Oats'));
    await waitFor(() => expect(result.current.searchResults).toHaveLength(1));
    await act(async () => result.current.handleSearch('oats'));

    expect(loadNonBarcodedProducts).toHaveBeenCalledTimes(1);
    act(() => result.current.resetCache());
    expect(clearFoodCatalogQueryCache).toHaveBeenCalledTimes(1);
    await act(async () => result.current.handleSearch('Oats'));
    await waitFor(() => expect(loadNonBarcodedProducts).toHaveBeenCalledTimes(2));
  });

  it('exposes query errors while leaving the result list empty', async () => {
    jest.mocked(loadNonBarcodedProducts).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useFoodSearch(), { wrapper });
    await act(async () => result.current.handleSearch('Oats'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.searchError).toMatch(/Unable to search foods/);
    expect(result.current.searchResults).toEqual([]);
  });

  it('loads suggestions through the shared service cache and handles short queries and failures', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useFoodSearch(), { wrapper });
    await expect(result.current.getSuggestions('o')).resolves.toEqual([]);
    await expect(result.current.getSuggestions(' oats ')).resolves.toEqual([
      { id: 'food-1', productName: 'Oats', category: 'grains', calories: 380 },
    ]);
    await expect(result.current.getSuggestions(' oats ')).resolves.toHaveLength(1);
    expect(fetchNonBarcodedProducts).toHaveBeenCalledTimes(2);

    jest.mocked(fetchNonBarcodedProducts).mockRejectedValue(new Error('offline'));
    await expect(result.current.getSuggestions('rice')).resolves.toEqual([]);
    expect(fetchNonBarcodedProducts).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

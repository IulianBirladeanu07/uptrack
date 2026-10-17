import { act, renderHook, waitFor } from '@testing-library/react-native';
import { fetchNonBarcodedProducts } from '../handlers/NutritionHandler';
import { useFoodSearch } from './useFoodSearch';

jest.mock('../handlers/NutritionHandler', () => ({
  fetchNonBarcodedProducts: jest.fn(),
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
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchNonBarcodedProducts as jest.Mock).mockResolvedValue([product]);
  });

  it('skips short queries and searches normalized text, mapping product fields', async () => {
    const { result } = renderHook(() => useFoodSearch());
    await act(async () => result.current.handleSearch('  '));
    expect(fetchNonBarcodedProducts).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);

    await act(async () => result.current.handleSearch('  Oats  '));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchNonBarcodedProducts).toHaveBeenCalledWith([], null, 30, null, 'Oats');
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

  it('uses cache for case-insensitive repeated searches and supports reset', async () => {
    const { result } = renderHook(() => useFoodSearch());
    await act(async () => result.current.handleSearch('Oats'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.handleSearch('oats'));
    expect(fetchNonBarcodedProducts).toHaveBeenCalledTimes(1);

    act(() => result.current.resetCache());
    await act(async () => result.current.handleSearch('Oats'));
    expect(fetchNonBarcodedProducts).toHaveBeenCalledTimes(2);
  });

  it('reports search errors and clears results', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (fetchNonBarcodedProducts as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useFoodSearch());
    await act(async () => result.current.handleSearch('Oats'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.searchError).toMatch(/Unable to search foods/);
    expect(result.current.searchResults).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns cached suggestions and handles short queries and request failures', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useFoodSearch());
    await expect(result.current.getSuggestions('o')).resolves.toEqual([]);
    await expect(result.current.getSuggestions(' oats ')).resolves.toEqual([
      { id: 'food-1', productName: 'Oats', category: 'grains', calories: 380 },
    ]);
    await expect(result.current.getSuggestions(' oats ')).resolves.toHaveLength(1);
    expect(fetchNonBarcodedProducts).toHaveBeenCalledTimes(1);

    (fetchNonBarcodedProducts as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(result.current.getSuggestions('rice')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

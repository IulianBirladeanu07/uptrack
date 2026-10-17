import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECENT_SEARCHES_KEY, useRecentSearches } from './useRecentSearches';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('useRecentSearches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('loads and filters persisted searches', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['Oats', '', null, 4, 'Chicken'])
    );
    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recentSearches).toEqual(['Oats', 'Chicken']);
    expect(result.current.count).toBe(2);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.getRecentSearch(0)).toBe('Oats');
    expect(result.current.getRecentSearch(20)).toBeNull();
    expect(result.current.hasRecentSearch('oAtS')).toBe(true);
    expect(result.current.hasRecentSearch('Rice')).toBe(false);
  });

  it('adds unique trimmed terms, puts duplicates first, and caps the list at five', async () => {
    const { result } = renderHook(() => useRecentSearches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addRecentSearch('');
      await result.current.addRecentSearch('x');
      await result.current.addRecentSearch('  Oats  ');
      await result.current.addRecentSearch('Chicken');
      await result.current.addRecentSearch('Rice');
      await result.current.addRecentSearch('Beans');
      await result.current.addRecentSearch('Yogurt');
      await result.current.addRecentSearch(' oats ');
    });

    expect(result.current.recentSearches).toEqual(['oats', 'Yogurt', 'Beans', 'Rice', 'Chicken']);
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      RECENT_SEARCHES_KEY,
      JSON.stringify(['oats', 'Yogurt', 'Beans', 'Rice', 'Chicken'])
    );
  });

  it('removes searches case-insensitively and clears storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['Oats', 'Rice']));
    const { result } = renderHook(() => useRecentSearches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.removeRecentSearch('oAtS'));
    expect(result.current.recentSearches).toEqual(['Rice']);
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(RECENT_SEARCHES_KEY, '["Rice"]');

    await act(async () => result.current.clearRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(RECENT_SEARCHES_KEY);
  });

  it('refreshes persisted values and safely handles invalid JSON and storage errors', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce('not-json')
      .mockRejectedValueOnce(error);
    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.refreshRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

import { renderHook, act } from '@testing-library/react-native';
import { useFoodContext } from '../context/FoodContext';
import useFoodCategories from './useFoodCategories';
import type { FoodCategoryData } from '../../../shared/types';

jest.mock('../context/FoodContext', () => ({
  useFoodContext: jest.fn(),
}));

const mockContext = (data: Partial<FoodCategoryData> & { loading?: boolean }) => {
  (useFoodContext as jest.Mock).mockReturnValue({
    recentMeals: [],
    frequentFoods: [],
    favoriteFoods: [],
    loading: false,
    ...data,
  });
};

describe('useFoodCategories', () => {
  it('returns the frequent foods as the initially selected category', () => {
    const foods = [{ id: 'oats', productName: 'Oats' }];
    mockContext({ frequentFoods: foods });

    const { result } = renderHook(() => useFoodCategories());

    expect(result.current.selectedCategory).toBe('Frequent');
    expect(result.current.categoryFoods).toEqual(foods);
    expect(result.current.isDataReady).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.message).toBe('');
    expect(result.current.getCategoryStats).toEqual({ Frequent: 1, Recent: 0, Favorites: 0 });
  });

  it('uses categories case-insensitively and reports not-yet-loaded data', () => {
    mockContext({ recentMeals: undefined, favoriteFoods: undefined, loading: true });
    const { result } = renderHook(() => useFoodCategories());

    expect(result.current.getCategoryFoods('RECENT')).toEqual({ data: [], loaded: false });
    expect(result.current.getCategoryLoadingState('recent')).toBe(true);
    expect(result.current.isCategoryAvailable('recent')).toBe(false);
    expect(result.current.getCategoryStats).toEqual({});
    expect(result.current.dataReady).toBe(false);
  });

  it('reports empty-state messages for each category and handles unknown categories', () => {
    mockContext({});
    const { result } = renderHook(() => useFoodCategories());

    expect(result.current.message).toMatch(/No frequently used foods/);
    expect(result.current.isCategoryEmpty('Frequent')).toBe(true);
    expect(result.current.getFoodsForCategory('unknown')).toEqual([]);
    expect(result.current.getCategoryFoods(null)).toEqual({ data: [], loaded: true });
    expect(result.current.getCategoryLoadingState(undefined)).toBe(false);
    expect(result.current.getCategoryFoods('recent').loaded).toBe(true);
    expect(result.current.getCategoryFoods('favorites').loaded).toBe(true);

    act(() => result.current.handleCategoryChange('Recent'));
    expect(result.current.message).toMatch(/No recent meals/);
    act(() => result.current.setSelectedCategory('Favorites'));
    expect(result.current.message).toMatch(/No favorite foods/);
    act(() => result.current.handleCategoryChange('custom'));
    expect(result.current.message).toBe('No foods found for this category.');
  });

  it('shows loading text until the selected category is loaded', () => {
    mockContext({ frequentFoods: undefined, loading: false });
    const { result } = renderHook(() => useFoodCategories());

    expect(result.current.loading).toBe(true);
    expect(result.current.isDataReady).toBe(false);
    expect(result.current.message).toBe('Loading frequent foods...');
    expect(result.current.frequentFoodsLoaded).toBe(false);
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import FoodSearchResults from './FoodSearchResults';
import type { FoodItemData } from './FoodItem';
import type { FoodSearchItem } from '../../../../shared/types';

jest.mock('./FoodItem', () => {
    const { Text: MockText, TouchableOpacity: MockTouchable } = require('react-native');
    return {
        __esModule: true,
        default: ({ item, onPress, onPlusPress, showPlusButton }: {
            item: FoodItemData;
            onPress?: (food: FoodItemData) => void;
            onPlusPress?: (food: FoodItemData) => void;
            showPlusButton?: boolean;
        }) => (
            <>
                <MockTouchable testID={`open-${item.id}`} onPress={() => onPress?.(item)}>
                    <MockText>{item.productName}</MockText>
                </MockTouchable>
                {showPlusButton && (
                    <MockTouchable testID={`add-${item.id}`} onPress={() => onPlusPress?.(item)}>
                        <MockText>add</MockText>
                    </MockTouchable>
                )}
            </>
        ),
    };
});

const food = (id: string, productName: string, calories: number): FoodSearchItem => ({
    id,
    productName,
    productNameEn: productName,
    productNameRo: null,
    category: 'dairy',
    calories,
    protein: 5,
    carbohydrates: 10,
    fats: 2,
    fiber: 0,
    sugar: 0,
    salt: 0,
    saturatedFats: 0,
    image: null,
    lastUpdated: '2026-10-16T00:00:00.000Z',
    servingSize: { unit: 'g', value: 100 },
    relevanceScore: 1,
    matchType: 'contains',
});

const results = [
    food('a', 'Greek Yogurt', 60),
    food('b', 'Greek Yogurt', 130),
    food('c', 'Oats', 380),
];

describe('FoodSearchResults selection', () => {
    it('opens the tapped result when two results share a product name', () => {
        const onItemPress = jest.fn();
        render(
            <FoodSearchResults
                searchResults={results}
                searchQuery="yogurt"
                showPlusButton
                onItemPress={onItemPress}
            />,
        );

        fireEvent.press(screen.getByTestId('open-b'));

        expect(onItemPress).toHaveBeenCalledTimes(1);
        expect(onItemPress.mock.calls[0][0]).toMatchObject({ id: 'b', calories: 130 });
    });

    it('adds the tapped result when two results share a product name', () => {
        const onPlusPress = jest.fn();
        render(
            <FoodSearchResults
                searchResults={results}
                searchQuery="yogurt"
                showPlusButton
                onPlusPress={onPlusPress}
            />,
        );

        fireEvent.press(screen.getByTestId('add-b'));

        expect(onPlusPress).toHaveBeenCalledTimes(1);
        expect(onPlusPress.mock.calls[0][0]).toMatchObject({ id: 'b', calories: 130 });
    });

    it('passes the original search item without the display-only quantity fields', () => {
        const onItemPress = jest.fn();
        render(
            <FoodSearchResults
                searchResults={results}
                searchQuery="oats"
                showPlusButton
                onItemPress={onItemPress}
            />,
        );

        fireEvent.press(screen.getByTestId('open-c'));

        expect(onItemPress.mock.calls[0][0]).toBe(results[2]);
    });
});

const rich = (id: string, productName: string, calories: number, protein: number): FoodSearchItem => ({
    ...food(id, productName, calories),
    protein,
});

const mixed = [
    rich('a', 'Rice Cake', 60, 5),
    rich('b', 'Yogurt', 130, 5),
    rich('c', 'Granola', 380, 5),
    rich('d', 'Chicken', 165, 31),
    rich('e', 'Tofu', 250, 20),
    rich('f', 'Edge Bar', 200, 10),
];

const pillCounts = () =>
    screen.getAllByText(/^\d+$/).map(el => el.props.children);

const visibleIds = () =>
    ['a', 'b', 'c', 'd', 'e', 'f'].filter(
        id => screen.queryByTestId(`open-${id}`) !== null,
    );

describe('FoodSearchResults filters', () => {
    it('shows a pill per filter with its count', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" />);

        expect(screen.getByText('All')).toBeTruthy();
        expect(screen.getByText('Under 200 kcal')).toBeTruthy();
        expect(screen.getByText('10g+ protein')).toBeTruthy();
        expect(pillCounts()).toEqual([6, 3, 3]);
    });

    it('lists every result by default', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" showPlusButton />);

        expect(visibleIds()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(screen.getByText('BEST MATCH')).toBeTruthy();
        expect(screen.getByText('6 results')).toBeTruthy();
        expect(screen.getByText('MORE OPTIONS (5)')).toBeTruthy();
    });

    it('keeps only foods under 200 calories for the low calorie filter', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" showPlusButton />);

        fireEvent.press(screen.getByText('Under 200 kcal'));

        expect(visibleIds()).toEqual(['a', 'b', 'd']);
        expect(screen.getByText('3 results')).toBeTruthy();
    });

    it('keeps foods with at least 10 g of protein for the protein filter', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" showPlusButton />);

        fireEvent.press(screen.getByText('10g+ protein'));

        expect(visibleIds()).toEqual(['d', 'e', 'f']);
    });

    it('makes the first filtered result the best match without a plus button', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" showPlusButton />);

        fireEvent.press(screen.getByText('10g+ protein'));

        expect(screen.queryByTestId('add-d')).toBeNull();
        expect(screen.getByTestId('add-e')).toBeTruthy();
        expect(screen.getByTestId('add-f')).toBeTruthy();
        expect(screen.getByText('MORE OPTIONS (2)')).toBeTruthy();
    });

    it('returns to every result when All is pressed again', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" showPlusButton />);

        fireEvent.press(screen.getByText('Under 200 kcal'));
        fireEvent.press(screen.getByText('All'));

        expect(visibleIds()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('uses the singular for a single result and hides the other-results section', () => {
        render(<FoodSearchResults searchResults={[mixed[2] as FoodSearchItem]} searchQuery="xx" />);

        expect(screen.getByText('1 result')).toBeTruthy();
        expect(screen.queryByText('MORE OPTIONS', { exact: false })).toBeNull();
    });

    it('shows no best match when the active filter excludes everything', () => {
        render(<FoodSearchResults searchResults={[mixed[2] as FoodSearchItem]} searchQuery="xx" />);

        fireEvent.press(screen.getByText('Under 200 kcal'));

        expect(screen.queryByText('BEST MATCH')).toBeNull();
        expect(visibleIds()).toEqual([]);
        expect(screen.getByText('Under 200 kcal')).toBeTruthy();
    });

    it('adds the best match with the original search item from the Add to Log button', () => {
        const onPlusPress = jest.fn();
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" onPlusPress={onPlusPress} />);

        fireEvent.press(screen.getByText('Add to Log'));

        expect(onPlusPress).toHaveBeenCalledTimes(1);
        expect(onPlusPress.mock.calls[0][0]).toBe(mixed[0]);
    });

    it('ignores stale results when there is no query', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="" showPlusButton />);

        expect(screen.queryByText('Under 200 kcal')).toBeNull();
        expect(screen.getByText('Keep typing')).toBeTruthy();
        expect(visibleIds()).toEqual([]);
    });
});

describe('FoodSearchResults states', () => {
    it('renders nothing while a search is loading', () => {
        const { toJSON } = render(
            <FoodSearchResults searchResults={mixed} searchQuery="xx" searchLoading />,
        );

        expect(toJSON()).toBeNull();
    });

    it('shows a loading label while recent searches load', () => {
        render(<FoodSearchResults recentSearchesLoading />);

        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('shows the search error and retries from the button', () => {
        const onRetrySearch = jest.fn();
        render(
            <FoodSearchResults
                searchQuery="xx"
                searchError="Search is offline"
                onRetrySearch={onRetrySearch}
            />,
        );

        expect(screen.getByText('Search Unavailable')).toBeTruthy();
        expect(screen.getByText('Search is offline')).toBeTruthy();

        fireEvent.press(screen.getByText('Try Again'));

        expect(onRetrySearch).toHaveBeenCalledTimes(1);
    });

    it('prefers the error over stale results while a query is set', () => {
        render(<FoodSearchResults searchResults={mixed} searchQuery="xx" searchError="Search is offline" />);

        expect(screen.getByText('Search Unavailable')).toBeTruthy();
        expect(visibleIds()).toEqual([]);
    });

    it('ignores a search error when there is no query', () => {
        render(<FoodSearchResults searchError="Search is offline" />);

        expect(screen.queryByText('Search Unavailable')).toBeNull();
        expect(screen.getByText('Search for Foods')).toBeTruthy();
    });

    it('offers to create a custom food when a query has no results', () => {
        const onCreateFood = jest.fn();
        render(<FoodSearchResults searchQuery="zzz" onCreateFood={onCreateFood} />);

        expect(screen.getByText('No Results Found')).toBeTruthy();
        expect(screen.getByText('We couldn\'t find "zzz"')).toBeTruthy();

        fireEvent.press(screen.getByText('Create Custom Food'));

        expect(onCreateFood).toHaveBeenCalledTimes(1);
    });

    it('shows the empty search prompt when there is no query and no history', () => {
        render(<FoodSearchResults />);

        expect(screen.getByText('Search for Foods')).toBeTruthy();
        expect(screen.queryByText('Recent Searches')).toBeNull();
    });

    it('lists recent searches and reruns the tapped one', () => {
        const onRecentSearchPress = jest.fn();
        render(
            <FoodSearchResults
                recentSearches={['oats', 'eggs']}
                onRecentSearchPress={onRecentSearchPress}
            />,
        );

        expect(screen.getByText('Recent Searches')).toBeTruthy();
        expect(screen.queryByText('Search for Foods')).toBeNull();

        fireEvent.press(screen.getByText('oats'));

        expect(onRecentSearchPress).toHaveBeenCalledWith('oats');
    });

    it('removes a recent search without triggering the search action', () => {
      const onRecentSearchPress = jest.fn();
      const onRemoveRecentSearch = jest.fn();
      render(
        <FoodSearchResults
          recentSearches={['oats']}
          onRecentSearchPress={onRecentSearchPress}
          onRemoveRecentSearch={onRemoveRecentSearch}
        />,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Remove oats from recent searches' }));

      expect(onRemoveRecentSearch).toHaveBeenCalledTimes(1);
      expect(onRemoveRecentSearch).toHaveBeenCalledWith('oats');
      expect(onRecentSearchPress).not.toHaveBeenCalled();
    });

    it('clears all recent searches from the Clear button', () => {
        const onClearAllRecentSearches = jest.fn();
        render(
            <FoodSearchResults
                recentSearches={['oats']}
                onClearAllRecentSearches={onClearAllRecentSearches}
            />,
        );

        fireEvent.press(screen.getByText('Clear'));

        expect(onClearAllRecentSearches).toHaveBeenCalledTimes(1);
    });

    it('runs a quick suggestion as a search', () => {
        const onRecentSearchPress = jest.fn();
        render(
            <FoodSearchResults
                recentSearches={['oats']}
                onRecentSearchPress={onRecentSearchPress}
            />,
        );

        fireEvent.press(screen.getByText('Salmon'));

        expect(onRecentSearchPress).toHaveBeenCalledWith('Salmon');
    });
});

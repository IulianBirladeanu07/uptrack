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

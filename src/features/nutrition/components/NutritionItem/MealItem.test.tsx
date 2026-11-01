import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { LoggedFood, RecentMeal } from '../../../../shared/types';
import { getFoodSelectionIdentity } from '../../screens/FoodSelectionScreen/foodSelectionIdentity';
import MealItem from './MealItem';

jest.mock('react-native-reanimated', () => {
    const { View: MockView } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View: MockView },
        useSharedValue: (initial: number) => ({ value: initial }),
        useAnimatedStyle: () => ({}),
        withTiming: (value: number) => value,
    };
});

jest.mock('./FoodItem', () => {
    const { Text: MockText, TouchableOpacity: MockTouchable } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: ({
            item,
            isSelected,
            isSelectionEmphasized,
            onPlusPress,
        }: {
            item: { selectionKey?: string };
            isSelected?: boolean;
            isSelectionEmphasized?: boolean;
            onPlusPress?: () => void;
        }) => (
            <MockTouchable
                testID={`food-${item.selectionKey}`}
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={isSelectionEmphasized ? 'Selection emphasized' : 'Selection subdued'}
                onPress={onPlusPress}
            >
                <MockText>Food</MockText>
            </MockTouchable>
        ),
    };
});

const food: LoggedFood = { id: 'same-food-id', productName: 'Rice', calories: 200 };
const yesterday: RecentMeal = {
    id: '2026-10-31_lunch',
    date: '2026-10-31',
    mealType: 'lunch',
    foods: [food],
    totalCalories: 200,
};
const friday: RecentMeal = {
    id: '2026-10-30_lunch',
    date: '2026-10-30',
    mealType: 'lunch',
    foods: [food],
    totalCalories: 200,
};
const mealWithTwoFoods: RecentMeal = {
    ...yesterday,
    foods: [
        food,
        { id: 'second-food-id', productName: 'Beans', calories: 100 },
    ],
    totalCalories: 300,
};

const MealSelection = () => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const onPlusPress = (item: LoggedFood & { selectionKey?: string }, toggleToAdd?: boolean) => {
        const key = getFoodSelectionIdentity(item);
        setSelected(previous => {
            const next = new Set(previous);
            if (toggleToAdd === true || (toggleToAdd == null && !next.has(key))) next.add(key);
            else next.delete(key);
            return next;
        });
    };
    const isFoodSelected = (item: LoggedFood & { selectionKey?: string }) =>
        selected.has(getFoodSelectionIdentity(item));

    return (
        <>
            <MealItem item={yesterday} onPlusPress={onPlusPress} isFoodSelected={isFoodSelected} />
            <MealItem item={friday} onPlusPress={onPlusPress} isFoodSelected={isFoodSelected} />
        </>
    );
};

const TwoFoodMealSelection = () => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const onPlusPress = (item: LoggedFood & { selectionKey?: string }, toggleToAdd?: boolean) => {
        const key = getFoodSelectionIdentity(item);
        setSelected(previous => {
            const next = new Set(previous);
            if (toggleToAdd === true || (toggleToAdd == null && !next.has(key))) next.add(key);
            else next.delete(key);
            return next;
        });
    };
    const isFoodSelected = (item: LoggedFood & { selectionKey?: string }) =>
        selected.has(getFoodSelectionIdentity(item));

    return (
        <MealItem
            item={mealWithTwoFoods}
            onPlusPress={onPlusPress}
            isFoodSelected={isFoodSelected}
        />
    );
};

describe('MealItem selection', () => {
    it('keeps same-id foods selected only in their source meal and syncs Add All state', () => {
        render(<MealSelection />);

        const yesterdayFood = screen.getByTestId('food-2026-10-31_lunch:same-food-id');
        const fridayFood = screen.getByTestId('food-2026-10-30_lunch:same-food-id');
        const addAllButtons = screen.getAllByRole('button', { name: 'Add all items' });

        fireEvent.press(yesterdayFood);

        expect(yesterdayFood.props.accessibilityState).toEqual({ selected: true });
        expect(fridayFood.props.accessibilityState).toEqual({ selected: false });
        expect(yesterdayFood.props.accessibilityHint).toBe('Selection subdued');
        expect(fridayFood.props.accessibilityHint).toBe('Selection emphasized');
        expect(screen.getByRole('button', { name: 'Undo add all items' }).props.accessibilityState)
            .toEqual({ selected: true });
        expect(addAllButtons[1].props.accessibilityState).toEqual({ selected: false });

        fireEvent.press(addAllButtons[1]);

        expect(fridayFood.props.accessibilityState).toEqual({ selected: true });
        expect(fridayFood.props.accessibilityHint).toBe('Selection subdued');
        expect(screen.getAllByRole('button', { name: 'Undo add all items' })).toHaveLength(2);
    });

    it('uses the same selected appearance for one item and Add All', () => {
        render(<TwoFoodMealSelection />);

        const firstFood = screen.getByTestId('food-2026-10-31_lunch:same-food-id');
        const secondFood = screen.getByTestId('food-2026-10-31_lunch:second-food-id');

        fireEvent.press(firstFood);

        expect(firstFood.props.accessibilityState).toEqual({ selected: true });
        expect(firstFood.props.accessibilityHint).toBe('Selection subdued');
        expect(secondFood.props.accessibilityState).toEqual({ selected: false });
        expect(secondFood.props.accessibilityHint).toBe('Selection emphasized');

        fireEvent.press(screen.getByRole('button', { name: 'Add all items' }));

        expect(screen.getByRole('button', { name: 'Undo add all items' })).toBeTruthy();
        expect(firstFood.props.accessibilityHint).toBe('Selection subdued');
        expect(secondFood.props.accessibilityHint).toBe('Selection subdued');
        expect(firstFood.props.accessibilityState).toEqual({ selected: true });
        expect(secondFood.props.accessibilityState).toEqual({ selected: true });
    });
});

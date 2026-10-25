import { fireEvent, render, screen } from '@testing-library/react-native';
import MealContainer from './MealContainer';
import type { LoggedFood } from '../../../../shared/types';

jest.mock('./FoodItem', () => {
    const { Text: MockText } = require('react-native');
    return {
        __esModule: true,
        default: ({ item }: { item: { productName: string } }) => <MockText>{item.productName}</MockText>,
    };
});

jest.mock('lucide-react-native', () => ({
    Coffee: () => null,
    Utensils: () => null,
    Moon: () => null,
    Cookie: () => null,
}));

const food = (id: string, calories: number): LoggedFood => ({
    id,
    productName: `Food ${id}`,
    calories,
    protein: 10,
    carbohydrates: 20,
    fats: 5,
    quantity: 1,
});

const setup = (over: Partial<React.ComponentProps<typeof MealContainer>> = {}) =>
    render(
        <MealContainer
            foods={[food('a', 300), food('b', 220)]}
            onPress={jest.fn()}
            selectedMeal="breakfast"
            setSelectedMeal={jest.fn()}
            {...over}
        />,
    );

describe('MealContainer meal selector', () => {
    it('shows meal names and a separate total for the selected meal', () => {
        setup();

        expect(screen.getByText('Breakfast')).toBeTruthy();
        expect(screen.getByText('Lunch')).toBeTruthy();
        expect(screen.getByText('Dinner')).toBeTruthy();
        expect(screen.getByText('Snacks')).toBeTruthy();
        expect(screen.getByText('Meal total')).toBeTruthy();
        expect(screen.getByText('520')).toBeTruthy();
        expect(screen.getByText('kcal')).toBeTruthy();
    });

    it.each(['breakfast', 'lunch', 'dinner', 'snacks'] as const)(
        'shows the selected meal total for %s',
        meal => {
            setup({ foods: [food(`${meal}-food`, 1_100)], selectedMeal: meal });

            expect(screen.getByText('Meal total')).toBeTruthy();
            expect(screen.getByText('1,100')).toBeTruthy();
        },
    );

    it('shows the empty state for the selected meal', () => {
        setup({ foods: [], selectedMeal: 'lunch' });

        expect(screen.getByText('No foods added for lunch')).toBeTruthy();
    });

    it('still switches meal from a tab press', () => {
        const setSelectedMeal = jest.fn();
        setup({ setSelectedMeal });

        fireEvent.press(screen.getByText('Dinner'));

        expect(setSelectedMeal).toHaveBeenCalledWith('dinner');
    });

});

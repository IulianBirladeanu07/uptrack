import { fireEvent, render, screen } from '@testing-library/react-native';
import MealContainer from './MealContainer';
import type { LoggedFood, MealType, NutritionTotals } from '../../../../shared/types';

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

const totals = (calories: number, protein = 0, carbs = 0, fat = 0): NutritionTotals => ({ calories, protein, carbs, fat });

const mealTotals: Record<MealType, NutritionTotals> = {
    breakfast: totals(520.4, 31.2, 60.6, 14.9),
    lunch: totals(0),
    dinner: totals(1234, 80, 120, 40),
    snacks: totals(0),
};

const setup = (over: Partial<React.ComponentProps<typeof MealContainer>> = {}) =>
    render(
        <MealContainer
            foods={[food('a', 300), food('b', 220)]}
            onPress={jest.fn()}
            selectedMeal="breakfast"
            setSelectedMeal={jest.fn()}
            mealTotals={mealTotals}
            {...over}
        />,
    );

describe('MealContainer meal totals', () => {
    it('shows each logged meal total under its tab and leaves empty meals blank', () => {
        setup();

        expect(screen.getByText('520 kcal')).toBeTruthy();
        expect(screen.getByText('1,234 kcal')).toBeTruthy();
        expect(screen.getAllByText(/kcal$/)).toHaveLength(3);
    });

    it('summarises the selected meal with its calories and macros', () => {
        setup();

        expect(screen.getByText('2 items · 520 kcal')).toBeTruthy();
        expect(screen.getByText('P 31 g · C 61 g · F 15 g')).toBeTruthy();
    });

    it('uses the singular for a single item', () => {
        setup({ foods: [food('a', 300)] });

        expect(screen.getByText('1 item · 520 kcal')).toBeTruthy();
    });

    it('hides the summary when the selected meal is empty', () => {
        setup({ foods: [], selectedMeal: 'lunch' });

        expect(screen.queryByText(/items? ·/)).toBeNull();
        expect(screen.getByText('No foods added for lunch')).toBeTruthy();
    });

    it('still switches meal from a tab press', () => {
        const setSelectedMeal = jest.fn();
        setup({ setSelectedMeal });

        fireEvent.press(screen.getByText('Dinner'));

        expect(setSelectedMeal).toHaveBeenCalledWith('dinner');
    });

    it('renders without totals', () => {
        setup({ mealTotals: undefined });

        expect(screen.queryByText(/kcal$/)).toBeNull();
        expect(screen.getByText('Food a')).toBeTruthy();
    });
});

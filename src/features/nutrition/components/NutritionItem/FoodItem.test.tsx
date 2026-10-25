import { act, fireEvent, render, screen } from '@testing-library/react-native';
import FoodItem from './FoodItem';

const mockConfirmDelete = jest.fn();

jest.mock('../../../../shared/hooks/useSwipeToDelete', () => ({
    __esModule: true,
    default: () => ({
        gesture: {},
        containerStyle: {},
        trashStyle: {},
        confirmDelete: (...args: unknown[]) => mockConfirmDelete(...args),
    }),
}));

jest.mock('react-native-gesture-handler', () => ({
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../../shared/hooks/usePressAnimation', () => ({
    __esModule: true,
    default: () => ({ animatePress: jest.fn(), pressStyle: {} }),
}));

jest.mock('expo-image', () => ({ Image: () => null }));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null }));

const item = { id: 'f1', productName: 'Greek yogurt', calories: 120, protein: 10, carbohydrates: 6, fats: 4, quantity: 150, unit: 'g' };

const row = () => screen.getByRole('button', { name: 'Greek yogurt, 120 kilocalories' });

describe('FoodItem accessibility', () => {
    beforeEach(() => mockConfirmDelete.mockClear());

    it('reads the food name and calories as one button', () => {
        render(<FoodItem item={item} />);

        expect(row()).toBeTruthy();
    });

    it('offers a delete action only when the food can be deleted, and runs the delete confirmation', () => {
        const { rerender } = render(<FoodItem item={item} />);
        expect(row().props.accessibilityActions).toEqual([]);

        rerender(<FoodItem item={item} isFoodDeletable />);
        expect(row().props.accessibilityActions).toEqual([{ name: 'delete', label: 'Delete food' }]);

        act(() => {
            row().props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } });
        });
        expect(mockConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('lets a screen reader select and unselect the food from the row actions', () => {
        const onPlusPress = jest.fn();
        render(<FoodItem item={item} showPlusButton onPlusPress={onPlusPress} />);

        expect(row().props.accessibilityActions).toEqual([{ name: 'select', label: 'Select food' }]);

        act(() => {
            row().props.onAccessibilityAction({ nativeEvent: { actionName: 'select' } });
        });

        expect(onPlusPress).toHaveBeenCalledWith(item);
        expect(row().props.accessibilityActions).toEqual([{ name: 'select', label: 'Unselect food' }]);
    });

    it('marks the plus button as a checkbox that follows the selection', () => {
        render(<FoodItem item={item} showPlusButton />);

        const box = screen.getByRole('checkbox', { name: 'Add food to selection' });
        expect(box.props.accessibilityState).toEqual({ checked: false });

        fireEvent.press(box);

        expect(screen.getByRole('checkbox', { name: 'Remove food from selection' }).props.accessibilityState).toEqual({ checked: true });
    });
});

describe('FoodItem macro labels', () => {
    it('shows positive sub-gram nutrients without rounding them down to zero', () => {
        render(<FoodItem item={{ ...item, carbohydrates: null, protein: 0.4, fats: 0.2 }} />);

        expect(screen.getByText('<1P')).toBeTruthy();
        expect(screen.getByText('<1F')).toBeTruthy();
        expect(screen.queryByText(/^(?:\d+|<1)C$/)).toBeNull();
    });

    it('omits macro chips when the nutrient value is actually zero', () => {
        render(<FoodItem item={{ ...item, carbohydrates: 0, protein: 0, fats: 0 }} />);

        expect(screen.queryByText(/^(?:\d+|<1)[CPF]$/)).toBeNull();
    });
});

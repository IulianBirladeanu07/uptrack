import { fireEvent, render, screen } from '@testing-library/react-native';
import CustomFoodScreen from './CustomFoodScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockRegisterInputRef = jest.fn(() => jest.fn());
const mockHandleFieldFocus = jest.fn();
const mockFoodData = {
  productName: '',
  calories: '',
  carbohydrates: '',
  protein: '',
  fats: '',
  fiber: '',
  sugar: '',
  saturatedFats: '',
  salt: '',
  amount: '100',
  unit: 'g',
  barcode: '',
};

jest.mock('../../../../shared/navigation', () => ({
  useAppNavigation: () => mockNavigation,
  useAppRoute: () => ({
    params: { type: 'foodWithoutBarcode', meal: 'lunch', selectedDate: '2026-10-17' },
  }),
}));

jest.mock('../../helpers/useCustomFood', () => ({
  useCustomFood: () => ({
    foodData: mockFoodData,
    errors: { macroNutrients: 'Macro values exceed the serving amount' },
    handleFieldChange: jest.fn(),
    handleFieldFocus: mockHandleFieldFocus,
    handleSubmitEditing: jest.fn(),
    handleAmountChange: jest.fn(),
    changeUnit: jest.fn(),
    handleSubmit: jest.fn(),
    focusFirstField: jest.fn(),
    inputRefs: {},
    registerInputRef: mockRegisterInputRef,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('CustomFoodScreen', () => {
  it('keeps the first view focused on the required food details', () => {
    render(<CustomFoodScreen />);

    expect(screen.getByText('Name and calories required. Nutrition details optional.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add nutrition details' })).toBeTruthy();
    expect(screen.queryByText('Carbs')).toBeNull();
  });

  it('reveals macro and extra nutrients progressively', () => {
    render(<CustomFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Add nutrition details' }));

    expect(screen.getByText('Nutrition values for 100 g')).toBeTruthy();
    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.getByText('Macro values exceed the serving amount')).toBeTruthy();
    expect(screen.queryByText('Fiber')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Add more nutrients' }));

    expect(screen.getByText('Fiber')).toBeTruthy();
    expect(screen.getByText('Sugar')).toBeTruthy();
    expect(screen.getByText('Saturated fat')).toBeTruthy();
    expect(screen.getByText('Salt')).toBeTruthy();
  });

  it('keeps the serving amount input connected to its focus state', () => {
    render(<CustomFoodScreen />);

    fireEvent(screen.getByLabelText('Serving size, 100 g'), 'focus');

    expect(mockHandleFieldFocus).toHaveBeenCalledWith('amount');
  });
});

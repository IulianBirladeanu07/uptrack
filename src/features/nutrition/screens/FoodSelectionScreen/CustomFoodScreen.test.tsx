import { fireEvent, render, screen } from '@testing-library/react-native';
import CustomFoodScreen from './CustomFoodScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockRegisterInputRef = jest.fn(() => jest.fn());
const mockHandleFieldFocus = jest.fn();
const mockChangeUnit = jest.fn();
const mockRouteParams: {
  type: string;
  barcode?: string;
  meal: string;
  selectedDate: string;
  nutritionLabelValues?: Record<string, string>;
} = { type: 'foodWithoutBarcode', meal: 'lunch', selectedDate: '2026-10-17' };
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
const mockUseCustomFood = jest.fn(() => ({
  foodData: mockFoodData,
  errors: { macroNutrients: 'Macro values exceed the serving amount' },
  handleFieldChange: jest.fn(),
  handleFieldFocus: mockHandleFieldFocus,
  handleSubmitEditing: jest.fn(),
  handleAmountChange: jest.fn(),
  changeUnit: mockChangeUnit,
  handleSubmit: jest.fn(),
  focusFirstField: jest.fn(),
  inputRefs: {},
  registerInputRef: mockRegisterInputRef,
}));

jest.mock('../../../../shared/navigation', () => ({
  useAppNavigation: () => mockNavigation,
  useAppRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock('../../helpers/useCustomFood', () => ({
  useCustomFood: (...args: Parameters<typeof mockUseCustomFood>) => mockUseCustomFood(...args),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('CustomFoodScreen', () => {
  beforeEach(() => {
    mockRouteParams.type = 'foodWithoutBarcode';
    mockRouteParams.barcode = undefined;
    mockRouteParams.nutritionLabelValues = undefined;
    mockUseCustomFood.mockClear();
  });

  it('separates calories from the three main macros', () => {
    render(<CustomFoodScreen />);

    expect(screen.getByLabelText('Serving size, 100 g')).toBeTruthy();
    expect(screen.getByText('per 100 g')).toBeTruthy();
    const mainNutrients = [
      screen.getByLabelText('Calories, kcal'),
      screen.getByLabelText('Carbs, g'),
      screen.getByLabelText('Protein, g'),
      screen.getByLabelText('Fat, g'),
    ];
    expect(mainNutrients).toHaveLength(4);
    expect(screen.queryByText('Macros')).toBeNull();
    mainNutrients.forEach(input => expect(input.props.value).toBe(''));
    expect(screen.queryByText('Fiber')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add more nutrition details' })).toBeTruthy();
  });

  it('reveals additional nutrients when requested', () => {
    render(<CustomFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Add more nutrition details' }));

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

  it('opens the unit menu above the serving selector and applies a selection', async () => {
    render(<CustomFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Serving unit, g' }));
    const gramsOption = await screen.findByRole('button', { name: 'Grams (g)' });
    expect(gramsOption.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('button', { name: 'Ounces (oz)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Serving (serving)' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Milliliters (ml)' }));

    expect(mockChangeUnit).toHaveBeenCalledWith('ml');
    expect(screen.queryByRole('button', { name: 'Milliliters (ml)' })).toBeNull();
  });

  it('dismisses the unit menu when the user taps outside', async () => {
    render(<CustomFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Serving unit, g' }));
    await screen.findByRole('button', { name: 'Grams (g)' });
    fireEvent.press(screen.getByTestId('unit-picker-backdrop'));

    expect(screen.queryByRole('button', { name: 'Grams (g)' })).toBeNull();
    expect(mockChangeUnit).not.toHaveBeenCalled();
  });

  it('closes the unit menu with the system back action', async () => {
    render(<CustomFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Serving unit, g' }));
    await screen.findByRole('button', { name: 'Grams (g)' });
    fireEvent(screen.getByTestId('unit-picker-modal'), 'requestClose');

    expect(screen.queryByRole('button', { name: 'Grams (g)' })).toBeNull();
  });

  it('shows extracted values as a review step and passes them into the form', () => {
    const nutritionLabelValues = { calories: '160', protein: '7', amount: '35', unit: 'g' };
    mockRouteParams.type = 'foodWithBarcode';
    mockRouteParams.barcode = '12345678';
    mockRouteParams.nutritionLabelValues = nutritionLabelValues;

    render(<CustomFoodScreen />);

    expect(screen.getByText('Review Nutrition Label')).toBeTruthy();
    expect(screen.getByText('Scanned values can be wrong. Check the serving basis and every value against the package before adding.')).toBeTruthy();
    expect(mockUseCustomFood).toHaveBeenCalledWith(
      'foodWithBarcode',
      mockNavigation,
      '12345678',
      'lunch',
      '2026-10-17',
      nutritionLabelValues,
    );
  });
});

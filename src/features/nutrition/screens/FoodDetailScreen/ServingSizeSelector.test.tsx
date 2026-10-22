import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ServingSizeSelector from './ServingSizeSelector';

const setup = (overrides: Partial<React.ComponentProps<typeof ServingSizeSelector>> = {}) => {
    const onQuantityChange = jest.fn();
    const screen = render(
        <ServingSizeSelector
            quantity={1}
            onQuantityChange={onQuantityChange}
            servingUnit="g"
            onServingUnitPress={jest.fn()}
            onPredefinedSizePress={jest.fn()}
            {...overrides}
        />,
    );
    return { ...screen, onQuantityChange, input: screen.getByLabelText('Serving quantity input') };
};

describe('ServingSizeSelector', () => {
    test('reports a decimal point value', () => {
        const { input, onQuantityChange, queryByText } = setup();

        fireEvent.changeText(input, '1.5');

        expect(onQuantityChange).toHaveBeenLastCalledWith(1.5);
        expect(queryByText('Please enter a valid positive number.')).toBeNull();
    });

    test('reports a decimal comma value as the same number', () => {
        const { input, onQuantityChange, queryByText } = setup();

        fireEvent.changeText(input, '1,5');

        expect(onQuantityChange).toHaveBeenLastCalledWith(1.5);
        expect(queryByText('Please enter a valid positive number.')).toBeNull();
    });

    test('rejects empty, zero and non-numeric input without reporting a quantity', () => {
        const { input, onQuantityChange, getByText } = setup();

        fireEvent.changeText(input, '');
        expect(getByText('Quantity cannot be empty.')).toBeTruthy();
        fireEvent.changeText(input, '0');
        expect(getByText('Please enter a valid positive number.')).toBeTruthy();
        fireEvent.changeText(input, 'abc');
        expect(getByText('Please enter a valid positive number.')).toBeTruthy();

        expect(onQuantityChange).not.toHaveBeenCalled();
    });

    test('rejects a comma value above the maximum', () => {
        const { input, onQuantityChange, getByText } = setup({ maxQuantity: 5 });

        fireEvent.changeText(input, '5,5');

        expect(getByText('Quantity cannot exceed 5.')).toBeTruthy();
        expect(onQuantityChange).not.toHaveBeenCalled();
    });

    test('rejects values with extra separators or spaces', () => {
        const { input, onQuantityChange, getByText } = setup();

        fireEvent.changeText(input, '1.2.3');
        expect(getByText('Please enter a valid positive number.')).toBeTruthy();
        fireEvent.changeText(input, '1 000');
        expect(getByText('Please enter a valid positive number.')).toBeTruthy();

        expect(onQuantityChange).not.toHaveBeenCalled();
    });

    test('accepts a trailing decimal point while typing', () => {
        const { input, onQuantityChange } = setup();

        fireEvent.changeText(input, '5.');

        expect(onQuantityChange).toHaveBeenLastCalledWith(5);
    });

    test('reports validity changes to the parent', () => {
        const onValidityChange = jest.fn();
        const { input } = setup({ maxQuantity: 5, onValidityChange });

        fireEvent.changeText(input, '');
        expect(onValidityChange).toHaveBeenLastCalledWith(false);
        fireEvent.changeText(input, '9');
        expect(onValidityChange).toHaveBeenLastCalledWith(false);
        fireEvent.changeText(input, '2');
        expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });

    test('a quick serving repairs an invalid field', () => {
        const onValidityChange = jest.fn();
        const onPredefinedSizePress = jest.fn();
        const { input, getByText, queryByText } = setup({
            predefinedSizes: [50],
            onPredefinedSizePress,
            onValidityChange,
        });

        fireEvent.changeText(input, '');
        expect(getByText('Quantity cannot be empty.')).toBeTruthy();
        fireEvent.press(getByText('50 g'));

        expect(onPredefinedSizePress).toHaveBeenCalledWith(50);
        expect(onValidityChange).toHaveBeenLastCalledWith(true);
        expect(queryByText('Quantity cannot be empty.')).toBeNull();
        expect(input.props.value).toBe('50');
    });
});

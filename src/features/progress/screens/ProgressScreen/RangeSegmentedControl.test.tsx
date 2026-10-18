import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import RangeSegmentedControl from './RangeSegmentedControl';

const options = [
    { key: 'PHASE', label: 'Phase · 19W' },
    { key: '8W', label: '8W' },
    { key: '12W', label: '12W' },
];

describe('RangeSegmentedControl', () => {
    it('renders labels and selects only the active option', () => {
        render(<RangeSegmentedControl options={options} selectedKey="PHASE" onSelect={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Phase · 19W' })).toHaveAccessibilityState({ selected: true });
        expect(screen.getByRole('button', { name: '8W' })).toHaveAccessibilityState({ selected: false });
        expect(screen.getByRole('button', { name: '12W' })).toHaveAccessibilityState({ selected: false });
    });

    it('selects the pressed option', () => {
        const onSelect = jest.fn();
        render(<RangeSegmentedControl options={options} selectedKey="PHASE" onSelect={onSelect} />);

        fireEvent.press(screen.getByRole('button', { name: '12W' }));

        expect(onSelect).toHaveBeenCalledWith('12W');
    });
});

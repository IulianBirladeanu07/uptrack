import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import RangeSegmentedControl from './RangeSegmentedControl';
import { toBeSelected } from '@testing-library/react-native/matchers';

expect.extend({ toBeSelected });

const options = [
    { key: 'PHASE', label: 'Phase · 19 wk' },
    { key: '8W', label: '8 wk' },
    { key: '12W', label: '12 wk' },
];

describe('RangeSegmentedControl', () => {
    it('renders labels and selects only the active option', () => {
        render(<RangeSegmentedControl options={options} selectedKey="PHASE" onSelect={jest.fn()} />);

        expect(screen.getByRole('button', { name: 'Phase · 19 wk' })).toBeSelected();
        expect(screen.getByRole('button', { name: '8 wk' })).not.toBeSelected();
        expect(screen.getByRole('button', { name: '12 wk' })).not.toBeSelected();
    });

    it('selects the pressed option', () => {
        const onSelect = jest.fn();
        render(<RangeSegmentedControl options={options} selectedKey="PHASE" onSelect={onSelect} />);

        fireEvent.press(screen.getByRole('button', { name: '12 wk' }));

        expect(onSelect).toHaveBeenCalledWith('12W');
    });
});

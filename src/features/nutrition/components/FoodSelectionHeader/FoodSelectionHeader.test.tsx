import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FoodSelectionHeader from './FoodSelectionHeader';

describe('FoodSelectionHeader', () => {
  it('keeps calorie remaining visible without adding daily macro balances', () => {
    render(
      <FoodSelectionHeader
        currentCalories={482}
        targetCalories={3209}
        onQuickActionsPress={jest.fn()}
      />,
    );

    expect(screen.getByText('482 / 3,209 kcal')).toBeTruthy();
    expect(screen.getByText('Calories today')).toBeTruthy();
    expect(screen.getByText('2,727 kcal left')).toBeTruthy();
    expect(screen.queryByLabelText('Daily macro balance')).toBeNull();
  });
});

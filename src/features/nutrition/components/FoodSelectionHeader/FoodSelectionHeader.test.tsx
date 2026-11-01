import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FoodSelectionHeader from './FoodSelectionHeader';

describe('FoodSelectionHeader', () => {
  it('shows actionable calories remaining and a progress bar without repeating the ratio', () => {
    render(
      <FoodSelectionHeader
        currentCalories={482}
        targetCalories={3209}
        onQuickActionsPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Daily calories')).toBeTruthy();
    expect(screen.getByText('2,727 kcal left')).toBeTruthy();
    expect(screen.queryByText('482 / 3,209 kcal')).toBeNull();
    expect(screen.queryByLabelText('Daily macro balance')).toBeNull();
  });

  it('shows consumed calories when there is no valid target', () => {
    render(
      <FoodSelectionHeader
        currentCalories={482}
        targetCalories={0}
        onQuickActionsPress={jest.fn()}
      />,
    );

    expect(screen.getByText('482 kcal')).toBeTruthy();
    expect(screen.queryByText(/kcal left|kcal over/)).toBeNull();
  });
});

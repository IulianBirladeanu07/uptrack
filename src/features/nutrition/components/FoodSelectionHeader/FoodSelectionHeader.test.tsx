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
    expect(screen.getByRole('progressbar', { name: 'Daily calorie progress' }).props.accessibilityValue).toEqual({
      min: 0,
      max: 3209,
      now: 482,
    });
  });

  it('includes selected foods in progress without rounding before calculating the remainder', () => {
    render(
      <FoodSelectionHeader
        currentCalories={482.4}
        selectedFoods={[{ calories: 85.5 }, { calories: '0.4' }]}
        targetCalories={3209}
        onQuickActionsPress={jest.fn()}
      />,
    );

    expect(screen.getByText('2,641 kcal left')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Daily calorie progress' }).props.accessibilityValue).toEqual({
      min: 0,
      max: 3209,
      now: 568.3,
    });
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

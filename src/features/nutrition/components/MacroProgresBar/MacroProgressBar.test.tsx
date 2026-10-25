import { render, screen } from '@testing-library/react-native';
import MacroProgressBar from './MacroProgressBar';

const renderBar = (value: number) => render(
  <MacroProgressBar
    value={value}
    maxValue={100}
    label="Carbs"
    color="#4caf50"
    hasTargets
    testID="macro-bar"
  />,
);

describe('MacroProgressBar', () => {
  it('shows the normal label while the value is under target', () => {
    renderBar(80);

    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.getByText('80 / 100g')).toBeTruthy();
  });

  it('shows the same compact label when exactly on target', () => {
    renderBar(100);

    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.getByText('100 / 100g')).toBeTruthy();
  });

  it('keeps above-target values readable without an extra percentage label', () => {
    renderBar(150);

    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.queryByText('150%')).toBeNull();
    expect(screen.getByText('150 / 100g')).toBeTruthy();
  });
});

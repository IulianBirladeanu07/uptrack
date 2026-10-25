import { render, screen } from '@testing-library/react-native';
import NutritionStats from './NutritionStats';
import type useDailyNutrition from '../../helpers/useDailyNutrition';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

jest.mock('../../../../shared/components/CircularProgress/CircularProgress', () => () => null);

const renderStats = (dailySteps: number) => render(
  <NutritionStats
    onWeightPress={jest.fn()}
    dailyNutrition={{ calories: 0, protein: 0, carbs: 0, fat: 0 }}
    userMacros={{
      targetCalories: 2000,
      targetCarbs: 200,
      targetProtein: 100,
      targetFats: 70,
    } as ReturnType<typeof useDailyNutrition>['userMacros']}
    hasTargets
    learningData={null}
    weightData={null}
    dailySteps={dailySteps}
    initialLoadComplete
  />,
);

describe('NutritionStats steps display', () => {
  it('shows zero steps and the target before the goal is reached', () => {
    renderStats(0);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('10,000 goal')).toBeTruthy();
  });

  it('shows the current count and reached message after the goal', () => {
    renderStats(11416);

    expect(screen.getByText('11,416')).toBeTruthy();
    expect(screen.getByText('10,000 goal')).toBeTruthy();
  });
});

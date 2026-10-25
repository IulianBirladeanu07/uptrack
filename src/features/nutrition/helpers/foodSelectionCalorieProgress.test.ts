import { getFoodSelectionCalorieProgress } from './foodSelectionCalorieProgress';

describe('getFoodSelectionCalorieProgress', () => {
  it('shows calories remaining below the target', () => {
    expect(getFoodSelectionCalorieProgress(482, 3209)).toEqual({ fillRatio: 482 / 3209, status: '2,727 kcal left' });
  });

  it('reports on target without exceeding the progress track', () => {
    expect(getFoodSelectionCalorieProgress(3209, 3209)).toEqual({ fillRatio: 1, status: 'On target' });
  });

  it('reports calories over target while capping the visual fill', () => {
    expect(getFoodSelectionCalorieProgress(3939, 3209)).toEqual({ fillRatio: 1, status: '730 kcal over' });
  });

  it('does not show a progress status when the user has no calorie target', () => {
    expect(getFoodSelectionCalorieProgress(500)).toEqual({ fillRatio: 0, status: null });
  });

});

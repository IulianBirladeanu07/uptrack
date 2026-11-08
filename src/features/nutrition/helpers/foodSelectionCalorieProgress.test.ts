import {
  getFoodSelectionCalorieProgress,
  getFoodSelectionDisplayedCalories,
} from './foodSelectionCalorieProgress';

describe('getFoodSelectionDisplayedCalories', () => {
  it('adds selected calories before submission', () => {
    expect(getFoodSelectionDisplayedCalories(482.4, 85.9)).toBeCloseTo(568.3);
  });

  it('keeps the submitted calorie preview fixed as the meal total updates', () => {
    expect(getFoodSelectionDisplayedCalories(1330, 85.9, 568.3)).toBeCloseTo(568.3);
  });

  it('ignores intermediate meal totals while submission is pending', () => {
    expect(getFoodSelectionDisplayedCalories(1330, 850, 999)).toBe(999);
  });
});

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

import { getFoodSelectionCalorieProgress, getFoodSelectionMacroBalances } from './foodSelectionCalorieProgress';

describe('getFoodSelectionCalorieProgress', () => {
  it('shows calories remaining below the target', () => {
    expect(getFoodSelectionCalorieProgress(482, 3209)).toEqual({ fillRatio: 482 / 3209, status: '2,727 left' });
  });

  it('reports on target without exceeding the progress track', () => {
    expect(getFoodSelectionCalorieProgress(3209, 3209)).toEqual({ fillRatio: 1, status: 'On target' });
  });

  it('reports calories over target while capping the visual fill', () => {
    expect(getFoodSelectionCalorieProgress(3939, 3209)).toEqual({ fillRatio: 1, status: '730 over' });
  });

  it('does not show a progress status when the user has no calorie target', () => {
    expect(getFoodSelectionCalorieProgress(500)).toEqual({ fillRatio: 0, status: null });
  });

  it('shows remaining macros after including foods selected in the search screen', () => {
    expect(getFoodSelectionMacroBalances(
      { carbs: 100, protein: 80, fat: 40 },
      { carbs: 200, protein: 100, fat: 70 },
      [{ carbohydrates: 25, protein: 10, fats: 5 }],
    )).toEqual([
      { key: 'carbs', label: 'C', status: '75g left' },
      { key: 'protein', label: 'P', status: '10g left' },
      { key: 'fat', label: 'F', status: '25g left' },
    ]);
  });

  it('reports macros over target without suppressing other remaining macros', () => {
    expect(getFoodSelectionMacroBalances(
      { carbs: 210, protein: 80, fat: 70 },
      { carbs: 200, protein: 100, fat: 70 },
      [],
    )).toEqual([
      { key: 'carbs', label: 'C', status: '10g over' },
      { key: 'protein', label: 'P', status: '20g left' },
      { key: 'fat', label: 'F', status: 'on target' },
    ]);
  });
});

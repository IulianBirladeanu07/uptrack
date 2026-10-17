import { applyFoodFilter, HIGH_PROTEIN_MIN, LOW_CALORIE_LIMIT } from './foodSearchFilters';
import type { FoodSearchItem } from '../../../../shared/types';

const item = (id: string, calories: number, protein: number) =>
  ({ id, calories, protein }) as FoodSearchItem;

const results = [
  item('a', 60, 5),
  item('b', 199.9, 9.9),
  item('c', 200, 10),
  item('d', 380, 31),
];

const ids = (list: FoodSearchItem[]) => list.map(r => r.id);

describe('applyFoodFilter', () => {
  it('keeps the thresholds the filter pills advertise', () => {
    expect(LOW_CALORIE_LIMIT).toBe(200);
    expect(HIGH_PROTEIN_MIN).toBe(10);
  });

  it('returns the same list for the all filter and for unknown keys', () => {
    expect(applyFoodFilter(results, 'all')).toBe(results);
    expect(applyFoodFilter(results, 'something-else')).toBe(results);
    expect(applyFoodFilter(results, '')).toBe(results);
  });

  it('keeps foods strictly under the calorie limit', () => {
    expect(ids(applyFoodFilter(results, 'under200'))).toEqual(['a', 'b']);
  });

  it('keeps foods at or above the protein minimum', () => {
    expect(ids(applyFoodFilter(results, 'high-protein'))).toEqual(['c', 'd']);
  });

  it('keeps the original order and does not change the input', () => {
    const input = [item('x', 150, 20), item('y', 100, 12)];
    const copy = [...input];
    expect(ids(applyFoodFilter(input, 'under200'))).toEqual(['x', 'y']);
    expect(ids(applyFoodFilter(input, 'high-protein'))).toEqual(['x', 'y']);
    expect(input).toEqual(copy);
  });

  it('handles an empty list', () => {
    expect(applyFoodFilter([], 'under200')).toEqual([]);
    expect(applyFoodFilter([], 'high-protein')).toEqual([]);
  });
});

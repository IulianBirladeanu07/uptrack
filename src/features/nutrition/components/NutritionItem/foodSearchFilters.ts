import type { FoodSearchItem } from '../../../../shared/types';

export const LOW_CALORIE_LIMIT = 200;
export const HIGH_PROTEIN_MIN = 10;

export const applyFoodFilter = (results: FoodSearchItem[], key: string): FoodSearchItem[] => {
  switch (key) {
    case 'under200': return results.filter(item => item.calories < LOW_CALORIE_LIMIT);
    case 'high-protein': return results.filter(item => item.protein >= HIGH_PROTEIN_MIN);
    default: return results;
  }
};

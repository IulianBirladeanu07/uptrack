jest.mock('firebase/firestore', () => ({}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { consolidateFoodData, buildAddUndo, applyAddUndo } from './mealService';

describe('consolidateFoodData', () => {
  test('appends a new food with quantity defaulting to 1 and usageCount 1', () => {
    expect(consolidateFoodData([], [{ id: 'a', calories: 100 }])).toEqual([
      { id: 'a', calories: 100, quantity: 1, usageCount: 1 },
    ]);
  });

  test('sums nutrients numerically when a re-added food has string values', () => {
    const existing = [{
      id: 'a', productName: 'Oats', calories: '250.0', protein: '8.5', carbohydrates: 40, fats: '5.0',
      fiber: '3.0', sugar: '1.0', salt: '0.1', saturatedFats: '1.0', quantity: 100, usageCount: 1,
    }];
    const added = [{
      id: 'a', productName: 'Oats', calories: 250, protein: 8.5, carbohydrates: 40, fats: 5,
      fiber: '3.0', sugar: '1.0', salt: '0.1', saturatedFats: '1.0', quantity: 100,
    }];
    const [merged] = consolidateFoodData(existing, added);
    expect(merged).toMatchObject({
      calories: 500, protein: 17, carbohydrates: 80, fats: 10,
      fiber: 6, sugar: 2, salt: 0.2, saturatedFats: 2, quantity: 200, usageCount: 2,
    });
  });
});

describe('buildAddUndo / applyAddUndo', () => {
  test('restores merged items and removes appended ones', () => {
    const existing = [{ id: 'a', calories: 100, quantity: 1, usageCount: 1 }];
    const added = [{ id: 'a', calories: 100 }, { id: 'b', calories: 50 }];
    const undo = buildAddUndo(existing, added);
    const merged = consolidateFoodData(existing, added);
    expect(applyAddUndo(merged, undo)).toEqual(existing);
  });
});

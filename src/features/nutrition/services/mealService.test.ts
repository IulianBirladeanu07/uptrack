jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
  doc: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { getDoc, getDocs } from 'firebase/firestore';
import {
  consolidateFoodData,
  buildAddUndo,
  applyAddUndo,
  normalizeLoggedFoods,
  fetchRawMealsForDate,
  fetchLast30DaysMeals,
} from './mealService';

const validFood = { id: 'food-1', productName: 'Oats', calories: 100 };

describe('normalizeLoggedFoods', () => {
  test('filters null and malformed meal entries', () => {
    expect(normalizeLoggedFoods([validFood, null, undefined, {}, 'invalid', []])).toEqual([validFood]);
    expect(normalizeLoggedFoods(null)).toEqual([]);
  });
});

describe('meal reads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchRawMealsForDate returns empty slots for a missing day', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(fetchRawMealsForDate('user-1', '2026-10-16')).resolves.toEqual({
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    });
  });

  test('fetchLast30DaysMeals only returns meal groups containing valid foods', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            date: '2026-10-15',
            breakfast: [validFood, null],
            lunch: [{ calories: 50 }],
            dinner: [],
            snacks: [{ id: 'food-2', calories: 25 }],
          }),
        },
      ],
    });

    await expect(fetchLast30DaysMeals('user-1')).resolves.toEqual([
      { date: '2026-10-15', mealType: 'breakfast', foods: [validFood] },
      { date: '2026-10-15', mealType: 'snacks', foods: [{ id: 'food-2', calories: 25 }] },
    ]);
  });
});

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

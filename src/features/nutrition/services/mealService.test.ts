jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
  doc: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  Timestamp: { now: jest.fn(() => ({ seconds: 1 })) },
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { getDoc, getDocs, setDoc, where } from 'firebase/firestore';
import {
  consolidateFoodData,
  buildAddUndo,
  applyAddUndo,
  normalizeLoggedFoods,
  writeMealType,
  fetchRawMealsForDate,
  fetchLast30DaysMeals,
  fetchNutritionForDateRange,
} from './mealService';

const validFood = { id: 'food-1', productName: 'Oats', calories: 100 };

describe('normalizeLoggedFoods', () => {
  test('filters null and malformed meal entries', () => {
    expect(normalizeLoggedFoods([validFood, null, undefined, {}, 'invalid', []])).toEqual([validFood]);
    expect(normalizeLoggedFoods(null)).toEqual([]);
  });
});

describe('writeMealType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('merges only the changed meal type into the day document without reading it first', async () => {
    const foods = [validFood];

    await expect(writeMealType('user-1', 'lunch', foods, '2026-10-16')).resolves.toBe(foods);

    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, data, options] = (setDoc as jest.Mock).mock.calls[0];
    expect(options).toEqual({ merge: true });
    expect(data).toEqual({ uid: 'user-1', date: '2026-10-16', lunch: foods, timestamp: { seconds: 1 } });
  });

  test('writes an emptied meal type so a removal reaches the server', async () => {
    await writeMealType('user-1', 'snacks', [], '2026-10-16');

    expect((setDoc as jest.Mock).mock.calls[0][1]).toEqual(expect.objectContaining({ snacks: [] }));
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

  test('fetchNutritionForDateRange sums all logged meals by day for the requested history window', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            date: '2026-06-08',
            breakfast: [{ id: 'food-1', calories: '300', protein: '10' }],
            lunch: [{ id: 'food-2', calories: 700, protein: 30 }],
            dinner: [],
            snacks: [],
          }),
        },
      ],
    });

    await expect(fetchNutritionForDateRange('user-1', '2026-06-08', '2026-10-18')).resolves.toEqual([
      { date: '2026-06-08', calories: 1000, protein: 40 },
    ]);
    expect(where).toHaveBeenCalledWith('date', '>=', '2026-06-08');
    expect(where).toHaveBeenCalledWith('date', '<=', '2026-10-18');
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

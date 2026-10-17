jest.mock('firebase/firestore', () => ({
  arrayUnion: jest.fn((value) => ({ union: value })),
  doc: jest.fn((_db, collection, id) => ({ collection, id })),
  setDoc: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('../../profile/utils/nutritionPlanEngine', () => ({
  calculateMacros: jest.fn(() => ({ protein: 120, carbs: 250, fats: 70 })),
  calculateWeightChangePlan: jest.fn(() => ({
    bmr: 1500, tdee: 2000, goalCalories: 1900, macros: { protein: 100 }, isEstimate: true,
  })),
}));

import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { calculateMacros, calculateWeightChangePlan } from '../../profile/utils/nutritionPlanEngine';
import { switchToMaintenance } from './phaseService';

describe('switchToMaintenance', () => {
  it('persists a maintenance plan using rounded weight and the supplied calorie target', async () => {
    const entry = { date: '2026-10-17', phase: 'maintenance' } as never;
    await switchToMaintenance('user-1', { age: 30 } as never, { weight: 72.26, kcal: 2200, entry });

    expect(calculateWeightChangePlan).toHaveBeenCalledWith(expect.objectContaining({
      age: 30, currentWeight: 72.3, targetWeight: 72.3, fitnessGoals: 'maintenance',
    }));
    expect(calculateMacros).toHaveBeenCalledWith('maintenance', 2200, 72.3);
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1');
    expect(arrayUnion).toHaveBeenCalledWith(entry);
    expect(setDoc).toHaveBeenCalledWith(
      { collection: 'users', id: 'user-1' },
      expect.objectContaining({
        currentWeight: 72.3,
        targetWeight: 72.3,
        fitnessGoals: 'maintenance',
        targetCalories: 2200,
        maintenanceCalories: 2200,
        targetProtein: 120,
        targetCarbs: 250,
        targetFats: 70,
        lastCalorieAdjustment: null,
        slowEvalPending: false,
        phaseHistory: { union: entry },
      }),
      { merge: true },
    );
    const saved = (setDoc as jest.Mock).mock.calls[0][1];
    expect(saved.weightChangePlan).toMatchObject({
      tdee: 2200, goalCalories: 2200, macros: { protein: 120 }, isEstimate: false,
    });
    expect(new Date(saved.maintenanceUpdatedAt).toISOString()).toBe(saved.maintenanceUpdatedAt);
  });
});

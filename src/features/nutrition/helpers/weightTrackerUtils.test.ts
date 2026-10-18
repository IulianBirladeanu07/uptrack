jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock('react-native', () => ({ Animated: {} }));
jest.mock('../../../shared/firestore/converters', () => ({ userConverter: {} }));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('../helpers/learningCompletionService', () => ({
  evaluateWeeklyProgress: jest.fn(),
  snapshotPreviousWeek: jest.fn(),
  deriveStartWeight: jest.fn(),
  checkAndRunWeeklyEval: jest.fn(),
}));
jest.mock('../services/weightService', () => ({
  __esModule: true,
  default: { getUserWeightData: jest.fn() },
}));

import WeightService from '../services/weightService';
import { loadUserWeightData } from './weightTrackerUtils';

describe('weight tracker date handling', () => {
  it('returns trend entries with local date keys', async () => {
    jest.mocked(WeightService.getUserWeightData).mockResolvedValue({
      currentWeight: 70,
      weightIns: [{
        weekStart: '2026-10-12',
        days: { monday: 70 },
      }],
    });
    const setTrendData = jest.fn();

    await loadUserWeightData(
      'user-id',
      '2026-10-15',
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      setTrendData,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
    );

    expect(setTrendData).toHaveBeenCalledWith([{ date: '2026-10-12', weight: 70 }]);
  });
});
